import { NextResponse } from 'next/server';
import { dbQuery } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: confessionId } = await params;

    // 1. Fetch local comments from database
    const localComments = (await dbQuery(
      'SELECT id, content, nickname, createdAt FROM comments WHERE confessionId = ? ORDER BY createdAt ASC',
      [confessionId]
    )) as Array<{ id: string; content: string; nickname: string; createdAt: string }>;

    // Map local comments to our standard format
    const formattedLocalComments = localComments.map((comment) => ({
      id: comment.id,
      content: comment.content,
      nickname: comment.nickname,
      createdAt: comment.createdAt,
      source: 'website',
    }));

    // 2. Retrieve the confession to check for facebookPostId
    const confessions = (await dbQuery(
      'SELECT facebookPostId FROM confessions WHERE id = ?',
      [confessionId]
    )) as any[];

    const facebookPostId = confessions[0]?.facebookPostId;

    if (!facebookPostId) {
      // If no Facebook post linked, return local comments immediately
      return NextResponse.json(formattedLocalComments);
    }

    // 3. Fetch facebook settings from db to get page ID and access token
    const fbSettings = (await dbQuery(
      'SELECT pageId, accessToken, isConnected FROM facebook_settings WHERE id = "default"'
    )) as any[];

    const settings = fbSettings[0];
    if (!settings || !settings.isConnected || !settings.accessToken) {
      // If Facebook settings are not configured or connected, return local comments immediately
      return NextResponse.json(formattedLocalComments);
    }

    // 4. Fetch comments from Facebook Graph API
    let fbComments: any[] = [];
    try {
      const fbUrl = `https://graph.facebook.com/v19.0/${facebookPostId}/comments?access_token=${settings.accessToken}&fields=id,message,from,created_time`;
      const res = await fetch(fbUrl, { cache: 'no-store' }); // Disable cache to always get latest comments
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.data)) {
          fbComments = data.data.map((item: any) => ({
            id: `fb-${item.id}`,
            content: item.message,
            nickname: `${item.from?.name || 'Facebook User'} (FB)`,
            createdAt: new Date(item.created_time).toISOString(),
            source: 'facebook',
          }));
        }
      } else {
        console.warn('Failed to fetch Facebook comments:', await res.text());
      }
    } catch (fbErr) {
      console.error('Error connecting to Facebook Graph API for comments:', fbErr);
    }

    // 5. Merge and sort comments by createdAt ascending
    const mergedComments = [...formattedLocalComments, ...fbComments].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    return NextResponse.json(mergedComments);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to retrieve comments';
    console.error('Failed to retrieve comments:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: confessionId } = await params;
    const body = await request.json();
    const { content, nickname } = body;

    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'Comment content cannot be empty' }, { status: 400 });
    }

    const newComment = {
      id: `comment-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      confessionId,
      content: content.trim(),
      nickname: nickname.trim() || 'Anonymous',
      createdAt: new Date().toISOString(),
    };

    await dbQuery(
      'INSERT INTO comments (id, confessionId, content, nickname, createdAt) VALUES (?, ?, ?, ?, ?)',
      [
        newComment.id,
        newComment.confessionId,
        newComment.content,
        newComment.nickname,
        newComment.createdAt,
      ]
    );

    return NextResponse.json({
      id: newComment.id,
      content: newComment.content,
      nickname: newComment.nickname,
      createdAt: newComment.createdAt,
    }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to add comment';
    console.error('Failed to create comment:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
