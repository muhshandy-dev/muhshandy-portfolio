import { NextRequest } from "next/server";

// No public password form: the write API only exists on a local development server.
export function isLocalAdmin(req: NextRequest) {
  if (process.env.NODE_ENV !== "development") return false;
  const hostname = req.nextUrl.hostname;
  const host = req.headers.get("host")?.split(":")[0];
  if (!(["localhost", "127.0.0.1", "[::1]"].includes(hostname) && ["localhost", "127.0.0.1", "[::1]"].includes(host ?? ""))) return false;
  const origin = req.headers.get("origin");
  if (origin && new URL(origin).host !== req.headers.get("host")) return false;
  return true;
}
