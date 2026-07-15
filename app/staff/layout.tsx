"use client";

import { usePathname } from "next/navigation";
import StaffShell from "./StaffShell";

export default function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  if (pathname === "/staff/login") {
    return <>{children}</>;
  }

  return <StaffShell>{children}</StaffShell>;
}
