import { notFound } from "next/navigation";
import AdminPanel from "@/components/admin/admin-panel";
import { adminEnabled, adminToken } from "@/lib/admin-security";
import { readSite } from "@/lib/admin-store";

export const metadata = { title: "Admin lokal", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!adminEnabled()) notFound();
  // Baca langsung dari disk supaya editor selalu memakai isi terbaru site.json.
  const { data, revision } = await readSite();
  return <AdminPanel initialData={data} initialRevision={revision} token={adminToken()} />;
}
