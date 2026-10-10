import { watch } from "node:fs";
import { join } from "node:path";

const dir = import.meta.dir;
const dist = join(dir, "dist");

export default async function ferniss(request) {
  const path = join(dist, decodeURIComponent(new URL(request.url).pathname));
  if (!path.startsWith(dist)) return new Response("Forbidden", { status: 403 });
  for (const file of [path, join(path, "index.html")]) {
    const f = Bun.file(file);
    if (await f.exists()) return new Response(f);
  }
  return new Response(Bun.file(join(dist, "404.html")), { status: 404, headers: { "content-type": "text/html" } });
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
