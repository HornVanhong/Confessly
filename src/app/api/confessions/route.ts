import { NextResponse } from 'next/server';
import { dbQuery } from '@/lib/db';
import { Confession, Comment, ConfessionCategory } from '@/types';

interface ConfessionRow {
  id: string;
  content: string;
  category: string;
  nickname: string;
  isPublic: number;
  status: string;
  createdAt: string;
  reportsCount: number;
  image: string | null;
  facebookPostId: string | null;
  reactions_hug: number;
  reactions_heart: number;
  reactions_sad: number;
  reactions_laugh: number;
  reactions_shocked: number;
}

interface CommentRow {
  id: string;
  confessionId: string;
  content: string;
  nickname: string;
  createdAt: string;
}

// GET all confessions (with nested comments)
export async function GET() {
  try {
    // 1. Fetch all confessions
    const confessionRows = (await dbQuery('SELECT * FROM confessions')) as ConfessionRow[];
    
    // 2. Fetch all comments
    const commentRows = (await dbQuery('SELECT * FROM comments')) as CommentRow[];

    // 3. Assemble nested objects
    const confessions: Confession[] = confessionRows.map((row) => {
      // Find comments for this confession
      const associatedComments: Comment[] = commentRows
        .filter((comment) => comment.confessionId === row.id)
        .map((comment) => ({
          id: comment.id,
          content: comment.content,
          nickname: comment.nickname,
          createdAt: comment.createdAt,
        }));

      return {
        id: row.id,
        content: row.content,
        category: row.category as ConfessionCategory,
        nickname: row.nickname,
        isPublic: row.isPublic === 1,
        status: row.status as 'pending' | 'approved' | 'rejected',
        createdAt: row.createdAt,
        reportsCount: row.reportsCount,
        image: row.image || undefined,
        facebookPostId: row.facebookPostId || undefined,
        reactions: {
          hug: row.reactions_hug || 0,
          heart: row.reactions_heart || 0,
          sad: row.reactions_sad || 0,
          laugh: row.reactions_laugh || 0,
          shocked: row.reactions_shocked || 0,
        },
        comments: associatedComments,
      };
    });

    return NextResponse.json(confessions);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch confessions';
    console.error('Failed to get confessions:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST a new confession
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { content, category, nickname, isPublic, image } = body;

    if (!content || content.trim().length < 10) {
      return NextResponse.json({ error: 'Content must be at least 10 characters' }, { status: 400 });
    }

    const newConfession = {
      id: `confession-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      content: content.trim(),
      category,
      nickname: nickname.trim() || 'Anonymous',
      isPublic: isPublic ? 1 : 0,
      status: 'pending',
      createdAt: new Date().toISOString(),
      reportsCount: 0,
      image: image || null,
      facebookPostId: null,
      reactions_hug: 0,
      reactions_heart: 0,
      reactions_sad: 0,
      reactions_laugh: 0,
      reactions_shocked: 0,
    };

    await dbQuery(
      `INSERT INTO confessions 
      (id, content, category, nickname, isPublic, status, createdAt, reportsCount, image, facebookPostId, reactions_hug, reactions_heart, reactions_sad, reactions_laugh, reactions_shocked) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        newConfession.id,
        newConfession.content,
        newConfession.category,
        newConfession.nickname,
        newConfession.isPublic,
        newConfession.status,
        newConfession.createdAt,
        newConfession.reportsCount,
        newConfession.image,
        newConfession.facebookPostId,
        newConfession.reactions_hug,
        newConfession.reactions_heart,
        newConfession.reactions_sad,
        newConfession.reactions_laugh,
        newConfession.reactions_shocked,
      ]
    );

    // Return mapped object matching frontend type
    const responseData: Confession = {
      id: newConfession.id,
      content: newConfession.content,
      category: newConfession.category,
      nickname: newConfession.nickname,
      isPublic: newConfession.isPublic === 1,
      status: newConfession.status as 'pending' | 'approved' | 'rejected',
      createdAt: newConfession.createdAt,
      reportsCount: newConfession.reportsCount,
      image: newConfession.image || undefined,
      facebookPostId: undefined,
      reactions: { hug: 0, heart: 0, sad: 0, laugh: 0, shocked: 0 },
      comments: [],
    };

    return NextResponse.json(responseData, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to publish confession';
    console.error('Failed to create confession:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
