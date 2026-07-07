"use client";

import React, { useState, useMemo } from 'react';
import { useConfessions } from '@/context/ConfessionContext';
import { ConfessionCard } from '@/components/ConfessionCard';
import { ConfessionCategory } from '@/types';
import { Search, ArrowUpDown, Filter, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CATEGORIES: ('All' | ConfessionCategory)[] = [
  'All',
  'Love',
  'School',
  'Family',
  'Friendship',
  'Regret',
  'Secret',
  'Funny',
  'Other',
];

export default function FeedPage() {
  const { confessions } = useConfessions();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'All' | ConfessionCategory>('All');
  const [sortBy, setSortBy] = useState<'newest' | 'popular'>('newest');

  // Filter approved confessions
  const approvedConfessions = useMemo(() => {
    return confessions.filter((c) => c.status === 'approved');
  }, [confessions]);

  // Filter & sort list
  const filteredAndSortedConfessions = useMemo(() => {
    let result = [...approvedConfessions];

    // Apply category filter
    if (selectedCategory !== 'All') {
      result = result.filter((c) => c.category === selectedCategory);
    }

    // Apply search filter
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (c) =>
          c.content.toLowerCase().includes(term) ||
          c.nickname.toLowerCase().includes(term)
      );
    }

    // Apply sorting
    if (sortBy === 'newest') {
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortBy === 'popular') {
      const sumReactions = (c: typeof confessions[0]) =>
        c.reactions.hug +
        c.reactions.heart +
        c.reactions.sad +
        c.reactions.laugh +
        c.reactions.shocked;
      result.sort((a, b) => sumReactions(b) - sumReactions(a));
    }

    return result;
  }, [approvedConfessions, selectedCategory, searchTerm, sortBy]);

  return (
    <div className="w-full flex flex-col gap-8 py-4">
      {/* Header Banner */}
      <div className="flex flex-col gap-2 border-b border-white/5 pb-6">
        <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight flex items-center gap-3">
          <span>The Confessional</span>
          <Sparkles className="h-6 w-6 text-purple-400" />
        </h1>
        <p className="text-slate-400 text-sm md:text-base font-light">
          Browse through anonymous confessions shared by people all over the world.
        </p>
      </div>

      {/* Filters & Search Control Bar */}
      <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
        {/* Search Input */}
        <div className="relative flex-1 max-w-lg">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search confessions or nicknames..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950/60 border border-white/5 focus:border-indigo-500/40 rounded-2xl py-3.5 pl-11 pr-4 text-sm text-slate-200 placeholder-slate-500 focus:outline-none transition-colors backdrop-blur-md shadow-inner"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 hover:text-white"
            >
              Clear
            </button>
          )}
        </div>

        {/* Sort controls */}
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-950/60 p-1.5 rounded-2xl border border-white/5 backdrop-blur-md shadow-inner">
            <button
              onClick={() => setSortBy('newest')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                sortBy === 'newest'
                  ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/35 text-white'
                  : 'text-slate-400 hover:text-white border border-transparent'
              }`}
            >
              <ArrowUpDown className="h-3.5 w-3.5" />
              <span>Newest</span>
            </button>
            <button
              onClick={() => setSortBy('popular')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                sortBy === 'popular'
                  ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/35 text-white'
                  : 'text-slate-400 hover:text-white border border-transparent'
              }`}
            >
              <ArrowUpDown className="h-3.5 w-3.5" />
              <span>Popular</span>
            </button>
          </div>
        </div>
      </div>

      {/* Category Filter Chips */}
      <div className="w-full overflow-x-auto no-scrollbar py-2">
        <div className="flex items-center gap-2 min-w-max pb-1">
          {CATEGORIES.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                selectedCategory === category
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-500 border-indigo-400 text-white shadow-lg shadow-indigo-500/10'
                  : 'glass border-white/5 text-slate-400 hover:text-white hover:border-white/20'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Confessions List/Grid */}
      <div className="min-h-[400px] w-full">
        {filteredAndSortedConfessions.length > 0 ? (
          <motion.div
            layout
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <AnimatePresence mode="popLayout">
              {filteredAndSortedConfessions.map((confession) => (
                <motion.div
                  key={confession.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.4 }}
                  className="h-full"
                >
                  <ConfessionCard confession={confession} />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          <div className="glass p-16 rounded-2xl border border-white/5 text-center flex flex-col items-center justify-center gap-3">
            <Filter className="h-8 w-8 text-slate-500" />
            <h3 className="text-lg font-semibold text-white">No Confessions Found</h3>
            <p className="text-slate-400 text-sm font-light max-w-sm">
              We couldn&apos;t find any approved confessions matching your current filters. Try resetting search or selecting a different category!
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('All');
              }}
              className="mt-2 text-xs font-semibold text-indigo-400 hover:text-indigo-300"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
