import { NextResponse } from 'next/server';
import { dbQuery } from '@/lib/db';

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
