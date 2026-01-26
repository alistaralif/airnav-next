import fs from "fs/promises";
import path from "path";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query")?.toLowerCase();

  if (!query) {
    return Response.json({ results: [] });
  }

  // Define files with their locations
  const publicFiles = [
    "data/FIRs.geojson",
    "data/Waypoints.geojson",
    "data/NavWarnings.geojson",
    "data/SIDs.geojson",
    "data/STARs.geojson",
    // "data/atsRoutes.geojson",
  ];

  // Private files (like Sectors) need special handling
  const privateFiles = [
    { path: "data/private/Sectors.geojson", filterSingapore: true },
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

  // Search private files (with filtering)
  for (const file of privateFiles) {
    try {
      const filePath = path.join(process.cwd(), file.path);
      const raw = await fs.readFile(filePath, "utf8");
      const geojson = JSON.parse(raw);

      geojson.features.forEach((feature) => {
        // Filter out Singapore sectors
        if (file.filterSingapore && feature.properties.fir === "Singapore") {
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
      console.error(`Error reading ${file.path}:`, error.message);
    }
  }

  return Response.json({ results });
}