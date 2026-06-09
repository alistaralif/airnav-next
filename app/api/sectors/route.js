import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import fs from "fs";
import path from "path";
import { logger } from "@/lib/logger";

export async function GET(request) {
  try {
    // Checks whether the requesting user holds a valid session.
    const session = await getServerSession();
    const isAuthorized = !!session?.user;

    const filePath = path.join(process.cwd(), "data/private/Sectors.geojson");
    const fileContent = fs.readFileSync(filePath, "utf8");
    const data = JSON.parse(fileContent);

    // Filters out Singapore sectors for unauthenticated users.
    if (!isAuthorized) {
      const filteredFeatures = data.features.filter(
        (feature) => feature.properties.fir !== "Singapore"
      );
      data.features = filteredFeatures;
    }

    return NextResponse.json(data);
  } catch (error) {
    logger.error("sectors fetch failed", { route: "/api/sectors", error: error.message });
    return NextResponse.json(
      { error: "Failed to load sectors data" },
      { status: 500 }
    );
  }
}