import OnlineAdmin from "@/components/admin/online-admin";

// Hanya ikut build statis (STATIC_EXPORT=1). Halaman ini dilindungi oleh functions/admin/_middleware.ts di Cloudflare Pages.
export const metadata = { title: "Admin", robots: { index: false, follow: false } };

export default function OnlineAdminPage() {
  return <OnlineAdmin />;
}
