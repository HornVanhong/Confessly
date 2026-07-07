"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useConfessions } from '@/context/ConfessionContext';
import { ConfessionCategory } from '@/types';
import { PenTool, ShieldAlert, CheckCircle2, ArrowRight, Upload, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

const CATEGORIES: ConfessionCategory[] = [
  'Love',
  'School',
  'Family',
  'Friendship',
  'Regret',
  'Secret',
  'Funny',
  'Other',
];

export default function WritePage() {
  const router = useRouter();
  const { addConfession } = useConfessions();

  const [content, setContent] = useState('');
  const [category, setCategory] = useState<ConfessionCategory>('Love');
  const [nickname, setNickname] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [image, setImage] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  const charLimit = 1000;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setError('');
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError('Image size should be less than 2MB.');
        return;
      }
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file (PNG, JPG, WebP).');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (content.trim().length < 10) {
      setError('Please write at least 10 characters to share a confession.');
      return;
    }

    if (content.length > charLimit) {
      setError(`Your confession is too long. Please keep it under ${charLimit} characters.`);
      return;
    }

    // Call state provider with optional image
    addConfession(content, category, nickname, isPublic, image || undefined);

    // Trigger confetti celebration
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#6366f1', '#8b5cf6', '#d946ef', '#ec4899', '#3b82f6'],
    });

    setIsSubmitted(true);
    setContent('');
    setNickname('');
    setImage(null);
  };

  return (
    <div className="w-full max-w-2xl mx-auto py-4">
      <AnimatePresence mode="wait">
        {!isSubmitted ? (
          <motion.div
            key="write-form"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col gap-8"
          >
            {/* Header Banner */}
            <div className="flex flex-col gap-2 border-b border-white/5 pb-6">
              <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight flex items-center gap-3">
                <span>Release a Secret</span>
                <PenTool className="h-6 w-6 text-purple-400" />
              </h1>
              <p className="text-slate-400 text-sm font-light">
                Write down what’s on your mind. It goes straight to moderation and, once approved, will join the public feed anonymously.
              </p>
            </div>

            {/* Privacy Alert */}
            <div className="bg-amber-500/10 border border-amber-500/30 text-amber-200 p-4 rounded-2xl flex items-start gap-3 shadow-sm">
              <ShieldAlert className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="flex flex-col gap-1 text-xs md:text-sm">
                <span className="font-semibold text-amber-300">Privacy First Guard</span>
                <span className="font-light">
                  Do not share personal information such as real names, phone numbers, email addresses, or physical addresses. Keep the sharing safe and respectful.
                </span>
              </div>
            </div>

            {/* Main Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              {/* Confession content textarea */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-300 flex items-center justify-between">
                  <span>Your Confession</span>
                  <span className={`text-xs ${content.length > charLimit - 50 ? 'text-rose-400' : 'text-slate-500'}`}>
                    {content.length}/{charLimit}
                  </span>
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Type your deepest secret, funniest mistake, or unspoken thoughts here..."
                  className="w-full bg-slate-950/60 border border-white/5 focus:border-indigo-500/40 rounded-2xl p-4 min-h-[220px] text-sm md:text-base text-slate-200 placeholder-slate-600 focus:outline-none transition-colors backdrop-blur-md shadow-inner resize-y leading-relaxed font-light"
                />
              </div>

              {/* Image Upload Drag & Drop Area */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-300">
                  Attach an Image <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Optional</span>
                </label>
                
                {!image ? (
                  <label className="border-2 border-dashed border-white/5 hover:border-indigo-500/20 bg-slate-950/40 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all hover:bg-slate-950/60 shadow-inner">
                    <Upload className="h-6 w-6 text-slate-500" />
                    <span className="text-xs text-slate-400 font-light">Drag & drop or click to upload (Max 2MB)</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                ) : (
                  <div className="relative rounded-2xl overflow-hidden border border-white/10 w-fit max-w-full bg-slate-950/40 p-2">
                    <img src={image} alt="Upload preview" className="max-h-[200px] object-contain rounded-xl" />
                    <button
                      type="button"
                      onClick={() => setImage(null)}
                      className="absolute top-4 right-4 bg-slate-950/80 hover:bg-slate-900 border border-white/10 text-slate-200 p-1.5 rounded-full transition-colors cursor-pointer"
                      title="Remove image"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Category selector & Nickname */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-slate-300">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ConfessionCategory)}
                    className="w-full bg-slate-950/60 border border-white/5 focus:border-indigo-500/40 rounded-2xl p-4 text-sm text-slate-300 focus:outline-none transition-colors backdrop-blur-md cursor-pointer"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat} className="bg-[#0b0a1a] text-slate-300 py-2">
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-slate-300 flex items-center justify-between">
                    <span>Alias / Nickname</span>
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Optional</span>
                  </label>
                  <input
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="e.g. LostInThought (Defaults to Anonymous)"
                    maxLength={20}
                    className="w-full bg-slate-950/60 border border-white/5 focus:border-indigo-500/40 rounded-2xl p-4 text-sm text-slate-200 placeholder-slate-600 focus:outline-none transition-colors backdrop-blur-md shadow-inner"
                  />
                </div>
              </div>

              {/* Public/Private Toggle Switch */}
              <div className="glass p-4 rounded-2xl border border-white/5 flex items-center justify-between">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-semibold text-slate-200">Public Feed Sharing</span>
                  <span className="text-xs text-slate-500 font-light">
                    {isPublic 
                      ? 'Approved confession is listed on the public explore feed.' 
                      : 'Saved privately. (Hidden from public but accessible to moderators).'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPublic(!isPublic)}
                  className={`relative inline-flex h-6.5 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    isPublic ? 'bg-indigo-500' : 'bg-slate-800'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5.5 w-5.5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      isPublic ? 'translate-x-5.5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Error message */}
              {error && (
                <div className="text-rose-400 text-sm font-semibold border border-rose-500/25 bg-rose-500/10 px-4 py-3 rounded-xl">
                  {error}
                </div>
              )}

              {/* Submit Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                className="w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-semibold py-4 rounded-2xl hover:brightness-110 shadow-lg shadow-indigo-500/15 flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <span>Publish Confession</span>
                <ArrowRight className="h-4.5 w-4.5" />
              </motion.button>
            </form>
          </motion.div>
        ) : (
          <motion.div
            key="success-message"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4 }}
            className="glass border border-white/5 rounded-3xl p-8 md:p-12 text-center flex flex-col items-center gap-6 shadow-2xl"
          >
            <div className="bg-emerald-500/10 p-4 rounded-full border border-emerald-500/30 text-emerald-400 shadow-md">
              <CheckCircle2 className="h-12 w-12" />
            </div>
            <div className="flex flex-col gap-2">
              <h2 className="text-2xl md:text-3xl font-extrabold text-white">Confession Received!</h2>
              <p className="text-slate-400 font-light max-w-md leading-relaxed text-sm md:text-base">
                Your secrets are safe with us. We have received your confession and queued it for moderation. It will show up on the public feed once approved!
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full max-w-sm mt-4">
              <button
                onClick={() => setIsSubmitted(false)}
                className="w-full bg-white/5 hover:bg-white/10 border border-white/5 text-slate-300 font-semibold py-3 px-6 rounded-xl transition-colors text-sm cursor-pointer"
              >
                Submit Another
              </button>
              <button
                onClick={() => router.push('/moderator')}
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:brightness-110 text-white font-semibold py-3 px-6 rounded-xl shadow-md transition-all text-sm cursor-pointer"
              >
                Go to Moderator to Approve It
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
