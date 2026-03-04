export default function PaymentSuccessCard({
  name,
  amount,
  transactionId,
  time,
}: {
  name: string;
  amount: number;
  transactionId: string;
  time: string;
}) {
  return (
    <div className="max-w-sm mx-auto rounded-2xl bg-[#0b1226] border border-white/10 p-6 text-center">
      <div className="text-green-400 text-4xl mb-3">✓</div>

      <h2 className="text-lg font-semibold mb-1">
        Payment Successful
      </h2>

      <p className="text-sm text-gray-400 mb-4">
        ₹{amount} received
      </p>

      <div className="rounded-xl bg-black/30 p-4 text-left space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-400">From</span>
          <span>{name}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-400">Date</span>
          <span>{time}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-400">Transaction ID</span>
          <span className="text-xs truncate">{transactionId}</span>
        </div>
      </div>
    </div>
  );
}
