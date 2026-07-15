import { NextResponse } from 'next/server';
import { dbQuery } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { pageId, accessToken, isConnected } = body;

    if (pageId === undefined || accessToken === undefined || isConnected === undefined) {
      return NextResponse.json({ error: 'Missing required configuration fields' }, { status: 400 });
    }

    // Save to the database using an upsert
    await dbQuery(
      `INSERT INTO facebook_settings (id, pageId, accessToken, isConnected)
       VALUES ('default', ?, ?, ?)
       ON DUPLICATE KEY UPDATE pageId = ?, accessToken = ?, isConnected = ?`,
      [
        pageId.trim(),
        accessToken.trim(),
        isConnected ? 1 : 0,
        pageId.trim(),
        accessToken.trim(),
        isConnected ? 1 : 0
      ]
    );

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to save Facebook configuration';
    console.error('Failed to save Facebook configuration:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
