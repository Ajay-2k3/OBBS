import { createClient } from "@/lib/supabase/server";
import InventoryModal from "@/components/blood-management/inventory-modal";
import { useState } from "react";

export default async function BloodBankDashboardPage() {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return <div className="p-8">Please log in to view your blood bank dashboard.</div>;
  }

  // Get blood bank profile for this user
  const { data: bloodBank } = await supabase
    .from("blood_banks")
    .select("*, admin:users(full_name)")
    .eq("admin_id", user.id)
    .single();

  // Get inventory
  const { data: inventory = [] } = await supabase
    .from("blood_inventory")
    .select("blood_group, quantity, expiry_date, status")
    .eq("blood_bank_id", bloodBank?.id);

  // Get donations
  const { data: donations = [] } = await supabase
    .from("donation_history")
    .select("donor:users(full_name), scheduled_date, quantity, status")
    .eq("blood_bank_id", bloodBank?.id);

  // Get requests
  const { data: requests = [] } = await supabase
    .from("blood_requests")
    .select("requester:users(full_name), blood_group, quantity, status")
    .eq("blood_bank_id", bloodBank?.id);

  // Get staff
  const { data: staff = [] } = await supabase
    .from("users")
    .select("full_name, role")
    .eq("blood_bank_id", bloodBank?.id);

  // Get notifications
  const { data: notifications = [] } = await supabase
    .from("notifications")
    .select("message, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  // Loading and error states (scaffold)
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // Modal states (scaffold)
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [editInventoryData, setEditInventoryData] = useState(null);

  // Handler for saving inventory
  async function handleSaveInventory(data) {
    // If editInventoryData exists, update; else, insert
    if (editInventoryData) {
      await supabase.from("blood_inventory").update(data).eq("id", editInventoryData.id);
    } else {
      await supabase.from("blood_inventory").insert({ ...data, blood_bank_id: bloodBank?.id });
    }
    setShowInventoryModal(false);
    setEditInventoryData(null);
    // Optionally, refresh inventory list
  }

  // Donation Actions (scaffold)
  // async function handleDonationAction(id, action) {
  //   let status = "";
  //   if (action === "approve") status = "approved";
  //   if (action === "reject") status = "rejected";
  //   if (action === "complete") status = "completed";
  //   await supabase.from("donation_history").update({ status }).eq("id", id);
  //   // Optionally, refresh donations list
  // }

  return (
    <DashboardLayout>
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-6">Blood Bank Dashboard</h1>
        {/* Profile Edit Modal (scaffold) */}
        {showProfileModal && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded shadow w-full max-w-md">
              <h2 className="text-lg font-bold mb-4">Edit Profile</h2>
              {/* Profile form fields here */}
              <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded">Save</button>
              <button className="mt-2 px-4 py-2 bg-gray-300 rounded" onClick={() => setShowProfileModal(false)}>Cancel</button>
            </div>
          </div>
        )}
        {/* Blood Bank Info */}
        <div className="mb-8 p-6 bg-white rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-2">Profile</h2>
          <div>Name: {bloodBank?.name}</div>
          <div>Address: {bloodBank?.address}</div>
          <div>Phone: {bloodBank?.phone}</div>
          <div>Email: {bloodBank?.email}</div>
          <div>License: {bloodBank?.license_number}</div>
          <div>Capacity: {bloodBank?.capacity} units</div>
          <div>Admin: {bloodBank?.admin?.full_name}</div>
          <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded" onClick={() => setShowProfileModal(true)}>Edit Profile</button>
        </div>
        {/* Inventory Add/Edit Modal */}
        {showInventoryModal && (
          <InventoryModal
            initialData={editInventoryData}
            onSave={handleSaveInventory}
            onClose={() => { setShowInventoryModal(false); setEditInventoryData(null); }}
          />
        )}
        {/* Inventory */}
        <div className="mb-8 p-6 bg-white rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-2">Inventory</h2>
          <table className="min-w-full">
            <thead>
              <tr>
                <th>Type</th>
                <th>Quantity</th>
                <th>Expiry</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {(inventory ?? []).map((item, idx) => (
                <tr key={idx}>
                  <td>{item.blood_group}</td>
                  <td>{item.quantity}</td>
                  <td>{item.expiry_date}</td>
                  <td>{item.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <button className="mt-4 px-4 py-2 bg-green-600 text-white rounded" /* onClick={() => setShowInventoryModal(true)} */>Add Inventory</button>
        </div>
        {/* Donations */}
        <div className="mb-8 p-6 bg-white rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-2">Donations</h2>
          <table className="min-w-full">
            <thead>
              <tr>
                <th>Donor</th>
                <th>Date</th>
                <th>Quantity</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {(donations ?? []).map((donation, idx) => (
                <tr key={idx}>
                  <td>{donation.donor?.full_name}</td>
                  <td>{donation.scheduled_date}</td>
                  <td>{donation.quantity}</td>
                  <td>{donation.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {/* Donation Actions (scaffold) */}
          {(donations ?? []).map((donation, idx) => (
            <div key={idx} className="flex gap-2 mt-2">
              <button className="px-2 py-1 bg-blue-500 text-white rounded" /* onClick={() => handleDonationAction(donation.id, 'approve')} */>Approve</button>
              <button className="px-2 py-1 bg-gray-400 text-white rounded" /* onClick={() => handleDonationAction(donation.id, 'reject')} */>Reject</button>
              <button className="px-2 py-1 bg-green-600 text-white rounded" /* onClick={() => handleDonationAction(donation.id, 'complete')} */>Mark Completed</button>
            </div>
          ))}
        </div>
        {/* Requests */}
        <div className="mb-8 p-6 bg-white rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-2">Blood Requests</h2>
          <table className="min-w-full">
            <thead>
              <tr>
                <th>Requester</th>
                <th>Type</th>
                <th>Quantity</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {(requests ?? []).map((req, idx) => (
                <tr key={idx}>
                  <td>{req.requester?.full_name}</td>
                  <td>{req.blood_group}</td>
                  <td>{req.quantity}</td>
                  <td>{req.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {/* Request Actions (scaffold) */}
          {(requests ?? []).map((req, idx) => (
            <div key={idx} className="flex gap-2 mt-2">
              <button className="px-2 py-1 bg-green-600 text-white rounded">Fulfill</button>
              <button className="px-2 py-1 bg-gray-400 text-white rounded">Reject</button>
              <button className="px-2 py-1 bg-blue-500 text-white rounded">Update Status</button>
            </div>
          ))}
        </div>
        {/* Staff Add Modal (scaffold) */}
        {showStaffModal && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded shadow w-full max-w-md">
              <h2 className="text-lg font-bold mb-4">Add Staff</h2>
              {/* Staff form fields here */}
              <button className="mt-4 px-4 py-2 bg-purple-600 text-white rounded">Add</button>
              <button className="mt-2 px-4 py-2 bg-gray-300 rounded" onClick={() => setShowStaffModal(false)}>Cancel</button>
            </div>
          </div>
        )}
        {/* Staff */}
        <div className="mb-8 p-6 bg-white rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-2">Staff & Admins</h2>
          <ul>
            {(staff ?? []).map((person, idx) => (
              <li key={idx}>{person.full_name} - {person.role}</li>
            ))}
          </ul>
          <button className="mt-4 px-4 py-2 bg-purple-600 text-white rounded" onClick={() => setShowStaffModal(true)}>Add Staff</button>
        </div>
        {/* Notifications */}
        <div className="mb-8 p-6 bg-white rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-2">Notifications</h2>
          <ul>
            {(notifications ?? []).map((note, idx) => (
              <li key={idx}>{note.message} <span className="text-xs text-gray-400">({note.created_at})</span></li>
            ))}
          </ul>
          {/* Notification Actions (scaffold) */}
          {(notifications ?? []).map((note, idx) => (
            <div key={idx} className="flex gap-2 mt-2">
              <button className="px-2 py-1 bg-gray-400 text-white rounded">Mark Read</button>
              <button className="px-2 py-1 bg-red-600 text-white rounded">Delete</button>
            </div>
          ))}
        </div>
        {/* Analytics */}
        <div className="mb-8 p-6 bg-white rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-2">Analytics</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-blue-100 p-4 rounded">Total Units: {(inventory ?? []).reduce((sum, i) => sum + i.quantity, 0)}</div>
            <div className="bg-green-100 p-4 rounded">Requests Fulfilled: {(requests ?? []).filter(r => r.status === "fulfilled").length}</div>
            <div className="bg-red-100 p-4 rounded">Donations Received: {(donations ?? []).length}</div>
          </div>
        </div>
        {/* Loading/Error States (scaffold) */}
        {loading && <div className="text-center py-8">Loading...</div>}
        {error && <div className="text-center py-8 text-red-600">{error}</div>}
      </div>
    </DashboardLayout>
  );
}
