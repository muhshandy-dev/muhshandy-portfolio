import { notFound } from "next/navigation";
import AdminPanel from "@/components/admin/admin-panel";
import { site } from "@/lib/site";
export const metadata = { title: "Admin Lokal", robots: { index: false, follow: false } };

export default function AdminPage() {
  if (process.env.NODE_ENV !== "development") notFound();
  return <AdminPanel initialData={site} />;
}
