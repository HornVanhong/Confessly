"use client";

import React from 'react';
import Link from 'next/link';
import { useConfessions } from '@/context/ConfessionContext';
import { ConfessionCard } from '@/components/ConfessionCard';
import { EyeOff, ShieldCheck, Heart, Users, ChevronRight, PenTool } from 'lucide-react';
import { motion } from 'framer-motion';

const featureList = [
  {
    icon: EyeOff,
    title: '100% Anonymous',
    desc: 'No signup, no tracking. Your identity is completely shielded from everyone.',
    color: 'text-indigo-400 bg-indigo-500/10'
  },
  {
    icon: ShieldCheck,
    title: 'Safe Space',
    desc: 'Privacy-focused platform designed to allow healthy sharing without judgment.',
    color: 'text-purple-400 bg-purple-500/10'
  },
  {
    icon: Heart,
    title: 'Supportive Community',
    desc: 'Respond to confessions with hugs, hearts, or comments to show empathy.',
    color: 'text-pink-400 bg-pink-500/10'
  },
  {
    icon: Users,
    title: 'Moderated Feed',
    desc: 'Auto-filter and human moderation to keep out personal details and harassment.',
    color: 'text-teal-400 bg-teal-500/10'
  }
];

export default function LandingPage() {
  const { confessions } = useConfessions();

  // Get latest 3 approved confessions
  const latestApproved = confessions
    .filter((c) => c.status === 'approved')
    .slice(0, 3);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const }
    }
  };

  return (
    <div className="w-full flex flex-col items-center gap-24 py-6">
      
      {/* Hero Section */}
      <motion.section 
        className="w-full text-center max-w-4xl mx-auto flex flex-col items-center gap-6"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass border-white/5 text-sm text-indigo-300 font-medium mb-2 shadow-inner">
          <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>A safe space for your secrets</span>
        </div>

        <h1 className="text-4xl md:text-7xl font-extrabold tracking-tight leading-[1.1] text-white">
          Share What You Can’t <br />
          <span className="text-gradient">Say Out Loud</span>
        </h1>

        <p className="text-slate-400 text-lg md:text-xl font-light max-w-2xl leading-relaxed">
          Confessly is a privacy-first platform where you can release your burdens, share funny stories, or admit secrets completely anonymously. No accounts, no tracing.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 mt-6 w-full justify-center">
          <Link href="/write" className="w-full sm:w-auto">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              className="w-full sm:w-auto bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:to-pink-600 text-white font-semibold px-8 py-4 rounded-2xl shadow-xl shadow-indigo-500/25 flex items-center justify-center gap-2 text-base transition-all duration-300 border border-white/10 cursor-pointer"
            >
              <PenTool className="h-4.5 w-4.5" />
              <span>Write a Confession</span>
            </motion.button>
          </Link>
          <Link href="/feed" className="w-full sm:w-auto">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              className="w-full sm:w-auto glass hover:bg-white/10 text-slate-200 font-semibold px-8 py-4 rounded-2xl flex items-center justify-center gap-2 text-base transition-colors duration-300 cursor-pointer"
            >
              <span>Explore Confessions</span>
              <ChevronRight className="h-4.5 w-4.5" />
            </motion.button>
          </Link>
        </div>
      </motion.section>

      {/* Feature Cards Section */}
      <motion.section 
        className="w-full flex flex-col items-center gap-12"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
      >
        <div className="text-center max-w-xl flex flex-col items-center gap-2">
          <h2 className="text-3xl font-bold tracking-tight text-white">Why Use Confessly?</h2>
          <p className="text-slate-400 font-light">We place safety, kindness, and absolute privacy at the core of everything we do.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
          {featureList.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <motion.div
                key={idx}
                variants={itemVariants}
                className="glass p-6 rounded-2xl border border-white/5 flex flex-col gap-4 text-left hover:border-white/10 transition-colors"
              >
                <div className={`p-3 rounded-xl w-fit ${feat.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-white">{feat.title}</h3>
                <p className="text-slate-400 text-sm font-light leading-relaxed">{feat.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </motion.section>

      {/* Latest Confessions Preview Section */}
      <motion.section 
        className="w-full flex flex-col items-center gap-10"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true, margin: "-100px" }}
      >
        <div className="w-full flex items-end justify-between border-b border-white/5 pb-4">
          <div className="text-left flex flex-col gap-1">
            <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Recent Confessions</h2>
            <p className="text-slate-400 text-sm font-light">See what people are sharing anonymously right now.</p>
          </div>
          <Link href="/feed" className="text-sm font-semibold text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1">
            <span>View all feed</span>
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        {latestApproved.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
            {latestApproved.map((confession) => (
              <div key={confession.id} className="h-full">
                <ConfessionCard confession={confession} />
              </div>
            ))}
          </div>
        ) : (
          <div className="glass p-12 rounded-2xl border border-white/5 w-full text-center">
            <p className="text-slate-400 font-light">No approved confessions found. Go write the first one!</p>
            <Link href="/write" className="mt-4 inline-block text-indigo-400 hover:text-indigo-300 font-medium text-sm">
              Write a Confession →
            </Link>
          </div>
        )}
      </motion.section>
    </div>
  );
}
