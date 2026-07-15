export const dynamic = "force-dynamic";
export const revalidate = 0;

import StaffShell from "./StaffShell";

export default function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <StaffShell>{children}</StaffShell>;
}
