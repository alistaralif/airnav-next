import fs from "fs/promises";
import path from "path";
import { getServerSession } from "next-auth";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query")?.toLowerCase();

  if (!query) {
    return Response.json({ results: [] });
  }

  // Check if user is authenticated
  const session = await getServerSession();
  const isAuthorized = !!session?.user;

  console.log("Search API - Session:", session);
  console.log("Search API - Authorized:", isAuthorized);

  const publicFiles = [
    "data/FIRs.geojson",
    "data/Waypoints.geojson",
    "data/NavWarnings.geojson",
    "data/SIDs.geojson",
    "data/STARs.geojson",
  ];

  const results = [];

  // Search public files
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
          "";

        if (name.toLowerCase().includes(query)) {
          results.push(feature);
        }
      });
    } catch (error) {
      console.error(`Error reading ${file}:`, error.message);
    }
  }

  // Search Sectors (with Singapore filtering for unauthorized users)
  try {
    const filePath = path.join(process.cwd(), "data/private/Sectors.geojson");
    const raw = await fs.readFile(filePath, "utf8");
    const geojson = JSON.parse(raw);

    geojson.features.forEach((feature) => {
      // Filter out Singapore sectors for unauthorized users
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
    console.error("Error reading Sectors:", error.message);
  }

  return Response.json({ results });
}