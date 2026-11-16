// Development only. FrameCompile has no service worker, but other projects
// run on localhost:3000 too, and a service worker one of them registered
// keeps controlling this app's tabs and serving its stale cached files.
// Browsers check /sw.js for updates; this answer replaces that worker with
// one that clears its caches, unregisters itself and reloads the tab.
// In production nothing registers a service worker, so it's a 404.
const CLEANUP_WORKER = `
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) await caches.delete(key);
    await self.registration.unregister();
    for (const client of await self.clients.matchAll({ type: "window" })) client.navigate(client.url);
  })());
});
`;

export function GET() {
  if (process.env.NODE_ENV === "production") {
    return new Response("Not found", { status: 404 });
  }
  return new Response(CLEANUP_WORKER, {
    headers: { "Content-Type": "text/javascript; charset=utf-8", "Cache-Control": "no-store" },
  });
}
