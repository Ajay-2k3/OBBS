"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, AlertTriangle, Heart } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase/client"
import BloodTypeBadge from "@/components/ui/blood-type-badge"
import UrgencyBadge from "@/components/ui/urgency-badge"

interface CreateBloodRequestFormProps {
  user: {
    id: string
    full_name: string
    blood_type: string
  }
}

export default function CreateBloodRequestForm({ user }: CreateBloodRequestFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [neededByDate, setNeededByDate] = useState<Date>()
  const [formData, setFormData] = useState({
    bloodType: user.blood_type || "",
    unitsNeeded: "",
    urgencyLevel: "",
    hospitalName: "",
    hospitalAddress: "",
    doctorName: "",
    doctorContact: "",
    medicalReason: "",
    notes: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!neededByDate) return

    setLoading(true)

    try {
      const { error } = await supabase.from("blood_requests").insert({
        recipient_id: user.id,
        blood_type: formData.bloodType,
        units_needed: Number.parseInt(formData.unitsNeeded),
        urgency_level: formData.urgencyLevel,
        hospital_name: formData.hospitalName,
        hospital_address: formData.hospitalAddress,
        doctor_name: formData.doctorName,
        doctor_contact: formData.doctorContact,
        medical_reason: formData.medicalReason,
        needed_by_date: format(neededByDate, "yyyy-MM-dd"),
        notes: formData.notes,
        status: "pending",
      })

      if (error) throw error

      router.push("/dashboard?success=blood-request-created")
    } catch (error) {
      console.error("Error creating blood request:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Heart className="h-5 w-5 text-red-600" />
          <span>Blood Request Details</span>
        </CardTitle>
        <CardDescription>Please provide detailed information about your blood requirement.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Blood Type and Units */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bloodType">Blood Type Required *</Label>
              <Select
                value={formData.bloodType}
                onValueChange={(value) => setFormData({ ...formData, bloodType: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select blood type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A+">A+</SelectItem>
                  <SelectItem value="A-">A-</SelectItem>
                  <SelectItem value="B+">B+</SelectItem>
                  <SelectItem value="B-">B-</SelectItem>
                  <SelectItem value="AB+">AB+</SelectItem>
                  <SelectItem value="AB-">AB-</SelectItem>
                  <SelectItem value="O+">O+</SelectItem>
                  <SelectItem value="O-">O-</SelectItem>
                </SelectContent>
              </Select>
              {formData.bloodType && (
                <div className="flex items-center space-x-2 mt-2">
                  <BloodTypeBadge bloodType={formData.bloodType} />
                  <span className="text-sm text-gray-600">Selected blood type</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="unitsNeeded">Units Needed *</Label>
              <Input
                id="unitsNeeded"
                type="number"
                min="1"
                max="10"
                placeholder="e.g., 2"
                value={formData.unitsNeeded}
                onChange={(e) => setFormData({ ...formData, unitsNeeded: e.target.value })}
                required
              />
              <p className="text-xs text-gray-500">Typically 1-4 units per request</p>
            </div>
          </div>

          {/* Urgency and Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="urgencyLevel">Urgency Level *</Label>
              <Select
                value={formData.urgencyLevel}
                onValueChange={(value) => setFormData({ ...formData, urgencyLevel: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select urgency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low - Routine procedure</SelectItem>
                  <SelectItem value="medium">Medium - Scheduled surgery</SelectItem>
                  <SelectItem value="high">High - Urgent medical need</SelectItem>
                  <SelectItem value="critical">Critical - Emergency</SelectItem>
                </SelectContent>
              </Select>
              {formData.urgencyLevel && (
                <div className="flex items-center space-x-2 mt-2">
                  <UrgencyBadge urgency={formData.urgencyLevel as any} />
                  <span className="text-sm text-gray-600">Selected urgency</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Needed By Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !neededByDate && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {neededByDate ? format(neededByDate, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={neededByDate}
                    onSelect={setNeededByDate}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Hospital Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Hospital Information</h3>

            <div className="space-y-2">
              <Label htmlFor="hospitalName">Hospital Name *</Label>
              <Input
                id="hospitalName"
                placeholder="e.g., City General Hospital"
                value={formData.hospitalName}
                onChange={(e) => setFormData({ ...formData, hospitalName: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hospitalAddress">Hospital Address *</Label>
              <Textarea
                id="hospitalAddress"
                placeholder="Full hospital address including city and state"
                value={formData.hospitalAddress}
                onChange={(e) => setFormData({ ...formData, hospitalAddress: e.target.value })}
                rows={2}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="doctorName">Doctor Name *</Label>
                <Input
                  id="doctorName"
                  placeholder="Dr. John Smith"
                  value={formData.doctorName}
                  onChange={(e) => setFormData({ ...formData, doctorName: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="doctorContact">Doctor Contact *</Label>
                <Input
                  id="doctorContact"
                  placeholder="Phone or email"
                  value={formData.doctorContact}
                  onChange={(e) => setFormData({ ...formData, doctorContact: e.target.value })}
                  required
                />
              </div>
            </div>
          </div>

          {/* Medical Information */}
          <div className="space-y-2">
            <Label htmlFor="medicalReason">Medical Reason *</Label>
            <Textarea
              id="medicalReason"
              placeholder="Brief description of why blood is needed (e.g., surgery, anemia treatment, trauma)"
              value={formData.medicalReason}
              onChange={(e) => setFormData({ ...formData, medicalReason: e.target.value })}
              rows={3}
              required
            />
          </div>

          {/* Additional Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Any additional information that might be helpful..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
            />
          </div>

          {/* Important Notice */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <h4 className="font-medium mb-1">Important Notice</h4>
                <p>
                  All blood requests are subject to verification and availability. Our system will automatically match
                  your request with compatible blood inventory and notify relevant blood banks. You will receive updates
                  on the status of your request.
                </p>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={
              loading || !neededByDate || !formData.bloodType || !formData.unitsNeeded || !formData.urgencyLevel
            }
            className="w-full bg-red-600 hover:bg-red-700"
          >
            {loading ? "Submitting Request..." : "Submit Blood Request"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
