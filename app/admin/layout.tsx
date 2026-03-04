export const dynamic = "force-dynamic";
export const revalidate = 0;

import AdminShell from "./AdminShell";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminShell>{children}</AdminShell>;
}
