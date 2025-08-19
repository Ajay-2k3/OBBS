"use client";

export default function BloodBankNotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="text-6xl mb-4 text-yellow-500">
        <span>⚠️</span>
      </div>
      <h2 className="text-2xl font-semibold mb-2">Blood Bank Not Found</h2>
      <p className="mb-4 text-gray-500">You don't seem to be associated with a blood bank.</p>
      <button className="bg-black text-white px-4 py-2 rounded" onClick={() => window.location.href = '/profile'}>
        Contact Administrator
      </button>
    </div>
  );
}
