-- Function to get compatible blood types for a recipient
CREATE OR REPLACE FUNCTION get_compatible_donors(recipient_blood_type blood_type)
RETURNS TABLE(donor_type blood_type, compatibility_score integer) AS $$
BEGIN
    RETURN QUERY
    SELECT bc.donor_type, bc.compatibility_score
    FROM public.blood_compatibility bc
    WHERE bc.recipient_type = recipient_blood_type 
    AND bc.is_compatible = true
    ORDER BY bc.compatibility_score DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to check blood availability
CREATE OR REPLACE FUNCTION check_blood_availability(
    required_blood_type blood_type,
    required_units integer,
    preferred_city text DEFAULT NULL
)
RETURNS TABLE(
    blood_bank_id uuid,
    blood_bank_name text,
    available_units integer,
    city text,
    distance_priority integer
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        bb.id,
        bb.name,
        COALESCE(SUM(bi.units_available), 0)::integer as available_units,
        bb.city,
        CASE 
            WHEN preferred_city IS NULL THEN 1
            WHEN bb.city ILIKE preferred_city THEN 1
            ELSE 2
        END as distance_priority
    FROM public.blood_banks bb
    LEFT JOIN public.blood_inventory bi ON bb.id = bi.blood_bank_id
    WHERE bb.is_verified = true
    AND (bi.blood_type = required_blood_type OR bi.blood_type IS NULL)
    AND (bi.is_available = true OR bi.is_available IS NULL)
    AND (bi.expiry_date > CURRENT_DATE OR bi.expiry_date IS NULL)
    GROUP BY bb.id, bb.name, bb.city
    HAVING COALESCE(SUM(bi.units_available), 0) >= required_units
    ORDER BY distance_priority, available_units DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to create notification
CREATE OR REPLACE FUNCTION create_notification(
    target_user_id uuid,
    notification_title text,
    notification_message text,
    notification_type text,
    related_record_id uuid DEFAULT NULL,
    related_record_type text DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
    notification_id uuid;
BEGIN
    INSERT INTO public.notifications (
        user_id, title, message, type, related_id, related_type
    ) VALUES (
        target_user_id, notification_title, notification_message, 
        notification_type, related_record_id, related_record_type
    ) RETURNING id INTO notification_id;
    
    RETURN notification_id;
END;
$$ LANGUAGE plpgsql;

-- Function to update blood inventory after donation
CREATE OR REPLACE FUNCTION update_inventory_after_donation()
RETURNS TRIGGER AS $$
BEGIN
    -- Only process completed donations
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        -- Add blood to inventory
        INSERT INTO public.blood_inventory (
            blood_bank_id,
            blood_type,
            units_available,
            collection_date,
            expiry_date,
            donor_id,
            batch_number
        )
        SELECT 
            NEW.blood_bank_id,
            u.blood_type,
            NEW.units_donated,
            CURRENT_DATE,
            CURRENT_DATE + INTERVAL '42 days', -- Blood expires after 42 days
            NEW.donor_id,
            'BATCH-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || NEW.id::text
        FROM public.users u
        WHERE u.id = NEW.donor_id;
        
        -- Update donor's last donation date
        UPDATE public.users 
        SET last_donation_date = CURRENT_DATE
        WHERE id = NEW.donor_id;
        
        -- Create notification for donor
        PERFORM create_notification(
            NEW.donor_id,
            'Donation Completed',
            'Thank you for your blood donation! Your contribution will help save lives.',
            'donation_completed',
            NEW.id,
            'donation'
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for donation completion
CREATE TRIGGER trigger_update_inventory_after_donation
    AFTER UPDATE ON public.donations
    FOR EACH ROW
    EXECUTE FUNCTION update_inventory_after_donation();

-- Function to auto-match blood requests
CREATE OR REPLACE FUNCTION auto_match_blood_request()
RETURNS TRIGGER AS $$
DECLARE
    compatible_inventory RECORD;
    units_to_reserve integer;
BEGIN
    -- Only process new pending requests
    IF NEW.status = 'pending' THEN
        -- Find compatible blood inventory
        FOR compatible_inventory IN
            SELECT bi.id, bi.blood_bank_id, bi.units_available, bc.compatibility_score
            FROM public.blood_inventory bi
            JOIN public.blood_compatibility bc ON bi.blood_type = bc.donor_type
            WHERE bc.recipient_type = NEW.blood_type
            AND bc.is_compatible = true
            AND bi.is_available = true
            AND bi.expiry_date > CURRENT_DATE
            AND bi.units_available > 0
            ORDER BY bc.compatibility_score DESC, bi.expiry_date ASC
        LOOP
            -- Calculate units to reserve
            units_to_reserve := LEAST(compatible_inventory.units_available, NEW.units_needed - NEW.fulfilled_units);
            
            -- Reserve the blood
            UPDATE public.blood_inventory
            SET units_reserved = units_reserved + units_to_reserve,
                units_available = units_available - units_to_reserve
            WHERE id = compatible_inventory.id;
            
            -- Update request
            UPDATE public.blood_requests
            SET fulfilled_units = fulfilled_units + units_to_reserve,
                blood_bank_id = compatible_inventory.blood_bank_id,
                status = CASE 
                    WHEN fulfilled_units + units_to_reserve >= units_needed THEN 'approved'
                    ELSE 'pending'
                END
            WHERE id = NEW.id;
            
            -- Exit if request is fully fulfilled
            IF NEW.fulfilled_units + units_to_reserve >= NEW.units_needed THEN
                EXIT;
            END IF;
        END LOOP;
        
        -- Create notification for recipient
        PERFORM create_notification(
            NEW.recipient_id,
            'Blood Request Received',
            'Your blood request has been received and we are processing it.',
            'request_received',
            NEW.id,
            'blood_request'
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-matching
CREATE TRIGGER trigger_auto_match_blood_request
    AFTER INSERT ON public.blood_requests
    FOR EACH ROW
    EXECUTE FUNCTION auto_match_blood_request();
