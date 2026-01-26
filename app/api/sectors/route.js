import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request) {
  try {
    // Check for authorization
    const authHeader = request.headers.get('authorization');
    const isAuthorized = authHeader === `Bearer ${process.env.SECTORS_API_KEY}`;

    const filePath = path.join(process.cwd(), 'data/private/Sectors.geojson');
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(fileContent);

    if (!isAuthorized) {
      // Filter out Singapore sectors for unauthorized users
      data.features = data.features.filter(
        (feature) => feature.properties.fir !== 'Singapore'
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error loading sectors:', error);
    return NextResponse.json(
      { error: 'Failed to load sectors data' },
      { status: 500 }
    );
  }
}