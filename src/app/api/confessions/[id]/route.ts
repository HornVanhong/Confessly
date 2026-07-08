import { NextResponse } from 'next/server';
import { dbQuery } from '@/lib/db';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, facebookPostId, reactionType, incrementReports, clearReports } = body;

    if (status) {
      const clearFacebook = body.clearFacebook === true;
      if (clearFacebook) {
        await dbQuery(
          'UPDATE confessions SET status = ?, facebookPostId = NULL WHERE id = ?',
          [status, id]
        );
      } else if (facebookPostId) {
        await dbQuery(
          'UPDATE confessions SET status = ?, facebookPostId = ? WHERE id = ?',
          [status, facebookPostId, id]
        );
      } else {
        await dbQuery(
          'UPDATE confessions SET status = ? WHERE id = ?',
          [status, id]
        );
      }
    } else if (reactionType) {
      const allowedReactions = ['hug', 'heart', 'sad', 'laugh', 'shocked'];
      if (!allowedReactions.includes(reactionType)) {
        return NextResponse.json({ error: 'Invalid reaction type' }, { status: 400 });
      }
      await dbQuery(
        `UPDATE confessions SET reactions_${reactionType} = reactions_${reactionType} + 1 WHERE id = ?`,
        [id]
      );
    } else if (incrementReports) {
      await dbQuery(
        'UPDATE confessions SET reportsCount = reportsCount + 1 WHERE id = ?',
        [id]
      );
    } else if (clearReports) {
      await dbQuery(
        'UPDATE confessions SET reportsCount = 0 WHERE id = ?',
        [id]
      );
    } else {
      return NextResponse.json({ error: 'No update parameters specified' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update confession';
    console.error('Failed to update confession:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Foreign key constraint handles deleting comments automatically on cascade
    await dbQuery('DELETE FROM confessions WHERE id = ?', [id]);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete confession';
    console.error('Failed to delete confession:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
