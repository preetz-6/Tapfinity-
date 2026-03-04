"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Tx = {
  id: string;
  amount: number;
  status: string;
  createdAt: string;
  user: {
    name: string;
    email: string;
  };
};

export default function MerchantTransactionsPage() {
  const { id } = useParams();
  const [txs, setTxs] = useState<Tx[]>([]);

  useEffect(() => {
    fetch(`/api/merchant/transactions?merchantId=${id}`)
      .then((res) => res.json())
      .then((data) => setTxs(data.transactions || []));
  }, [id]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">
        Merchant Transactions
      </h1>

      <div className="bg-black/40 rounded-lg overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-black/60">
            <tr>
              <th className="p-3">User</th>
              <th className="p-3">Amount</th>
              <th className="p-3">Status</th>
              <th className="p-3">Time</th>
            </tr>
          </thead>
          <tbody>
            {txs.map((tx) => (
              <tr key={tx.id} className="border-t border-white/10">
                <td className="p-3">
                  {tx.user.name}
                  <div className="text-sm text-gray-400">
                    {tx.user.email}
                  </div>
                </td>
                <td className="p-3">₹ {tx.amount}</td>
                <td className="p-3">{tx.status}</td>
                <td className="p-3">
                  {new Date(tx.createdAt).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
