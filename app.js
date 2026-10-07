// Development server: builds the site, serves dist/, and rebuilds whenever
// anything in content/, templates/, assets/ or lib/ changes.
//   bun run dev
import { watch } from "node:fs";
import { join, normalize } from "path";

const dir = import.meta.dir;
const dist = join(dir, "dist");

function rebuild() {
  // A fresh process so template edits are picked up without restarting.
  const result = Bun.spawnSync(["bun", join(dir, "build.js")], { stdout: "inherit", stderr: "inherit", env: { ...process.env, BASE_PATH: "/" } });
  if (result.exitCode !== 0) console.error("✗ Byggingen feilet — rett feilen over og lagre på nytt.");
}

export default async function ferniss(request) {
  const pathname = decodeURIComponent(new URL(request.url).pathname);
  const path = normalize(join(dist, pathname));
  if (!path.startsWith(dist)) return new Response("Forbidden", { status: 403 });

  for (const candidate of [path, join(path, "index.html")]) {
    const file = Bun.file(candidate);
    if (await file.exists()) return new Response(file);
  }
  return new Response(Bun.file(join(dist, "404.html")), { status: 404, headers: { "content-type": "text/html" } });
}

if (import.meta.main) {
  rebuild();
  let timer;
  for (const folder of ["content", "templates", "assets", "lib"]) {
    watch(join(dir, folder), { recursive: true }, () => {
      clearTimeout(timer);
      timer = setTimeout(rebuild, 150);
    });
  }
  const port = process.env.PORT ?? 3000;
  Bun.serve({ port, fetch: ferniss });
  console.log(`Nettsiden kjører på http://localhost:${port}`);
}
