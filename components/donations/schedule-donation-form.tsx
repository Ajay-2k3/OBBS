"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Clock, MapPin, Heart } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase/client"

interface ScheduleDonationFormProps {
  user: {
    id: string
    full_name: string
    blood_type: string
    phone: string
  }
  bloodBanks: Array<{
    id: string
    name: string
    address: string
    city: string
    state: string
    operating_hours: string
  }>
}

export default function ScheduleDonationForm({ user, bloodBanks }: ScheduleDonationFormProps) {
  // Ensure bloodBanks is always an array
  const safeBloodBanks = Array.isArray(bloodBanks) ? bloodBanks : []
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date>()
  const [formData, setFormData] = useState({
    bloodBankId: "",
    time: "",
    notes: "",
  })

  const timeSlots = [
    "09:00",
    "09:30",
    "10:00",
    "10:30",
    "11:00",
    "11:30",
    "14:00",
    "14:30",
    "15:00",
    "15:30",
    "16:00",
    "16:30",
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedDate || !formData.bloodBankId || !formData.time) return

    setLoading(true)

    try {
      const { error } = await supabase.from("donations").insert({
        donor_id: user.id,
        blood_bank_id: formData.bloodBankId,
        scheduled_date: format(selectedDate, "yyyy-MM-dd"),
        scheduled_time: formData.time,
        status: "scheduled",
        pre_donation_notes: formData.notes,
      })

      if (error) throw error

      router.push("/dashboard?success=donation-scheduled")
    } catch (error) {
      console.error("Error scheduling donation:", error)
    } finally {
      setLoading(false)
    }
  }

  const selectedBloodBank = safeBloodBanks.find((bank) => bank.id === formData.bloodBankId)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Heart className="h-5 w-5 text-red-600" />
          <span>Donation Details</span>
        </CardTitle>
        <CardDescription>Please provide the details for your blood donation appointment.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Blood Bank Selection */}
          <div className="space-y-2">
            <Label htmlFor="bloodBank">Select Blood Bank *</Label>
            <Select
              value={formData.bloodBankId}
              onValueChange={(value) => setFormData({ ...formData, bloodBankId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a blood bank" />
              </SelectTrigger>
              <SelectContent>
                {safeBloodBanks.map((bank) => (
                  <SelectItem key={bank.id} value={bank.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">{bank.name}</span>
                      <span className="text-sm text-gray-500">
                        {bank.city}, {bank.state}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedBloodBank && (
              <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-start space-x-2">
                  <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium">{selectedBloodBank.name}</p>
                    <p className="text-gray-600">{selectedBloodBank.address}</p>
                    <p className="text-gray-600">
                      {selectedBloodBank.city}, {selectedBloodBank.state}
                    </p>
                    {selectedBloodBank.operating_hours && (
                      <p className="text-gray-600 mt-1">Hours: {selectedBloodBank.operating_hours}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Date Selection */}
          <div className="space-y-2">
            <Label>Select Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn("w-full justify-start text-left font-normal", !selectedDate && "text-muted-foreground")}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => date < new Date() || date < new Date("1900-01-01")}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Time Selection */}
          <div className="space-y-2">
            <Label htmlFor="time">Preferred Time *</Label>
            <Select value={formData.time} onValueChange={(value) => setFormData({ ...formData, time: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a time slot" />
              </SelectTrigger>
              <SelectContent>
                {timeSlots.map((time) => (
                  <SelectItem key={time} value={time}>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4" />
                      <span>{time}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Additional Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Any special requirements or notes for your donation..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>

          {/* Health Reminder */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Before Your Donation</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Get a good night's sleep</li>
              <li>• Eat a healthy meal and stay hydrated</li>
              <li>• Bring a valid ID</li>
              <li>• Avoid alcohol 24 hours before donation</li>
            </ul>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={loading || !selectedDate || !formData.bloodBankId || !formData.time}
            className="w-full bg-red-600 hover:bg-red-700"
          >
            {loading ? "Scheduling..." : "Schedule Donation"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
