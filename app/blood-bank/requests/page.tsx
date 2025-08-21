import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import BloodTypeBadge from "@/components/ui/blood-type-badge"
import StatusBadge from "@/components/ui/status-badge"
import { CalendarDays, MapPin, Phone, User, Droplets, Clock } from "lucide-react"

// Urgency Badge Component
function UrgencyBadge({ urgency }: { urgency: string }) {
  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200'
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <Badge className={`${getUrgencyColor(urgency)} font-medium`}>
      {urgency}
    </Badge>
  )
}

export default async function BloodBankRequestsPage() {
  const supabase = await createClient()

  // Get blood requests assigned to current blood bank
  const { data: requests } = await supabase
    .from('blood_requests')
    .select(`
      id,
      blood_type,
      quantity_needed,
      urgency,
      needed_by,
      notes,
      status,
      created_at,
      recipient:recipient_id (
        first_name,
        last_name,
        phone,
        city,
        state
      )
    `)
    .order('created_at', { ascending: false })

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Blood Requests</h1>
        <p className="text-gray-600">Manage incoming blood requests for your blood bank</p>
      </div>

      <div className="grid gap-6">
        {requests && requests.length > 0 ? (
          requests.map((request: any) => (
            <Card key={request.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Droplets className="h-6 w-6 text-red-500" />
                    <div>
                      <CardTitle className="text-lg">Blood Request #{request.id.slice(-8)}</CardTitle>
                      <CardDescription className="text-sm text-gray-500">
                        {request.recipient ? 
                          `${request.recipient.first_name} ${request.recipient.last_name}` : 
                          'Anonymous Request'
                        }
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <UrgencyBadge urgency={request.urgency} />
                    <StatusBadge status={request.status} />
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-2 text-sm">
                    <BloodTypeBadge bloodType={request.blood_type} />
                    <span className="font-medium">{request.quantity_needed} units</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <CalendarDays className="h-4 w-4" />
                    <span>Needed by: {new Date(request.needed_by).toLocaleDateString()}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="h-4 w-4" />
                    <span>Created: {new Date(request.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                {request.recipient && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="h-4 w-4" />
                      <span>{request.recipient.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="h-4 w-4" />
                      <span>{request.recipient.city}, {request.recipient.state}</span>
                    </div>
                  </div>
                )}

                {request.notes && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700">
                      <strong>Notes:</strong> {request.notes}
                    </p>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button size="sm" className="bg-red-600 hover:bg-red-700">
                    Fulfill Request
                  </Button>
                  <Button size="sm" variant="outline">
                    Contact Recipient
                  </Button>
                  <Button size="sm" variant="outline">
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="text-center py-8">
              <Droplets className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Blood Requests</h3>
              <p className="text-gray-500">No blood requests have been received yet.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
