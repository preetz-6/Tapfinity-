export const dynamic = "force-dynamic";
export const revalidate = 0;

import MerchantShell from "./MerchantShell";

export default function MerchantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MerchantShell>{children}</MerchantShell>;
}
