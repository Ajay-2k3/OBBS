import { useState } from "react";

export default function InventoryModal({ onSave, onClose, initialData }) {
  const [bloodGroup, setBloodGroup] = useState(initialData?.blood_group || "");
  const [quantity, setQuantity] = useState(initialData?.quantity || 1);
  const [expiryDate, setExpiryDate] = useState(initialData?.expiry_date || "");
  const [status, setStatus] = useState(initialData?.status || "available");

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded shadow w-full max-w-md">
        <h2 className="text-lg font-bold mb-4">{initialData ? "Edit Inventory" : "Add Inventory"}</h2>
        <form
          onSubmit={e => {
            e.preventDefault();
            onSave({ blood_group: bloodGroup, quantity, expiry_date: expiryDate, status });
          }}
        >
          <div className="mb-2">
            <label className="block mb-1">Blood Group</label>
            <input className="border px-2 py-1 w-full" value={bloodGroup} onChange={e => setBloodGroup(e.target.value)} required />
          </div>
          <div className="mb-2">
            <label className="block mb-1">Quantity</label>
            <input type="number" className="border px-2 py-1 w-full" value={quantity} onChange={e => setQuantity(Number(e.target.value))} min={1} required />
          </div>
          <div className="mb-2">
            <label className="block mb-1">Expiry Date</label>
            <input type="date" className="border px-2 py-1 w-full" value={expiryDate} onChange={e => setExpiryDate(e.target.value)} required />
          </div>
          <div className="mb-2">
            <label className="block mb-1">Status</label>
            <select className="border px-2 py-1 w-full" value={status} onChange={e => setStatus(e.target.value)}>
              <option value="available">Available</option>
              <option value="reserved">Reserved</option>
              <option value="expired">Expired</option>
              <option value="used">Used</option>
            </select>
          </div>
          <div className="flex gap-2 mt-4">
            <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded">Save</button>
            <button type="button" className="px-4 py-2 bg-gray-300 rounded" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
