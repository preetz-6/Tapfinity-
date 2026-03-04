"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type Tx = {
  merchant: string;
  amount: number;
};

export default function MerchantChart() {
  const [data, setData] = useState<any[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    fetch("/api/user/transactions")
      .then(r => r.json())
      .then((data: { transactions: Tx[] }) => {
        const txs = data.transactions ?? [];
        const map: Record<string, number> = {};

        txs.forEach(tx => {
          map[tx.merchant] =
            (map[tx.merchant] || 0) + tx.amount;
        });

        const formatted = Object.entries(map)
          .map(([merchant, amount]) => ({
            merchant,
            amount,
          }))
          .sort((a, b) => b.amount - a.amount)
          .slice(0, 5);

        setData(formatted);
      });
  }, []);

  if (!mounted) return null;

  return (
    <div className="rounded-xl bg-white/5 border border-white/10 p-4">
      <h3 className="text-sm text-gray-400 mb-3">
        Top Merchants
      </h3>

      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data}>
          <XAxis dataKey="merchant" stroke="#aaa" />
          <YAxis stroke="#aaa" />
          <Tooltip />
          <Bar dataKey="amount" fill="#fb923c" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
