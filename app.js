// Dev server: serves dist/ and rebuilds when anything changes. Run with `bun run dev`.
import { watch } from "node:fs";
import { join } from "node:path";

const dir = import.meta.dir;
const build = () => Bun.spawnSync(["bun", join(dir, "build.js")], { stdout: "inherit", stderr: "inherit" });

build();
let timer;
for (const folder of ["content", "lib", "assets"]) {
  watch(join(dir, folder), { recursive: true }, () => {
    clearTimeout(timer);
    timer = setTimeout(build, 150);
  });
}

Bun.serve({
  port: process.env.PORT ?? 3000,
  async fetch(request) {
    const path = join(dir, "dist", decodeURIComponent(new URL(request.url).pathname));
    if (!path.startsWith(join(dir, "dist"))) return new Response("Forbidden", { status: 403 });
    for (const file of [path, join(path, "index.html")]) {
      if (await Bun.file(file).exists()) return new Response(Bun.file(file));
    }
    return new Response(Bun.file(join(dir, "dist", "404.html")), { status: 404, headers: { "content-type": "text/html" } });
  },
});
console.log(`http://localhost:${process.env.PORT ?? 3000}`);
