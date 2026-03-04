"use client";

import { useState } from "react";

export default function CreateMerchantModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleCreate() {
    setLoading(true);

    const res = await fetch("/api/admin/merchants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    setLoading(false);

    if (res.ok) {
      onCreated();
      onClose();
    } else {
      alert("Failed to create merchant");
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center">
      <div className="bg-black p-6 rounded-lg w-96">
        <h2 className="text-xl font-bold mb-4">Create Merchant</h2>

        <input
          className="w-full mb-3 p-2 bg-black/40 rounded"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <input
          className="w-full mb-3 p-2 bg-black/40 rounded"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          className="w-full mb-4 p-2 bg-black/40 rounded"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <div className="flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 rounded"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 rounded"
          >
            {loading ? "Creating..." : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}
