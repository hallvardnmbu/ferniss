import { watch } from "node:fs";
import { join, resolve, sep } from "node:path";

const dir = import.meta.dir;
const dist = join(dir, "dist");

const notFound = () =>
  new Response(Bun.file(join(dist, "404.html")), { status: 404, headers: { "content-type": "text/html" } });

export default async function ferniss(request) {
  let decoded;
  try {
    decoded = decodeURIComponent(new URL(request.url).pathname);
  } catch {
    return new Response("Bad request", { status: 400 });
  }
  if (decoded.includes("\0")) return new Response("Bad request", { status: 400 });

  const path = resolve(dist, "." + decoded);
  if (path !== dist && !path.startsWith(dist + sep)) return new Response("Forbidden", { status: 403 });
  for (const file of [path, join(path, "index.html")]) {
    const f = Bun.file(file);
    if (await f.exists()) return new Response(f);
  }
  return notFound();
}

if (import.meta.main) {
  const build = () => Bun.spawnSync(["bun", join(dir, "build.js")], { stdout: "inherit", stderr: "inherit" });

  build();
  let timer;
  for (const folder of ["content", "lib", "assets"]) {
    watch(join(dir, folder), { recursive: true }, () => {
      clearTimeout(timer);
      timer = setTimeout(build, 150);
    });
  }

  const port = process.env.PORT ?? 3000;
  Bun.serve({ port, fetch: ferniss });
  console.log(`http://localhost:${port}`);
}
