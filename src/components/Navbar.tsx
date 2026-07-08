"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useConfessions } from '@/context/ConfessionContext';
import { Sparkles, MessageSquare, PlusCircle, Shield, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const Navbar = () => {
  const pathname = usePathname();
  const { confessions, isAdmin } = useConfessions();
  const [isOpen, setIsOpen] = useState(false);

  // Count pending reviews
  const pendingCount = confessions.filter((c) => c.status === 'pending').length;

  const links = [
    { href: '/feed', label: 'Explore Feed', icon: MessageSquare },
    { href: '/write', label: 'Write Confession', icon: PlusCircle },
    ...(isAdmin ? [{ 
      href: '/moderator', 
      label: 'Moderator Panel', 
      icon: Shield,
      badge: pendingCount > 0 ? pendingCount : undefined 
    }] : []),
  ];

  const toggleMenu = () => setIsOpen(!isOpen);

  const pressTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const startPress = () => {
    pressTimerRef.current = setTimeout(() => {
      window.location.href = '/moderator';
    }, 1500); // Hold for 1.5 seconds to enter admin
  };

  const endPress = () => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
    }
  };

  return (
    <nav className="sticky top-0 z-50 w-full glass border-b border-white/5 py-4 px-6 md:px-12 backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo (Triple-click on desktop or 1.5s Hold on mobile enters Moderator Panel) */}
        <div 
          onClick={(e) => {
            if (e.detail === 3) {
              window.location.href = '/moderator';
            }
          }}
          onTouchStart={startPress}
          onTouchEnd={endPress}
          onTouchMove={endPress}
          className="flex items-center gap-2 cursor-pointer select-none"
        >
          <Link href="/" className="flex items-center gap-2 group">
            <div className="bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 p-2 rounded-xl shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform duration-300">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white group-hover:text-purple-300 transition-colors duration-300">
              Confessly
            </span>
          </Link>
        </div>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-2">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 hover:bg-white/5 ${
                  isActive 
                    ? 'text-white' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-nav"
                    className="absolute inset-0 bg-gradient-to-r from-indigo-600/30 to-purple-600/30 border border-indigo-500/35 rounded-xl -z-10"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <Icon className="h-4 w-4" />
                <span>{link.label}</span>
                {link.badge !== undefined && (
                  <span className="ml-1 bg-red-500/90 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full ring-2 ring-indigo-900 animate-pulse">
                    {link.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Mobile controls */}
        <div className="flex items-center gap-3 md:hidden">
          {/* Mobile Toggle */}
          <button
            onClick={toggleMenu}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors focus:outline-none"
            aria-label="Toggle Menu"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden w-full overflow-hidden mt-4 border-t border-white/5"
          >
            <div className="flex flex-col gap-2 py-4">
              {links.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    onClick={() => setIsOpen(false)}
                    href={link.href}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      isActive 
                        ? 'bg-gradient-to-r from-indigo-600/20 to-purple-600/20 text-white border-l-2 border-indigo-500' 
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-4 w-4" />
                      <span>{link.label}</span>
                    </div>
                    {link.badge !== undefined && (
                      <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {link.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};
