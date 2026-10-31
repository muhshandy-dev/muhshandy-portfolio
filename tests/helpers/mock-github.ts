// GitHub palsu (cukup untuk endpoint contents, commits, blobs) untuk menguji admin online tanpa jaringan.
import { createHash, randomBytes } from "node:crypto";
import { createServer, type Server } from "node:http";

type Commit = { sha: string; message: string; path: string; blob: string; time: string };

export type MockGithub = {
  url: string;
  token: string;
  files: Map<string, { text: Buffer; sha: string }>;
  commits: Commit[];
  requests: { method: string; url: string; auth: string | undefined }[];
  seed(path: string, text: string): void;
  close(): Promise<void>;
};

const gitSha = (data: Buffer) => createHash("sha1").update(`blob ${data.length}\0`).update(data).digest("hex");

export async function startMockGithub(token = "ghp_testtoken", repo = "muhshandy-dev/muhshandy-portfolio"): Promise<MockGithub> {
  const files = new Map<string, { text: Buffer; sha: string }>();
  const commits: Commit[] = [];
  const blobs = new Map<string, Buffer>();
  const requests: MockGithub["requests"] = [];
  const snapshot = new Map<string, Buffer>(); // commit sha -> isi file pada commit itu

  const record = (path: string, data: Buffer, message: string) => {
    const blob = gitSha(data);
    blobs.set(blob, data);
    files.set(path, { text: data, sha: blob });
    const sha = randomBytes(20).toString("hex");
    commits.unshift({ sha, message, path, blob, time: new Date().toISOString() });
    snapshot.set(sha, data);
    return { blob, sha };
  };

  const server: Server = createServer((req, res) => {
    const url = new URL(req.url ?? "/", "http://x");
    const chunks: Buffer[] = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      requests.push({ method: req.method ?? "", url: req.url ?? "", auth: req.headers.authorization });
      const send = (status: number, body: unknown) => { res.writeHead(status, { "content-type": "application/json" }); res.end(JSON.stringify(body)); };
      if (req.headers.authorization !== `Bearer ${token}`) return send(401, { message: "Bad credentials" });
      const prefix = `/repos/${repo}`;
      if (!url.pathname.startsWith(prefix)) return send(404, { message: "Not Found" });
      const rest = url.pathname.slice(prefix.length);
      if (rest.startsWith("/contents/")) {
        const path = decodeURIComponent(rest.slice("/contents/".length));
        if (req.method === "GET") {
          const ref = url.searchParams.get("ref") ?? "main";
          if (/^[0-9a-f]{40}$/.test(ref)) {
            const data = snapshot.get(ref);
            return data ? send(200, { sha: gitSha(data), encoding: "base64", content: data.toString("base64").replace(/(.{60})/g, "$1\n") }) : send(404, { message: "Not Found" });
          }
          const f = files.get(path);
          return f ? send(200, { sha: f.sha, encoding: "base64", content: f.text.toString("base64").replace(/(.{60})/g, "$1\n") }) : send(404, { message: "Not Found" });
        }
        if (req.method === "PUT") {
          const body = JSON.parse(Buffer.concat(chunks).toString("utf8")) as { message: string; content: string; sha?: string; branch?: string };
          const current = files.get(path);
          if (current && !body.sha) return send(422, { message: "Invalid request.\n\n\"sha\" wasn't supplied." });
          if (current && body.sha !== current.sha) return send(409, { message: `${path} does not match ${body.sha}` });
          const out = record(path, Buffer.from(body.content, "base64"), body.message);
          return send(current ? 200 : 201, { content: { sha: out.blob, path }, commit: { sha: out.sha } });
        }
      }
      if (rest === "/commits" && req.method === "GET") {
        const path = url.searchParams.get("path");
        return send(200, commits.filter((c) => !path || c.path === path).slice(0, Number(url.searchParams.get("per_page") ?? 30)).map((c) => ({ sha: c.sha, commit: { message: c.message, committer: { date: c.time } } })));
      }
      if (rest.startsWith("/git/blobs/") && req.method === "GET") {
        const data = blobs.get(rest.slice("/git/blobs/".length));
        return data ? send(200, { content: data.toString("base64"), encoding: "base64" }) : send(404, { message: "Not Found" });
      }
      return send(404, { message: "Not Found" });
    });
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address() as { port: number };
  return {
    url: `http://127.0.0.1:${port}`, token, files, commits, requests,
    seed: (path, text) => { record(path, Buffer.from(text), "Seed"); },
    close: () => new Promise<void>((resolve) => { server.close(() => resolve()); server.closeAllConnections?.(); }),
  };
}
