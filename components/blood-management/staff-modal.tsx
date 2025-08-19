"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface StaffModalProps {
  staff: Array<{ id: string; full_name: string; email: string }>;
  onAdd: (email: string) => void;
  onRemove: (id: string) => void;
}

export default function StaffModal({ staff, onAdd, onRemove }: StaffModalProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAdd = async () => {
    setLoading(true);
    await onAdd(email);
    setEmail("");
    setLoading(false);
  };

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-2">Manage Staff</h2>
      <div className="mb-4">
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="Staff Email"
          className="border px-2 py-1 rounded w-full"
        />
        <Button onClick={handleAdd} disabled={loading || !email} className="mt-2 w-full">
          {loading ? "Adding..." : "Add Staff"}
        </Button>
      </div>
      <ul className="divide-y">
        {staff.map(member => (
          <li key={member.id} className="flex items-center justify-between py-2">
            <span>{member.full_name} ({member.email})</span>
            <Button variant="destructive" onClick={() => onRemove(member.id)} size="sm">
              Remove
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
