
import DashboardLayout from "@/components/layout/dashboard-layout";
import StatsCard from "@/components/ui/stats-card";
import ScheduleDonationForm from "@/components/donations/schedule-donation-form";
import { createClient } from "@/lib/supabase/server";

export default async function DonationsPage() {
  const supabase = await createClient();

  // Fetch user info
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return <DashboardLayout><div className="p-8">Please log in to view your donations.</div></DashboardLayout>;
  }

  // Fetch donation history
  const { data: donationHistory = [] } = await supabase
    .from("donation_history")
    .select("scheduled_date, quantity, status, blood_bank_id, blood_banks(name)")
    .eq("donor_id", user.id)
    .order("scheduled_date", { ascending: false });

  // Fetch blood banks for scheduling
  const { data: bloodBanks = [] } = await supabase
    .from("blood_banks")
    .select("id, name")
    .eq("is_verified", true);

  // Stats
  const totalDonations = donationHistory.length;
  const totalUnitsContributed = donationHistory.reduce((sum, d) => sum + (d.quantity || 0), 0);
  // Next eligible date logic (example)
  const lastDonation = donationHistory[0]?.scheduled_date;
  let nextEligible = "Now";
  if (lastDonation) {
    const daysSinceLast = Math.floor((Date.now() - new Date(lastDonation).getTime()) / (1000 * 60 * 60 * 24));
    nextEligible = daysSinceLast >= 56 ? "Now" : `${56 - daysSinceLast} days`;
  }

  return (
    <DashboardLayout>
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-8">Donations</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatsCard
            title="Total Donations"
            value={totalDonations}
            description="Scheduled and completed"
            icon="heart"
            className="border-red-200"
          />
          <StatsCard
            title="Units Contributed"
            value={totalUnitsContributed}
            description="Total blood units donated"
            icon="award"
            className="border-blue-200"
          />
          <StatsCard
            title="Next Eligible"
            value={nextEligible}
            description="Time until next donation"
            icon="clock"
            className="border-orange-200"
          />
        </div>
        <div className="mb-12">
          <h2 className="text-xl font-semibold mb-4">Donation History</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border rounded-lg">
              <thead>
                <tr>
                  <th className="px-4 py-2 border-b">Date</th>
                  <th className="px-4 py-2 border-b">Quantity</th>
                  <th className="px-4 py-2 border-b">Status</th>
                  <th className="px-4 py-2 border-b">Blood Bank</th>
                </tr>
              </thead>
              <tbody>
                {donationHistory.map((donation, idx) => (
                  <tr key={idx} className="text-center">
                    <td className="px-4 py-2 border-b">{donation.scheduled_date ? new Date(donation.scheduled_date).toLocaleDateString() : "-"}</td>
                    <td className="px-4 py-2 border-b">{donation.quantity}</td>
                    <td className="px-4 py-2 border-b">{donation.status}</td>
                    <td className="px-4 py-2 border-b">{donation.blood_banks?.name || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="mb-12">
          <h2 className="text-xl font-semibold mb-4">Schedule a Donation</h2>
          <ScheduleDonationForm user={user} bloodBanks={bloodBanks} />
        </div>
      </div>
    </DashboardLayout>
  );
}

