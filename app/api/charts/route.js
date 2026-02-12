import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query")?.toUpperCase() || "";

  if (!query) {
    return NextResponse.json({ charts: [] });
  }

  try {
    const chartsDir = path.join(process.cwd(), "public", "data", "charts");
    
    // Check if directory exists
    if (!fs.existsSync(chartsDir)) {
      return NextResponse.json({ charts: [] });
    }

    const files = fs.readdirSync(chartsDir);
    
    // Filter PDF files that match the query
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
    console.error("Charts API error:", error);
    return NextResponse.json({ charts: [], error: error.message }, { status: 500 });
  }
}