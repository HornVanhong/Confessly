"use client";

import React from 'react';
import Link from 'next/link';
import { Confession, ConfessionCategory } from '@/types';
import { useConfessions } from '@/context/ConfessionContext';
import { MessageSquare, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

interface ConfessionCardProps {
  confession: Confession;
  isDetailView?: boolean;
  customCommentCount?: number;
}

// Category Badge Color Mapping
const categoryStyles: Record<ConfessionCategory, string> = {
  Love: 'from-pink-500/10 to-rose-500/10 border-rose-500/30 text-rose-300 shadow-rose-950/20',
  School: 'from-blue-500/10 to-cyan-500/10 border-blue-500/30 text-cyan-300 shadow-blue-950/20',
  Family: 'from-teal-500/10 to-emerald-500/10 border-emerald-500/30 text-emerald-300 shadow-emerald-950/20',
  Friendship: 'from-green-500/10 to-emerald-500/10 border-green-500/30 text-emerald-300 shadow-emerald-950/20',
  Regret: 'from-indigo-950/20 to-slate-900/20 border-indigo-500/30 text-indigo-300 shadow-indigo-950/20',
  Secret: 'from-purple-950/20 to-fuchsia-950/20 border-purple-500/30 text-purple-300 shadow-purple-950/20',
  Funny: 'from-amber-500/10 to-orange-500/10 border-orange-500/30 text-orange-300 shadow-orange-950/20',
  Other: 'from-slate-500/10 to-zinc-500/10 border-slate-500/30 text-slate-300 shadow-zinc-950/20',
};

const reactionEmojis = {
  hug: { char: '🤗', label: 'Hug' },
  heart: { char: '❤️', label: 'Heart' },
  sad: { char: '😢', label: 'Sad' },
  laugh: { char: '😂', label: 'Laugh' },
  shocked: { char: '😮', label: 'Wow' },
};

export const ConfessionCard: React.FC<ConfessionCardProps> = ({
  confession,
  isDetailView = false,
  customCommentCount,
}) => {
  const { addReaction, reportConfession } = useConfessions();

  // Time formatting helper
  const formatTimeAgo = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

      if (seconds < 60) return 'just now';
      const minutes = Math.floor(seconds / 60);
      if (minutes < 60) return `${minutes}m ago`;
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return `${hours}h ago`;
      const days = Math.floor(hours / 24);
      if (days < 30) return `${days}d ago`;
      
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch {
      return 'some time ago';
    }
  };

  const handleReactionClick = (
    e: React.MouseEvent,
    type: 'hug' | 'heart' | 'sad' | 'laugh' | 'shocked'
  ) => {
    e.preventDefault();
    e.stopPropagation();
    addReaction(confession.id, type);
  };

  const handleReportClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm("Are you sure you want to report this confession as inappropriate?")) {
      reportConfession(confession.id);
      alert("Thank you. This confession has been flagged for moderator review.");
    }
  };

  const badgeStyle = categoryStyles[confession.category] || categoryStyles.Other;
  const contentExcerpt = confession.content.length > 220 && !isDetailView
    ? `${confession.content.substring(0, 220)}...`
    : confession.content;

  const cardContent = (
    <>
      <div>
        {/* Header (Category badge, nickname, time) */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span
              className={`bg-gradient-to-r ${badgeStyle} text-xs font-semibold px-3 py-1 rounded-full border shadow-sm`}
            >
              {confession.category}
            </span>
            <span className="text-slate-400 text-xs font-medium">
              @{confession.nickname}
            </span>
          </div>
          <span className="text-slate-500 text-xs">
            {formatTimeAgo(confession.createdAt)}
          </span>
        </div>

        {/* Content Body */}
        <p className="text-slate-200 text-sm md:text-base leading-relaxed mb-6 whitespace-pre-wrap font-light tracking-wide break-words">
          {contentExcerpt}
          {confession.content.length > 220 && !isDetailView && (
            <span className="text-indigo-400 font-medium ml-1.5 group-hover:text-indigo-300 transition-colors">
              Read more
            </span>
          )}
        </p>
        
        {confession.image && (
          <div className={`relative mb-6 rounded-2xl overflow-hidden border border-white/5 bg-slate-950/40 flex items-center justify-center ${
            isDetailView ? 'max-h-[450px]' : 'max-h-[240px]'
          }`}>
            <img
              src={confession.image}
              alt="Confession attachment"
              className={`w-full rounded-2xl transition-transform duration-500 hover:scale-101 ${
                isDetailView ? 'max-h-[450px] object-contain' : 'max-h-[240px] object-cover'
              }`}
            />
          </div>
        )}
      </div>

      {/* Footer Actions (Reactions and comments) */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-white/5">
        <div className="flex flex-wrap items-center gap-1.5">
          {(Object.keys(reactionEmojis) as Array<keyof typeof reactionEmojis>).map((type) => {
            const emojiInfo = reactionEmojis[type];
            const count = confession.reactions[type];
            return (
              <motion.button
                key={type}
                whileTap={{ scale: 1.3 }}
                onClick={(e) => handleReactionClick(e, type)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs transition-colors ${
                  count > 0 
                    ? 'bg-indigo-500/10 border border-indigo-500/30 text-indigo-200 hover:bg-indigo-500/20' 
                    : 'bg-white/5 border border-transparent text-slate-400 hover:bg-white/10 hover:text-slate-200'
                }`}
                title={emojiInfo.label}
              >
                <span className="text-[13px]">{emojiInfo.char}</span>
                <span className="font-semibold">{count}</span>
              </motion.button>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-slate-400 text-xs" title="Comments">
            <MessageSquare className="h-4 w-4" />
            <span className="font-semibold">{customCommentCount !== undefined ? customCommentCount : confession.comments.length}</span>
          </div>

          {!isDetailView && confession.reportsCount > 0 && (
            <div className="flex items-center gap-1 text-red-400 text-xs" title="Reported">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <span>{confession.reportsCount}</span>
            </div>
          )}

          {isDetailView ? (
            <button
              onClick={handleReportClick}
              className="flex items-center gap-1 text-slate-500 hover:text-red-400 transition-colors text-xs py-1"
              title="Report confession"
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>Report</span>
            </button>
          ) : null}
        </div>
      </div>
    </>
  );

  if (isDetailView) {
    return (
      <div className="glass p-6 md:p-8 rounded-3xl border border-white/10 relative overflow-hidden shadow-2xl">
        {cardContent}
      </div>
    );
  }

  return (
    <Link href={`/confession/${confession.id}`} className="block h-full group">
      <motion.div
        whileHover={{ y: -4 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] as const }}
        className="glass glass-hover p-6 rounded-2xl border border-white/5 flex flex-col justify-between h-full relative overflow-hidden shadow-lg"
      >
        {cardContent}
      </motion.div>
    </Link>
  );
};
