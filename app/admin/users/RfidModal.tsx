"use client";

import { useState } from "react";
import PinModal from "@/app/components/PinModal";

export default function RfidModal({
  open,
  userId,
  onClose,
  onSuccess,
}: {
  open: boolean;
  userId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [pinOpen, setPinOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  async function handleProvision(pin: string) {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/provision-card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, pin }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Provisioning failed");
        setLoading(false);
        return;
      }

      /**
       * IMPORTANT:
       * data.cardSecret (or similar) will be returned by backend
       * This is what will be written to the NFC card later
       */

      // 🔜 Future: Web NFC write happens here

      // Confirm provisioning (hash stored in DB)
      await fetch("/api/admin/provision-card/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          cardSecret: data.cardSecret,
        }),
      });

      setPinOpen(false);
      onClose();
      onSuccess();
    } catch (err) {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* MAIN MODAL */}
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60">
        <div className="w-full max-w-sm rounded-xl bg-[#0b1226] p-6 border border-white/10">
          <h2 className="text-lg font-semibold mb-2">Provision NFC Card</h2>

          <p className="text-sm text-gray-400 mb-5">
            This will assign a new NFC card to the selected user.
            The old card (if any) will be invalidated.
          </p>

          {error && (
            <p className="mb-3 text-sm text-red-400 text-center">{error}</p>
          )}

          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 rounded-lg border border-white/10 py-2 text-sm"
            >
              Cancel
            </button>

            <button
              onClick={() => setPinOpen(true)}
              disabled={loading}
              className="flex-1 rounded-lg bg-blue-600 py-2 text-sm font-medium"
            >
              Continue
            </button>
          </div>
        </div>
      </div>

      {/* PIN CONFIRMATION */}
      <PinModal
        open={pinOpen}
        loading={loading}
        error={error}
        onClose={() => {
          setPinOpen(false);
          setError("");
        }}
        onSubmit={handleProvision}
      />
    </>
  );
}
