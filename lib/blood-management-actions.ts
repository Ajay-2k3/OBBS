"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function updateDonationStatus(donationId: string, status: string, data?: any) {
  const supabase = await createClient()

  try {
    const updateData: any = { status }
    if (data) {
      Object.assign(updateData, data)
    }

    const { error } = await supabase.from("donations").update(updateData).eq("id", donationId)

    if (error) throw error

    revalidatePath("/dashboard")
    revalidatePath("/donations")

    return { success: true }
  } catch (error) {
    console.error("Error updating donation:", error)
    return { error: "Failed to update donation status" }
  }
}

export async function updateBloodRequestStatus(requestId: string, status: string, bloodBankId?: string) {
  const supabase = await createClient()

  try {
    const updateData: any = { status }
    if (bloodBankId) {
      updateData.blood_bank_id = bloodBankId
    }

    const { error } = await supabase.from("blood_requests").update(updateData).eq("id", requestId)

    if (error) throw error

    revalidatePath("/dashboard")
    revalidatePath("/blood-requests")

    return { success: true }
  } catch (error) {
    console.error("Error updating blood request:", error)
    return { error: "Failed to update blood request status" }
  }
}

export async function addBloodInventory(data: {
  bloodBankId: string
  bloodType: string
  unitsAvailable: number
  expiryDate: string
  collectionDate: string
  donorId?: string
  batchNumber?: string
}) {
  const supabase = await createClient()

  try {
    const { error } = await supabase.from("blood_inventory").insert({
      blood_bank_id: data.bloodBankId,
      blood_type: data.bloodType,
      units_available: data.unitsAvailable,
      expiry_date: data.expiryDate,
      collection_date: data.collectionDate,
      donor_id: data.donorId,
      batch_number: data.batchNumber,
      testing_status: "pending",
      is_available: true,
    })

    if (error) throw error

    revalidatePath("/dashboard")
    revalidatePath("/inventory")

    return { success: true }
  } catch (error) {
    console.error("Error adding blood inventory:", error)
    return { error: "Failed to add blood inventory" }
  }
}
