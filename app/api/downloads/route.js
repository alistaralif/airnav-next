// Records dataset downloads from the Downloads panel. The client calls this
// after a successful download; entries appear in `fly logs` as JSON lines.
import { getServerSession } from "next-auth";
import { logger } from "@/lib/logger";
import { LAYERS } from "@/components/Mapbox/layerConfig";

const KNOWN_DATASETS = new Set(LAYERS.map((layer) => layer.id));

// Fly's proxy sets Fly-Client-IP to the real client address; X-Forwarded-For
// is the fallback for local or non-Fly environments.
function getClientIp(request) {
  const flyIp = request.headers.get("fly-client-ip");
  if (flyIp) return flyIp;
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0].trim() || "unknown";
}

export async function POST(request) {
  try {
    const { dataset } = await request.json();

    // Rejects unknown ids so arbitrary client input never reaches the logs.
    if (!KNOWN_DATASETS.has(dataset)) {
      return Response.json({ error: "Unknown dataset" }, { status: 400 });
    }

    const session = await getServerSession();

    logger.event("dataset downloaded", {
      route: "/api/downloads",
      dataset,
      user: session?.user?.name ?? "anonymous",
      ip: getClientIp(request),
    });

    return new Response(null, { status: 204 });
  } catch (error) {
    logger.error("download tracking failed", { route: "/api/downloads", error: error.message });
    return Response.json({ error: "Failed to record download" }, { status: 500 });
  }
}
