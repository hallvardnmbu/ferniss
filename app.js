import { join } from "path";

const dir = import.meta.dir;

const routes = {
  "/": "index.html",
};

export default async function ferniss(request) {
  const pathname = new URL(request.url).pathname;
  const path = routes[pathname];

  if (path) return new Response(Bun.file(join(dir, path)));

  return new Response("Forbidden", { status: 403 });
}

if (import.meta.main) {
  const port = process.env.PORT ?? 3000;
  Bun.serve({ port, fetch: ferniss });
  console.log(`Listening on http://localhost:${port}`);
}
