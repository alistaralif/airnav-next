import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import * as Sentry from "@sentry/nextjs";
import { logger } from "@/lib/logger";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query")?.toUpperCase() || "";

  if (!query) {
    return NextResponse.json({ charts: [] });
  }

  try {
    const chartsDir = path.join(process.cwd(), "public", "data", "charts");

    // Returns early if the charts directory has not been populated.
    if (!fs.existsSync(chartsDir)) {
      return NextResponse.json({ charts: [] });
    }

    const files = fs.readdirSync(chartsDir);

    // Filters for PDF files whose name contains the query string.
    const matchingCharts = files
      .filter((file) => {
        const fileName = file.toUpperCase();
        return fileName.endsWith(".PDF") && fileName.includes(query);
      })
      .map((file) => ({
        name: file.replace(".pdf", "").replace(".PDF", ""),
        filename: file,
        url: `/data/charts/${file}`,
      }));

    return NextResponse.json({ charts: matchingCharts });
  } catch (error) {
    Sentry.captureException(error);
    logger.error("charts fetch failed", { route: "/api/charts", query, error: error.message });
    return NextResponse.json({ charts: [], error: error.message }, { status: 500 });
  }
}