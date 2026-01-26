import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import fs from "fs";
import path from "path";

export async function GET(request) {
  try {
    // Check if user is authenticated
    const session = await getServerSession();
    const isAuthorized = !!session?.user;

    console.log("Sectors API - Session:", session);
    console.log("Sectors API - Authorized:", isAuthorized);

    const filePath = path.join(process.cwd(), "data/private/Sectors.geojson");
    const fileContent = fs.readFileSync(filePath, "utf8");
    const data = JSON.parse(fileContent);

    if (!isAuthorized) {
      // Filter out Singapore sectors for unauthorized users
      const filteredFeatures = data.features.filter(
        (feature) => feature.properties.fir !== "Singapore"
      );
      console.log(`Filtered: ${data.features.length} -> ${filteredFeatures.length} features`);
      data.features = filteredFeatures;
    } else {
      console.log(`Returning all ${data.features.length} features (including Singapore)`);
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error loading sectors:", error);
    return NextResponse.json(
      { error: "Failed to load sectors data" },
      { status: 500 }
    );
  }
}