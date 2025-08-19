import { createClient } from "@/lib/supabase/server";
import DashboardLayout from "@/components/layout/dashboard-layout";

export default async function CommunityPage() {
  const supabase = await createClient();

  // Community Feed
  const { data: communityFeed = [] } = await supabase
    .from("community_feed")
    .select("user, message, date")
    .order("date", { ascending: false });

  // Events & Announcements
  const { data: events = [] } = await supabase
    .from("events")
    .select("title, description, date")
    .order("date", { ascending: false });

  // Leaderboard
  const { data: leaderboard = [] } = await supabase
    .from("leaderboard")
    .select("name, donations")
    .order("donations", { ascending: false });

  // Member Directory
  const { data: memberDirectory = [] } = await supabase
    .from("users")
    .select("full_name, role")
    .order("full_name");

  // Discussion Board
  const { data: discussionBoard = [] } = await supabase
    .from("discussion_board")
    .select("user, question, answer")
    .order("created_at", { ascending: false });

  return (
    <DashboardLayout>
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-8">Community</h1>
        <div className="mb-12">
          <h2 className="text-xl font-semibold mb-4">Community Feed</h2>
          <div className="space-y-4">
            {(communityFeed ?? []).map((post, idx) => (
              <div key={idx} className="bg-white border rounded-lg p-4 shadow-sm">
                <div className="font-semibold text-blue-700">{post.user}</div>
                <div className="text-gray-700">{post.message}</div>
                <div className="text-xs text-gray-400 mt-1">{post.date}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="mb-12">
          <h2 className="text-xl font-semibold mb-4">Events & Announcements</h2>
          {((events ?? [])).map((event, idx) => (
            <div key={idx} className="bg-white border rounded-lg p-4 shadow-sm mb-4">
              <div className="font-semibold text-green-700">{event.title}</div>
              <div className="text-gray-700">{event.description}</div>
              <div className="text-xs text-gray-400 mt-1">{event.date}</div>
            </div>
          ))}
        </div>
        <div className="mb-12">
          <h2 className="text-xl font-semibold mb-4">Leaderboard</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border rounded-lg">
              <thead>
                <tr>
                  <th className="px-4 py-2 border-b">Name</th>
                  <th className="px-4 py-2 border-b">Donations</th>
                </tr>
              </thead>
              <tbody>
                {((leaderboard ?? [])).map((entry, idx) => (
                  <tr key={idx} className="text-center">
                    <td className="px-4 py-2 border-b">{entry.name}</td>
                    <td className="px-4 py-2 border-b">{entry.donations}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="mb-12">
          <h2 className="text-xl font-semibold mb-4">Member Directory</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border rounded-lg">
              <thead>
                <tr>
                  <th className="px-4 py-2 border-b">Name</th>
                  <th className="px-4 py-2 border-b">Role</th>
                </tr>
              </thead>
              <tbody>
                {((memberDirectory ?? [])).map((member, idx) => (
                  <tr key={idx} className="text-center">
                    <td className="px-4 py-2 border-b">{member.full_name}</td>
                    <td className="px-4 py-2 border-b">{member.role}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="mb-12">
          <h2 className="text-xl font-semibold mb-4">Discussion Board</h2>
          <div className="space-y-4">
            {((discussionBoard ?? [])).map((post, idx) => (
              <div key={idx} className="bg-white border rounded-lg p-4 shadow-sm">
                <div className="font-semibold text-blue-700">{post.user}</div>
                <div className="text-gray-700 font-medium">Q: {post.question}</div>
                <div className="text-green-700 mt-1">A: {post.answer}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
