"use client";

import React, { useState, use, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useConfessions } from '@/context/ConfessionContext';
import { ConfessionCard } from '@/components/ConfessionCard';
import { ArrowLeft, Send, MessageSquarePlus, User, CornerDownRight, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ConfessionDetailPage({ params }: PageProps) {
  // Await params using React.use() for Next.js App Router compatibility
  const { id } = use(params);
  const { confessions, addComment } = useConfessions();

  const [commentText, setCommentText] = useState('');
  const [commenterName, setCommenterName] = useState('');
  const [error, setError] = useState('');
  const [comments, setComments] = useState<any[]>([]);
  const [loadingComments, setLoadingComments] = useState(true);

  // Find target confession
  const confession = confessions.find((c) => c.id === id);

  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/confessions/${id}/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments(data);
      }
    } catch (err) {
      console.error('Failed to load comments:', err);
    } finally {
      setLoadingComments(false);
    }
  }, [id]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!commentText.trim()) {
      setError('Comment content cannot be empty.');
      return;
    }

    if (commentText.length > 500) {
      setError('Comments must be under 500 characters.');
      return;
    }

    // Optimistically update local comments state
    const tempId = `temp-${Date.now()}`;
    const newComment = {
      id: tempId,
      content: commentText.trim(),
      nickname: commenterName.trim() || 'Anonymous',
      createdAt: new Date().toISOString(),
      source: 'website'
    };
    setComments(prev => [...prev, newComment]);

    // Save in DB
    addComment(id, commentText, commenterName);
    setCommentText('');
    setCommenterName('');

    // Fetch comments again after a brief delay to get saved IDs and sync Facebook comments
    setTimeout(() => {
      fetchComments();
    }, 600);
  };

  // Helper for comment time ago
  const formatCommentTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

      if (seconds < 60) return 'just now';
      const minutes = Math.floor(seconds / 60);
      if (minutes < 60) return `${minutes}m ago`;
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return `${hours}h ago`;
      
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  if (!confession) {
    return (
      <div className="w-full flex flex-col items-center justify-center min-h-[400px] text-center gap-4">
        <h2 className="text-2xl font-bold text-white">Confession Not Found</h2>
        <p className="text-slate-400 max-w-sm font-light">
          This secret might have been deleted, rejected by moderators, or never existed in the first place.
        </p>
        <Link href="/feed" className="mt-2 text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Feed</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto py-4 flex flex-col gap-8">
      {/* Back button */}
      <div>
        <Link
          href="/feed"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-400 hover:text-white transition-colors py-1.5"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Feed</span>
        </Link>
      </div>

      {/* Confession Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <ConfessionCard confession={confession} isDetailView={true} />
      </motion.div>

      {/* Comments Section */}
      <div className="flex flex-col gap-6 mt-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-white/5 pb-3">
          <span>Anonymous Discussion</span>
          <span className="text-xs bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-semibold px-2 py-0.5 rounded-full">
            {loadingComments ? '...' : comments.length}
          </span>
        </h3>

        {/* Comment list */}
        {loadingComments ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-400">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            <p className="text-sm font-light">Loading comments...</p>
          </div>
        ) : comments.length > 0 ? (
          <div className="flex flex-col gap-4">
            {comments.map((comment) => (
              <motion.div
                key={comment.id}
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                className="glass p-5 rounded-2xl border border-white/5 flex gap-4 text-left shadow-sm hover:border-white/10 transition-colors"
              >
                <div className="p-2.5 rounded-xl bg-slate-800 border border-white/5 h-fit text-slate-400">
                  <User className="h-4 w-4" />
                </div>
                <div className="flex-1 flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-300 flex items-center gap-1.5">
                      @{comment.nickname}
                      {comment.source === 'facebook' && (
                        <span className="flex items-center gap-1 text-[10px] bg-blue-500/10 border border-blue-500/20 text-blue-400 font-medium px-1.5 py-0.5 rounded-md">
                          <svg className="h-2.5 w-2.5 fill-blue-400" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.75z" />
                          </svg>
                          <span>Facebook</span>
                        </span>
                      )}
                    </span>
                    <span className="text-xs text-slate-500">
                      {formatCommentTime(comment.createdAt)}
                    </span>
                  </div>
                  <p className="text-slate-300 text-sm leading-relaxed font-light break-words">
                    {comment.content}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="glass p-8 rounded-2xl border border-white/5 text-center flex flex-col items-center justify-center py-10">
            <CornerDownRight className="h-6 w-6 text-slate-600 mb-2 rotate-90" />
            <p className="text-slate-500 text-sm font-light">No comments yet. Be the first to reply!</p>
          </div>
        )}

        {/* Write comment form */}
        <div className="glass p-6 rounded-2xl border border-white/5 flex flex-col gap-4 mt-2">
          <h4 className="text-sm font-semibold text-slate-200 flex items-center gap-1.5">
            <MessageSquarePlus className="h-4 w-4 text-indigo-400" />
            <span>Leave a Reply</span>
          </h4>

          <form onSubmit={handleCommentSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
              {/* Commenter Nickname input */}
              <div className="flex flex-col gap-1.5 md:col-span-1">
                <input
                  type="text"
                  placeholder="Your Name / Alias"
                  value={commenterName}
                  onChange={(e) => setCommenterName(e.target.value)}
                  maxLength={20}
                  className="w-full bg-slate-950/60 border border-white/5 focus:border-indigo-500/40 rounded-xl p-3.5 text-xs text-slate-300 placeholder-slate-600 focus:outline-none transition-colors backdrop-blur-md"
                />
              </div>

              {/* Comment Textarea */}
              <div className="flex flex-col gap-1.5 md:col-span-2 relative">
                <textarea
                  placeholder="Share a word of encouragement or comment anonymously..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  maxLength={500}
                  className="w-full bg-slate-950/60 border border-white/5 focus:border-indigo-500/40 rounded-xl p-3.5 pr-12 text-xs text-slate-300 placeholder-slate-600 focus:outline-none transition-colors backdrop-blur-md resize-none h-[46px] overflow-y-auto leading-relaxed"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-[5px] p-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors cursor-pointer shadow-sm"
                  title="Post comment"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {error && (
              <span className="text-xs font-semibold text-rose-400 pl-1">{error}</span>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
