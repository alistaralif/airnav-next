// These imports allows reading files that live inside the project folder.
// 'fs/promises' gives access to file-reading functions (like readFile) that return Promises,
// and 'path' helps safely build file paths across different operating systems.
import fs from "fs/promises";
import path from "path";

/**
 * This function runs whenever someone does a GET request to /api/search
 * (for example, fetch('/api/search?query=VJB') from the frontend).
 *
 * In Next.js App Router, each file named route.js can export functions
 * like GET(), POST(), PUT(), etc. — one for each HTTP method.
 */
export async function GET(request) {
  // Extract the "query" string from the URL
  // Example URL: /api/search?query=VJB
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query")?.toLowerCase(); // convert to lowercase for easier comparison

  // If there’s no query provided, just return an empty result set
  if (!query) {
    return Response.json({ results: [] });
  }

  // List all GeoJSON files to search through.
  // These should already exist inside the /public folder of the project.
  const files = [
    "data/FIRs.geojson", 
    "data/Waypoints.geojson", 
    "data/NavWarnings.geojson",
    "data/Sectors.geojson",
    "data/SIDs.geojson",
    "data/STARs.geojson",
    // "data/ATSRoutes.geojson",  // Uncomment if ATS Routes data is available
  ];

  // Collect matching results here.
  const results = [];

  // Loop through each file in that list
  for (const file of files) {
    // Build the absolute file path.
    // process.cwd() = "current working directory" (root of Next.js app)
    const filePath = path.join(process.cwd(), "public", file);

    // Read the file’s text contents.
    const raw = await fs.readFile(filePath, "utf8");

    // Convert (parse) the JSON string into a JavaScript object.
    const geojson = JSON.parse(raw);

    // Go through every "feature" (a point, polygon, etc.) inside the GeoJSON file.
    geojson.features.forEach((feature) => {
      // Some files name the feature under different property keys.
      // We try several possible names to be safe.
      const name =
        feature.properties.name ||
        feature.properties.ident ||
        feature.properties.title ||
        "";

      // If the feature’s name contains the query string, save it.
      if (name.toLowerCase().includes(query)) {
        results.push(feature);  // Add the whole feature object to results; standard GeoJSON FeatureCollection
      }

    });
  }

  // Finally, send all the matches back to the browser as JSON.
  // The frontend can then read this with `const data = await res.json();`
  return Response.json({ results });
}

// Add error handling as needed.