// Returns a lightweight status response used by uptime monitors (e.g. UptimeRobot).
// No auth, no I/O — responds immediately to confirm the server is reachable.
export async function GET() {
  return Response.json({ status: "ok" });
}