import { ImageResponse } from "next/og";
import { site } from "@/lib/site";

export const dynamic = "force-static";
export const alt = site.profile.name;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export default function Image() {
  return new ImageResponse(<div style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end", width: "100%", height: "100%", padding: 80, background: "#f8fafc", color: "#0f172a" }}><div style={{ display: "flex", height: 8, width: 110, background: site.settings.accentColor, marginBottom: 35 }} /><div style={{ fontSize: 68, fontWeight: 700, marginBottom: 16 }}>{site.profile.name}</div><div style={{ fontSize: 27, color: "#475569" }}>{site.profile.headline}</div></div>, size);
}
