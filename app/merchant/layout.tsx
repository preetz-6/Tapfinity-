"use client";

import { usePathname } from "next/navigation";
import MerchantShell from "./MerchantShell";

export default function MerchantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  if (pathname === "/merchant/login") {
    return <>{children}</>;
  }

  return <MerchantShell>{children}</MerchantShell>;
}
