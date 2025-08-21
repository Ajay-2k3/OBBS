import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import StatsCard from "@/components/ui/stats-card"
import BloodTypeBadge from "@/components/ui/blood-type-badge"
import { Heart, Search, CheckCircle, Clock, XCircle, Building, Hospital, AlertTriangle } from "lucide-react"

export default async function BloodRequestsHistoryPage() {
  const supabase = await createClient()

  // Get user session
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get user profile
  const { data: profile } = await supabase.from("users").select("*").eq("id", user.id).single()

  if (!profile) {
    redirect("/auth/login")
  }

  let requests = []
  let totalRequests = 0
  let fulfilledRequests = 0
  let pendingRequests = 0
  let rejectedRequests = 0

  if (profile.role === 'recipient') {
    // Get requests for this recipient
    const { data: recipientRequests = [] } = await supabase
      .from("blood_requests")
      .select(`
        *,
        blood_bank:blood_banks(name, city)
      `)
      .eq("requester_id", user.id)
      .order("created_at", { ascending: false })

    requests = recipientRequests || []
  } else if (profile.role === 'admin') {
    // Admins can see all requests
    const { data: allRequests = [] } = await supabase
      .from("blood_requests")
      .select(`
        *,
        requester:users(full_name, email, phone),
        blood_bank:blood_banks(name, city)
      `)
      .order("created_at", { ascending: false })
      .limit(100)

    requests = allRequests || []
  } else if (profile.role === 'blood_bank') {
    // Blood bank sees requests sent to them
    const { data: bloodBank } = await supabase
      .from("blood_banks")
      .select("id, name")
      .eq("admin_id", user.id)
      .single()

    if (bloodBank) {
      const { data: bankRequests = [] } = await supabase
        .from("blood_requests")
        .select(`
          *,
          requester:users(full_name, email, phone)
        `)
        .eq("blood_bank_id", bloodBank.id)
        .order("created_at", { ascending: false })

      requests = bankRequests || []
    }
  }

  // Calculate statistics
  totalRequests = requests.length
  fulfilledRequests = requests.filter(r => r.status === 'fulfilled').length
  pendingRequests = requests.filter(r => r.status === 'pending').length
  rejectedRequests = requests.filter(r => r.status === 'rejected').length

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'fulfilled': return 'secondary'
      case 'pending': return 'outline'
      case 'rejected': return 'destructive'
      case 'processing': return 'default'
      default: return 'outline'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'fulfilled': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />
      case 'rejected': return <XCircle className="h-4 w-4 text-red-500" />
      case 'processing': return <AlertTriangle className="h-4 w-4 text-blue-500" />
      default: return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getUrgencyBadge = (level: number) => {
    if (level >= 4) return { variant: "destructive" as const, label: "Critical" }
    if (level === 3) return { variant: "default" as const, label: "High" }
    if (level === 2) return { variant: "outline" as const, label: "Medium" }
    return { variant: "secondary" as const, label: "Normal" }
  }

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Blood Request History</h1>
            <p className="text-gray-600 mt-2">
              {profile.role === 'recipient' && "Track your blood requests and their status"}
              {profile.role === 'admin' && "System-wide blood request history"}
              {profile.role === 'blood_bank' && "Requests sent to your blood bank"}
            </p>
          </div>
        </div>

        {/* Request Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Total Requests"
            value={totalRequests}
            icon="heart"
            className="border-blue-200"
          />
          <StatsCard
            title="Fulfilled"
            value={fulfilledRequests}
            description="Successfully completed"
            icon="checkCircle"
            className="border-green-200"
          />
          <StatsCard
            title="Pending"
            value={pendingRequests}
            description="Awaiting response"
            icon="clock"
            className="border-yellow-200"
          />
          <StatsCard
            title="Success Rate"
            value={totalRequests > 0 ? Math.round((fulfilledRequests / totalRequests) * 100) : 0}
            description="Fulfillment percentage"
            icon="trendingUp"
            className="border-purple-200"
          />
        </div>

        {/* Active Requests Alert */}
        {pendingRequests > 0 && (
          <Card className="mb-6 border-yellow-200 bg-yellow-50">
            <CardHeader>
              <CardTitle className="flex items-center text-yellow-800">
                <Clock className="h-5 w-5 mr-2" />
                Active Requests ({pendingRequests})
              </CardTitle>
              <CardDescription className="text-yellow-700">
                You have pending requests that are being processed
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {requests.filter(r => r.status === 'pending').slice(0, 3).map((request) => (
                  <div key={request.id} className="bg-white p-4 rounded border flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
                        <Heart className="h-5 w-5 text-yellow-600" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {request.patient_name}
                        </div>
                        <div className="text-sm text-gray-600 flex items-center">
                          <Hospital className="h-3 w-3 mr-1" />
                          {request.hospital_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          Requested: {new Date(request.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <BloodTypeBadge bloodType={request.blood_group} />
                      <div className="text-sm font-medium text-gray-900">
                        {request.quantity} units
                      </div>
                      <Badge variant="outline">Pending</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder={`Search by ${profile.role === 'recipient' ? 'hospital or patient name' : 'patient name, hospital, or requester'}...`}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <select className="px-3 py-2 border border-gray-300 rounded-md">
                  <option value="">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="fulfilled">Fulfilled</option>
                  <option value="rejected">Rejected</option>
                </select>
                <select className="px-3 py-2 border border-gray-300 rounded-md">
                  <option value="">All Blood Groups</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
                <select className="px-3 py-2 border border-gray-300 rounded-md">
                  <option value="">All Urgency</option>
                  <option value="5">Critical (5)</option>
                  <option value="4">High (4)</option>
                  <option value="3">Medium (3)</option>
                  <option value="2">Low (2)</option>
                  <option value="1">Normal (1)</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Requests Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Heart className="h-5 w-5 mr-2" />
              Request History
            </CardTitle>
            <CardDescription>
              {profile.role === 'recipient' && "Your complete blood request history"}
              {profile.role === 'admin' && "System-wide blood request records"}
              {profile.role === 'blood_bank' && "Requests sent to your blood bank"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {profile.role !== 'recipient' && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Requester
                      </th>
                    )}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Patient Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Blood Group
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Urgency
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Request Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Blood Bank
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {requests.map((request) => {
                    const urgencyBadge = getUrgencyBadge(request.urgency_level)
                    return (
                      <tr key={request.id} className="hover:bg-gray-50">
                        {profile.role !== 'recipient' && (
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                  <span className="text-sm font-medium text-gray-700">
                                    {request.requester?.full_name?.charAt(0)}
                                  </span>
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {request.requester?.full_name}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {request.requester?.email}
                                </div>
                              </div>
                            </div>
                          </td>
                        )}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {request.patient_name}
                            </div>
                            <div className="text-sm text-gray-500 flex items-center">
                              <Hospital className="h-3 w-3 mr-1" />
                              {request.hospital_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {request.medical_reason && (
                                <span className="truncate max-w-xs" title={request.medical_reason}>
                                  {request.medical_reason.length > 20 
                                    ? request.medical_reason.substring(0, 20) + '...'
                                    : request.medical_reason
                                  }
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <BloodTypeBadge bloodType={request.blood_group} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {request.quantity} unit{request.quantity > 1 ? 's' : ''}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant={urgencyBadge.variant}>
                            {urgencyBadge.label}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {getStatusIcon(request.status)}
                            <Badge variant={getStatusBadge(request.status) as any} className="ml-2">
                              {request.status?.charAt(0).toUpperCase() + request.status?.slice(1)}
                            </Badge>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div>{new Date(request.requested_date || request.created_at).toLocaleDateString()}</div>
                          {request.required_by && (
                            <div className="text-xs text-gray-500">
                              Due: {new Date(request.required_by).toLocaleDateString()}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Building className="h-4 w-4 mr-2 text-gray-400" />
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {request.blood_bank?.name || 'Not assigned'}
                              </div>
                              <div className="text-sm text-gray-500">
                                {request.blood_bank?.city}
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            
            {requests.length === 0 && (
              <div className="text-center py-8">
                <Heart className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No request history</h3>
                <p className="text-gray-500">
                  {profile.role === 'recipient' 
                    ? "Your blood request history will appear here after you submit your first request."
                    : "Blood request records will appear here when requests are submitted."
                  }
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
