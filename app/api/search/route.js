import fs from "fs/promises";
import path from "path";
import { getServerSession } from "next-auth";
import * as Sentry from "@sentry/nextjs";
import { logger } from "@/lib/logger";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query")?.toLowerCase();

  if (!query) {
    return Response.json({ results: [] });
  }

  // Checks whether the requesting user holds a valid session.
  const session = await getServerSession();
  const isAuthorized = !!session?.user;

  const publicFiles = [
    "data/FIRs.geojson",
    "data/Waypoints.geojson",
    "data/NavWarnings.geojson",
    "data/SIDs.geojson",
    "data/STARs.geojson",
    "data/atsRoutes.geojson",
  ];

  const results = [];

  // Searches each public GeoJSON file and collects features whose name matches the query.
  for (const file of publicFiles) {
    try {
      const filePath = path.join(process.cwd(), "public", file);
      const raw = await fs.readFile(filePath, "utf8");
      const geojson = JSON.parse(raw);

      geojson.features.forEach((feature) => {
        const name =
          feature.properties.name ||
          feature.properties.ident ||
          feature.properties.title ||
          feature.properties.type ||
          "";

        if (name.toLowerCase().includes(query)) {
          results.push(feature);
        }
      });
    } catch (error) {
      Sentry.captureException(error);
      logger.error("search file read failed", { route: "/api/search", file, error: error.message });
    }
  }

  // Searches the private Sectors file; filters out Singapore sectors for unauthenticated users.
  try {
    const filePath = path.join(process.cwd(), "data/private/Sectors.geojson");
    const raw = await fs.readFile(filePath, "utf8");
    const geojson = JSON.parse(raw);

    geojson.features.forEach((feature) => {
      // Excludes Singapore sectors for unauthorized users.
      if (!isAuthorized && feature.properties.fir === "Singapore") {
        return;
      }

      const name =
        feature.properties.name ||
        feature.properties.ident ||
        feature.properties.title ||
        "";

      if (name.toLowerCase().includes(query)) {
        results.push(feature);
      }
    });
  } catch (error) {
    Sentry.captureException(error);
    logger.error("search sectors read failed", { route: "/api/search", error: error.message });
  }

  return Response.json({ results });
}