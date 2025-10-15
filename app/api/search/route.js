// These imports allow us to read files that live inside your project folder.
// 'fs/promises' gives access to file-reading functions (like readFile) that return Promises,
// and 'path' helps us safely build file paths across different operating systems.
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
  // 1️⃣ Extract the "query" string from the URL
  // Example URL: /api/search?query=VJB
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query")?.toLowerCase(); // convert to lowercase for easier comparison

  // 2️⃣ If there’s no query provided, just return an empty result set
  if (!query) {
    return Response.json({ results: [] });
  }

  // 3️⃣ List all GeoJSON files we want to search through.
  // These should already exist inside the /public folder of your project.
  const files = ["FIRs.geojson", "Waypoints.geojson", "NavWarnings.geojson"];

  // We'll collect matching results here.
  const results = [];

  // 4️⃣ Loop through each file in that list
  for (const file of files) {
    // Build the absolute file path.
    // process.cwd() = "current working directory" (root of your Next.js app)
    const filePath = path.join(process.cwd(), "public", file);

    // Read the file’s text contents.
    const raw = await fs.readFile(filePath, "utf8");

    // Convert (parse) the JSON string into a JavaScript object.
    const geojson = JSON.parse(raw);

    // 5️⃣ Go through every "feature" (a point, polygon, etc.) inside that GeoJSON file.
    geojson.features.forEach((feature) => {
      // Some files name the feature under different property keys.
      // We try several possible names to be safe.
      const name =
        feature.properties.name ||
        feature.properties.ident ||
        feature.properties.title ||
        "";

      // 6️⃣ If the feature’s name contains the query string, save it.
      if (name.toLowerCase().includes(query)) {
        results.push(feature);  // Add the whole feature object to results; standard GeoJSON FeatureCollection
      }

    });
  }

  // 7️⃣ Finally, send all the matches back to the browser as JSON.
  // The frontend can then read this with `const data = await res.json();`
  return Response.json({ results });
}

// Add error handling as needed.