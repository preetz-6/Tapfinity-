"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type Tx = {
  amount: number;
  createdAt: string;
};

export default function SpendChart() {
  const [data, setData] = useState<{ date: string; amount: number }[]>([]);
  useEffect(() => {
    fetch("/api/user/transactions")
      .then(r => r.json())
      .then((data: { transactions: Tx[] }) => {
        const txs = data.transactions ?? [];
        const map: Record<string, number> = {};

        txs.forEach(tx => {
          const date = new Date(tx.createdAt).toLocaleDateString();
          map[date] = (map[date] || 0) + tx.amount;
        });

        const formatted = Object.entries(map).map(
          ([date, amount]) => ({
            date,
            amount,
          })
        );

        setData(formatted);
      });
  }, []);

  if (data.length === 0) return null;

  return (
    <div className="rounded-xl bg-white/5 border border-white/10 p-4">
      <h3 className="text-sm text-gray-400 mb-3">
        Spending Over Time
      </h3>

      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data}>
          <XAxis dataKey="date" stroke="#aaa" />
          <YAxis stroke="#aaa" />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="amount"
            stroke="#f97316"
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
