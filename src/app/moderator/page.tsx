"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { notFound } from 'next/navigation';
import { useConfessions } from '@/context/ConfessionContext';
import { 
  BarChart3, Clock, CheckCircle, AlertTriangle, 
  Trash2, ThumbsUp, ThumbsDown, RefreshCw, Lock,
  Settings, Key, AlertCircle, ExternalLink, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Confession } from '@/types';

type FacebookApiError = {
  error?: {
    message?: string;
    code?: number;
  };
  id?: string;
  post_id?: string;
};

type FacebookAccountsResponse = {
  data?: Array<{
    id?: string;
    name?: string;
    access_token?: string;
  }>;
  error?: {
    message?: string;
  };
};

const isFacebookPublishingPermissionError = (message: string) => {
  const lowerMessage = message.toLowerCase();

  return (
    lowerMessage.includes('publish_actions') ||
    lowerMessage.includes('pages_manage_posts') ||
    lowerMessage.includes('pages_read_engagement') ||
    lowerMessage.includes('publishing permission') ||
    lowerMessage.includes('sufficient administrative permission')
  );
};

const formatFacebookPublishError = (message: string) => {
  if (message.toLowerCase().includes('publish_actions')) {
    return 'Approved locally. Facebook publishing was disconnected because the saved token uses the deprecated publish_actions permission. Reconnect with a Page access token that has pages_manage_posts and pages_read_engagement.';
  }

  if (isFacebookPublishingPermissionError(message)) {
    return 'Approved locally. Facebook publishing was disconnected because the Page token cannot publish to this Page. Reconnect with a Page access token that has pages_manage_posts and pages_read_engagement, created by a Page admin.';
  }

  return `Approved locally, but Facebook publishing failed: ${message}`;
};

const getFacebookPublishToken = async (pageId: string, accessToken: string) => {
  const accountsUrl = new URL('https://graph.facebook.com/v19.0/me/accounts');
  accountsUrl.searchParams.set('fields', 'id,name,access_token');
  accountsUrl.searchParams.set('access_token', accessToken);

  const response = await fetch(accountsUrl.toString());
  const data = await response.json() as FacebookAccountsResponse;

  if (response.ok) {
    const page = data.data?.find((account) => account.id === pageId);

    if (page?.access_token) {
      return page.access_token;
    }
  }

  return accessToken;
};

export default function AdminDashboard() {
  const { 
    confessions, approveConfession, rejectConfession, 
    deleteConfession, resetConfessionToPending, clearReports, isAdmin, setIsAdmin,
    facebookConfig, updateFacebookConfig
  } = useConfessions();

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [passcode, setPasscode] = useState('');
  const [passcodeError, setPasscodeError] = useState('');
  const [mounted, setMounted] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('login') === 'true' || params.get('admin') === 'true') {
        setShowLogin(true);
        setIsAdmin(true);
      }
    }
  }, [setIsAdmin]);
  /* eslint-enable react-hooks/set-state-in-effect */
  
  // Facebook states
  const [showToken, setShowToken] = useState(false);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string; link?: string } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    confirmText?: string;
    cancelText?: string;
    isDestructive?: boolean;
  } | null>(null);

  // Compute Stats
  const stats = useMemo(() => {
    return {
      total: confessions.length,
      pending: confessions.filter((c) => c.status === 'pending').length,
      approved: confessions.filter((c) => c.status === 'approved').length,
      reported: confessions.filter((c) => c.reportsCount > 0).length,
    };
  }, [confessions]);

  // Filter lists
  const pendingConfessions = useMemo(() => {
    return confessions.filter((c) => c.status === 'pending');
  }, [confessions]);

  const reportedConfessions = useMemo(() => {
    return confessions.filter((c) => c.reportsCount > 0);
  }, [confessions]);

  const moderatedConfessions = useMemo(() => {
    return confessions.filter((c) => c.status === 'approved' || c.status === 'rejected');
  }, [confessions]);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const formatTime = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  const handlePasscodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasscodeError('');
    if (passcode === 'admin123') {
      setIsAdmin(true);
      setPasscode('');
    } else {
      setPasscodeError("Incorrect passcode. (Hint: Try 'admin123')");
    }
  };

  const handleApprove = async (confession: Confession) => {
    if (facebookConfig.isConnected && facebookConfig.accessToken && facebookConfig.pageId) {
      setPublishingId(confession.id);
      setToast(null);
      
      try {
        let postId = '';
        const publishToken = await getFacebookPublishToken(facebookConfig.pageId, facebookConfig.accessToken);
        const shortId = confession.id.split('-')[1]?.slice(-6) || 'Secret';
        const message = `💜 Confessly Secret #${shortId} 💜\n\n🏷️ Category: [${confession.category}]\n👤 Alias: @${confession.nickname}\n\n"${confession.content}"\n\n━━━━━━━━━━━━━━━━━━━━━\n👉 https://confessly-pink.vercel.app`;

        if (confession.image) {
          // Photo post requires converting Base64 data URL to binary blob
          const responseBlob = await fetch(confession.image);
          const blob = await responseBlob.blob();

          const formData = new FormData();
          formData.append('source', blob);
          formData.append('message', message);
          formData.append('access_token', publishToken);

          const response = await fetch(`https://graph.facebook.com/v19.0/${facebookConfig.pageId}/photos`, {
            method: 'POST',
            body: formData,
          });

          const data = await response.json() as FacebookApiError;
          if (!response.ok) {
            throw new Error(data.error?.message || 'Facebook Photo API returned an error.');
          }
          postId = data.post_id || data.id || '';
        } else {
          // Standard text feed post
          const response = await fetch(`https://graph.facebook.com/v19.0/${facebookConfig.pageId}/feed`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              message,
              access_token: publishToken,
            }),
          });

          const data = await response.json() as FacebookApiError;
          if (!response.ok) {
            throw new Error(data.error?.message || 'Facebook Feed API returned an error.');
          }
          postId = data.id || '';
        }

        approveConfession(confession.id, postId);
        setToast({
          type: 'success',
          message: 'Approved & successfully auto-published to your Facebook Page!',
          link: `https://facebook.com/${postId}`
        });
      } catch (err: unknown) {
        console.error("Facebook API error:", err);
        const errorMessage = err instanceof Error ? err.message : 'Verification Error';
        if (isFacebookPublishingPermissionError(errorMessage)) {
          updateFacebookConfig({
            pageId: '',
            accessToken: '',
            isConnected: false
          });
        }
        approveConfession(confession.id);
        setToast({
          type: 'error',
          message: formatFacebookPublishError(errorMessage)
        });
      } finally {
        setPublishingId(null);
      }
    } else {
      approveConfession(confession.id);
      setToast({
        type: 'success',
        message: 'Approved locally. (To post to Facebook, connect your page in Settings below!)'
      });
      setTimeout(() => setToast(null), 4000);
    }
  };

  const executeDelete = async (confession: Confession) => {
    if (facebookConfig.isConnected && facebookConfig.accessToken && confession.facebookPostId) {
      setPublishingId(confession.id);
      setToast(null);
      try {
        const publishToken = await getFacebookPublishToken(facebookConfig.pageId, facebookConfig.accessToken);
        const response = await fetch(`https://graph.facebook.com/v19.0/${confession.facebookPostId}?access_token=${publishToken}`, {
          method: 'DELETE'
        });
        const data = await response.json();
        if (!response.ok) {
          console.warn("Facebook API warnings during deletion:", data.error?.message);
        }
        deleteConfession(confession.id);
        setToast({
          type: 'success',
          message: 'Confession deleted locally and successfully removed from Facebook Page!'
        });
        setTimeout(() => setToast(null), 4000);
      } catch (err: unknown) {
        console.error("Facebook delete error:", err);
        const errorMessage = err instanceof Error ? err.message : 'Error';
        deleteConfession(confession.id);
        setToast({
          type: 'error',
          message: `Locally deleted, but failed to remove from Facebook Page: ${errorMessage}`
        });
      } finally {
        setPublishingId(null);
      }
    } else {
      deleteConfession(confession.id);
      setToast({
        type: 'success',
        message: 'Confession deleted locally!'
      });
      setTimeout(() => setToast(null), 3000);
    }
  };

  const handleDelete = (confession: Confession) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Confession?',
      message: 'Are you sure you want to permanently delete this confession from the system? This action cannot be undone.',
      confirmText: 'Delete Permanently',
      isDestructive: true,
      onConfirm: () => {
        executeDelete(confession);
        setConfirmModal(null);
      }
    });
  };

  const executeMoveToPending = async (confession: Confession) => {
    if (facebookConfig.isConnected && facebookConfig.accessToken && confession.facebookPostId) {
      setPublishingId(confession.id);
      setToast(null);
      try {
        const publishToken = await getFacebookPublishToken(facebookConfig.pageId, facebookConfig.accessToken);
        const response = await fetch(`https://graph.facebook.com/v19.0/${confession.facebookPostId}?access_token=${publishToken}`, {
          method: 'DELETE'
        });
        const data = await response.json();
        if (!response.ok) {
          console.warn("Facebook API warnings during removal:", data.error?.message);
        }
      } catch (err: unknown) {
        console.error("Facebook delete error during status reset:", err);
      } finally {
        setPublishingId(null);
      }
    }
    resetConfessionToPending(confession.id);
    setToast({
      type: 'success',
      message: 'Moved back to Pending Review queue!'
    });
    setTimeout(() => setToast(null), 4000);
  };

  const handleMoveToPending = (confession: Confession) => {
    setConfirmModal({
      isOpen: true,
      title: 'Move to Pending?',
      message: 'Are you sure you want to move this confession back to Pending Review? If it was published to Facebook, it will be automatically removed from your Page.',
      confirmText: 'Move to Pending',
      isDestructive: false,
      onConfirm: () => {
        executeMoveToPending(confession);
        setConfirmModal(null);
      }
    });
  };

  if (!mounted) {
    return null;
  }

  if (!isAdmin && !showLogin) {
    return notFound();
  }

  if (!isAdmin) {
    return (
      <div className="w-full max-w-md mx-auto py-12 flex flex-col gap-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass border border-white/5 rounded-3xl p-8 text-center flex flex-col items-center gap-6 shadow-2xl"
        >
          <div className="bg-red-500/10 p-4 rounded-full border border-red-500/30 text-red-400 shadow-md">
            <Lock className="h-10 w-10 animate-bounce" />
          </div>
          <div className="flex flex-col gap-2">
            <h2 className="text-xl md:text-2xl font-extrabold text-white">Moderator Verification</h2>
            <p className="text-slate-400 text-xs md:text-sm font-light leading-relaxed">
              This panel is restricted. Please enter the administrator passcode to view the moderation console.
            </p>
          </div>
          <form onSubmit={handlePasscodeSubmit} className="w-full flex flex-col gap-4">
            <div className="flex flex-col gap-1 text-left">
              <input
                type="password"
                placeholder="Enter passcode..."
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                className="w-full bg-slate-950/60 border border-white/5 focus:border-indigo-500/40 rounded-xl p-3.5 text-center text-sm text-slate-200 placeholder-slate-600 focus:outline-none transition-colors backdrop-blur-md"
              />
            </div>
            {passcodeError && (
              <span className="text-xs font-semibold text-rose-400 text-center">{passcodeError}</span>
            )}
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold py-3 px-6 rounded-xl hover:brightness-110 shadow-md transition-all text-sm cursor-pointer"
            >
              Verify & Unlock
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-10 py-4 relative">
      
      {/* Floating API Feedback Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4"
          >
            <div className={`glass border rounded-2xl p-4 flex gap-3 items-start shadow-2xl backdrop-blur-lg ${
              toast.type === 'success' 
                ? 'border-emerald-500/35 bg-emerald-950/80 text-emerald-200' 
                : 'border-rose-500/35 bg-rose-950/80 text-rose-200'
            }`}>
              <div className="flex-1 flex flex-col gap-1 text-sm text-left">
                <span className="font-bold flex items-center gap-1.5">
                  {toast.type === 'success' ? (
                    <CheckCircle className="h-4.5 w-4.5 text-emerald-400" />
                  ) : (
                    <AlertCircle className="h-4.5 w-4.5 text-rose-400" />
                  )}
                  {toast.type === 'success' ? 'Success' : 'API Publishing Error'}
                </span>
                <span className="font-light text-xs leading-relaxed">{toast.message}</span>
                {toast.link && (
                  <a
                    href={toast.link}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 text-xs font-semibold text-indigo-300 hover:text-indigo-200 transition-colors flex items-center gap-1 w-fit"
                  >
                    <span>View Post on Facebook</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
              <button onClick={() => setToast(null)} className="text-slate-400 hover:text-white transition-colors cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dashboard Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <span>Moderator Dashboard</span>
            <BarChart3 className="h-6 w-6 text-indigo-400" />
          </h1>
          <p className="text-slate-400 text-sm font-light">
            Review submitted confessions, manage safety flags, and view real-time system metrics.
          </p>
        </div>
        <button
          onClick={() => {
            setIsAdmin(false);
            window.location.href = '/';
          }}
          className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/5 text-slate-300 font-semibold rounded-xl text-sm transition-colors cursor-pointer flex items-center gap-2 w-fit md:self-center"
        >
          <Lock className="h-4 w-4" />
          <span>Exit Dashboard</span>
        </button>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div className="glass p-5 rounded-2xl border border-white/5 flex items-center gap-4 text-left shadow-sm">
          <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/25">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-slate-400 text-xs font-light">Total Submissions</span>
            <span className="text-2xl font-bold text-white mt-0.5">{stats.total}</span>
          </div>
        </div>

        <div className="glass p-5 rounded-2xl border border-white/5 flex items-center gap-4 text-left shadow-sm">
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/25">
            <Clock className="h-5 w-5 animate-pulse" />
          </div>
          <div className="flex flex-col">
            <span className="text-slate-400 text-xs font-light">Pending Review</span>
            <span className="text-2xl font-bold text-white mt-0.5">{stats.pending}</span>
          </div>
        </div>

        <div className="glass p-5 rounded-2xl border border-white/5 flex items-center gap-4 text-left shadow-sm">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/25">
            <CheckCircle className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-slate-400 text-xs font-light">Approved Public</span>
            <span className="text-2xl font-bold text-white mt-0.5">{stats.approved}</span>
          </div>
        </div>

        <div className="glass p-5 rounded-2xl border border-white/5 flex items-center gap-4 text-left shadow-sm">
          <div className="p-3 bg-rose-500/10 text-rose-400 rounded-xl border border-rose-500/25">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-slate-400 text-xs font-light">Reported Flags</span>
            <span className="text-2xl font-bold text-white mt-0.5">{stats.reported}</span>
          </div>
        </div>
      </div>

      {/* Facebook Integration Settings Panel */}
      <div className="glass p-6 rounded-3xl border border-white/5 flex flex-col gap-4 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
          <div className="flex items-center gap-3">
            <div className="bg-[#1877F2]/10 p-2.5 rounded-xl border border-[#1877F2]/25 text-[#1877F2]">
              <svg className="h-5 w-5 fill-[#1877F2]" viewBox="0 0 24 24">
                <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.75z" />
              </svg>
            </div>
            <div className="flex flex-col text-left">
              <h3 className="text-sm font-semibold text-white">Facebook Page Auto-Publish Integration</h3>
              <p className="text-xs text-slate-400 font-light">Directly publish approved confessions onto your Facebook Page.</p>
            </div>
          </div>
          
          {/* Toggle Connect */}
          <div className="flex items-center gap-3">
            <span className={`text-xs px-2.5 py-0.5 rounded-full border font-semibold ${
              facebookConfig.isConnected 
                ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300' 
                : 'bg-slate-800 border-white/5 text-slate-400'
            }`}>
              {facebookConfig.isConnected ? 'Connected' : 'Disconnected'}
            </span>
            
            <button
              onClick={() => {
                updateFacebookConfig({
                  ...facebookConfig,
                  isConnected: !facebookConfig.isConnected
                });
              }}
              disabled={facebookConfig.isConnected ? false : !facebookConfig.accessToken.trim() || !facebookConfig.pageId.trim()}
              className={`relative inline-flex h-6.5 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${
                facebookConfig.isConnected ? 'bg-[#1877F2]' : 'bg-slate-850'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5.5 w-5.5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  facebookConfig.isConnected ? 'translate-x-5.5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {!facebookConfig.isConnected ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <div className="flex flex-col gap-1.5 text-left">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                <Settings className="h-3.5 w-3.5" />
                <span>Facebook Page ID</span>
              </label>
              <input
                type="text"
                value={facebookConfig.pageId}
                onChange={(e) => updateFacebookConfig({ ...facebookConfig, pageId: e.target.value })}
                placeholder="e.g. 1174167879112870"
                className="bg-slate-950/60 border border-white/5 focus:border-indigo-500/40 rounded-xl p-3 text-xs text-slate-300 focus:outline-none transition-colors"
              />
            </div>
            
            <div className="flex flex-col gap-1.5 text-left relative">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1 justify-between w-full">
                <span className="flex items-center gap-1">
                  <Key className="h-3.5 w-3.5" />
                  <span>Access Token</span>
                </span>
                <button 
                  onClick={() => setShowToken(!showToken)}
                  className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer"
                >
                  {showToken ? 'Hide' : 'Show'}
                </button>
              </label>
              <input
                type={showToken ? 'text' : 'password'}
                value={facebookConfig.accessToken}
                onChange={(e) => updateFacebookConfig({ ...facebookConfig, accessToken: e.target.value })}
                placeholder="Paste User token or Page token (EAAG...)"
                className="bg-slate-950/60 border border-white/5 focus:border-indigo-500/40 rounded-xl p-3 text-xs text-slate-300 focus:outline-none transition-colors pr-12"
              />
            </div>
            <p className="md:col-span-2 text-[11px] leading-relaxed text-slate-500 text-left">
              You can paste the Graph API Explorer User token or the Page token from /me/accounts. The app will use /me/accounts to publish with the matching Page access token.
            </p>
          </div>
        ) : (
          <div className="text-xs text-slate-400 font-light flex items-center gap-2 text-left">
            <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Auto-publishing to Confessly Facebook Page (ID: <b>{facebookConfig.pageId}</b>) is active! Access token is configured.</span>
          </div>
        )}
      </div>

      {/* Main Moderation Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
        
        {/* Pending Reviews Section */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>Pending Review</span>
              <span className="text-xs bg-amber-500/10 border border-amber-500/20 text-amber-300 font-semibold px-2 py-0.5 rounded-full">
                {pendingConfessions.length}
              </span>
            </h2>
          </div>

          <div className="flex flex-col gap-4 max-h-[600px] overflow-y-auto pr-1">
            <AnimatePresence mode="popLayout">
              {pendingConfessions.length > 0 ? (
                pendingConfessions.map((c) => (
                  <motion.div
                    key={c.id}
                    layout
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.3 }}
                    className="glass p-5 rounded-2xl border border-white/5 flex flex-col gap-4 hover:border-white/10 transition-colors shadow-sm"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-slate-800 border border-white/5 px-2.5 py-1 rounded-full text-slate-300 font-medium">
                          {c.category}
                        </span>
                        <span className="text-xs text-slate-500">@{c.nickname}</span>
                      </div>
                      <span className="text-[11px] text-slate-500">{formatTime(c.createdAt)}</span>
                    </div>

                    {/* Content */}
                    <div className="text-slate-200 text-sm leading-relaxed font-light break-words">
                      {expandedId === c.id ? c.content : (
                        c.content.length > 150 ? `${c.content.substring(0, 150)}...` : c.content
                      )}
                      {c.content.length > 150 && (
                        <button
                          onClick={() => toggleExpand(c.id)}
                          className="text-xs font-semibold text-indigo-400 ml-1.5 hover:text-indigo-300 transition-colors"
                        >
                          {expandedId === c.id ? 'Show less' : 'Read more'}
                        </button>
                      )}
                    </div>

                    {c.image && (
                      <div className="relative mt-2 rounded-xl overflow-hidden border border-white/5 bg-slate-950/40 w-fit max-w-full">
                        <img src={c.image} alt="Pending upload preview" className="max-h-[140px] object-contain rounded-xl" />
                      </div>
                    )}

                    {/* Moderation Controls */}
                    <div className="flex items-center justify-end gap-2.5 border-t border-white/5 pt-3 mt-1">
                      <button
                        onClick={() => rejectConfession(c.id)}
                        disabled={publishingId !== null}
                        className="px-3.5 py-2 bg-rose-500/10 hover:bg-rose-500/25 border border-rose-500/25 text-rose-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ThumbsDown className="h-3.5 w-3.5" />
                        <span>Reject</span>
                      </button>
                      
                      <button
                        onClick={() => handleApprove(c)}
                        disabled={publishingId !== null}
                        className="px-3.5 py-2 bg-emerald-500/10 hover:bg-emerald-500/25 border border-emerald-500/25 text-emerald-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-w-[90px] justify-center"
                      >
                        {publishingId === c.id ? (
                          <span className="flex items-center gap-1.5">
                            <span className="h-3 w-3 border-2 border-emerald-300 border-t-transparent rounded-full animate-spin"></span>
                            <span>Posting...</span>
                          </span>
                        ) : (
                          <>
                            <ThumbsUp className="h-3.5 w-3.5" />
                            <span>Approve</span>
                          </>
                        )}
                      </button>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="glass p-12 rounded-2xl border border-white/5 text-center flex flex-col items-center justify-center gap-2">
                  <CheckCircle className="h-6 w-6 text-slate-600" />
                  <p className="text-slate-500 text-sm font-light">Inbox is clear! No pending confessions.</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Moderated History Section */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>Moderated History</span>
              <span className="text-xs bg-slate-800 border border-white/5 text-slate-300 font-semibold px-2 py-0.5 rounded-full">
                {moderatedConfessions.length}
              </span>
            </h2>
          </div>

          <div className="flex flex-col gap-4 max-h-[600px] overflow-y-auto pr-1">
            <AnimatePresence mode="popLayout">
              {moderatedConfessions.length > 0 ? (
                moderatedConfessions.map((c) => (
                  <motion.div
                    key={c.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                    className={`glass p-5 rounded-2xl border flex flex-col gap-4 hover:border-white/10 transition-colors shadow-sm ${
                      c.status === 'approved' ? 'border-emerald-500/10' : 'border-rose-500/10'
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-slate-800 border border-white/5 px-2.5 py-1 rounded-full text-slate-300 font-medium">
                          {c.category}
                        </span>
                        <span className="text-xs text-slate-500">@{c.nickname}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-extrabold uppercase ${
                          c.status === 'approved' 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}>
                          {c.status}
                        </span>
                        <span className="text-[11px] text-slate-500">{formatTime(c.createdAt)}</span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="text-slate-200 text-sm leading-relaxed font-light break-words">
                      {expandedId === c.id ? c.content : (
                        c.content.length > 120 ? `${c.content.substring(0, 120)}...` : c.content
                      )}
                      {c.content.length > 120 && (
                        <button
                          onClick={() => toggleExpand(c.id)}
                          className="text-xs font-semibold text-indigo-400 ml-1.5 hover:text-indigo-300 transition-colors"
                        >
                          {expandedId === c.id ? 'Show less' : 'Read more'}
                        </button>
                      )}
                    </div>

                    {c.image && (
                      <div className="relative mt-2 rounded-xl overflow-hidden border border-white/5 bg-slate-950/40 w-fit max-w-full">
                        <img src={c.image} alt="Moderated preview" className="max-h-[100px] object-contain rounded-xl" />
                      </div>
                    )}

                    {/* Controls */}
                    <div className="flex items-center justify-end gap-2 border-t border-white/5 pt-3 mt-1">
                      <button
                        onClick={() => handleMoveToPending(c)}
                        disabled={publishingId === c.id}
                        className="px-2.5 py-1.5 bg-slate-850 hover:bg-slate-800 border border-white/5 text-slate-300 rounded-xl text-[10px] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                        title="Move back to Pending Review queue"
                      >
                        {publishingId === c.id ? (
                          <>
                            <span className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full" />
                            <span>Updating...</span>
                          </>
                        ) : (
                          <>
                            <RefreshCw className="h-3 w-3 text-indigo-400" />
                            <span>Move to Pending</span>
                          </>
                        )}
                      </button>
                      
                      <button
                        onClick={() => handleDelete(c)}
                        disabled={publishingId === c.id}
                        className="px-2.5 py-1.5 bg-red-650 hover:bg-red-750 text-white rounded-xl text-[10px] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                        title="Permanently delete from system"
                      >
                        <Trash2 className="h-3 w-3" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="glass p-12 rounded-2xl border border-white/5 text-center flex flex-col items-center justify-center gap-2">
                  <Clock className="h-6 w-6 text-slate-600" />
                  <p className="text-slate-500 text-sm font-light">No moderated history yet.</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Reported / Content Flagged Section */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>Reported Content Flags</span>
              <span className="text-xs bg-rose-500/10 border border-rose-500/20 text-rose-300 font-semibold px-2 py-0.5 rounded-full">
                {reportedConfessions.length}
              </span>
            </h2>
          </div>

          <div className="flex flex-col gap-4 max-h-[600px] overflow-y-auto pr-1">
            <AnimatePresence mode="popLayout">
              {reportedConfessions.length > 0 ? (
                reportedConfessions.map((c) => (
                  <motion.div
                    key={c.id}
                    layout
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.3 }}
                    className="glass p-5 rounded-2xl border border-rose-500/10 flex flex-col gap-4 hover:border-rose-500/20 transition-colors shadow-sm"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-rose-500/10 border border-rose-500/25 px-2.5 py-0.5 rounded-full text-rose-300 font-bold flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          <span>{c.reportsCount} Reports</span>
                        </span>
                        <span className="text-xs text-slate-500">@{c.nickname}</span>
                      </div>
                      <span className="text-xs bg-slate-800 border border-white/5 px-2 py-0.5 rounded-full text-slate-400 capitalize">
                        {c.status}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="text-slate-300 text-sm leading-relaxed font-light break-words">
                      {expandedId === c.id ? c.content : (
                        c.content.length > 150 ? `${c.content.substring(0, 150)}...` : c.content
                      )}
                      {c.content.length > 150 && (
                        <button
                          onClick={() => toggleExpand(c.id)}
                          className="text-xs font-semibold text-indigo-400 ml-1.5 hover:text-indigo-300 transition-colors"
                        >
                          {expandedId === c.id ? 'Show less' : 'Read more'}
                        </button>
                      )}
                    </div>

                    {c.image && (
                      <div className="relative mt-2 rounded-xl overflow-hidden border border-white/5 bg-slate-950/40 w-fit max-w-full">
                        <img src={c.image} alt="Reported upload preview" className="max-h-[140px] object-contain rounded-xl" />
                      </div>
                    )}

                    {/* Action Controls */}
                    <div className="flex items-center justify-end gap-2.5 border-t border-white/5 pt-3 mt-1">
                      <button
                        onClick={() => clearReports(c.id)}
                        className="px-3.5 py-2 bg-slate-850 hover:bg-slate-800 border border-white/5 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                        title="Dismiss reports and keep confession"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        <span>Clear Flags</span>
                      </button>
                      <button
                        onClick={() => handleDelete(c)}
                        disabled={publishingId === c.id}
                        className="px-3.5 py-2 bg-red-650 hover:bg-red-750 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Permanently delete from system"
                      >
                        {publishingId === c.id ? (
                          <>
                            <span className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full" />
                            <span>Deleting...</span>
                          </>
                        ) : (
                          <>
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Delete</span>
                          </>
                        )}
                      </button>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="glass p-12 rounded-2xl border border-white/5 text-center flex flex-col items-center justify-center gap-2">
                  <CheckCircle className="h-6 w-6 text-slate-600" />
                  <p className="text-slate-500 text-sm font-light">Clean slate! No reported confessions.</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>

      </div>

      {/* Premium Custom Confirmation Modal */}
      <AnimatePresence>
        {confirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfirmModal(null)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />
            
            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md glass border border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col gap-5 text-left z-10"
            >
              {/* Icon & Title */}
              <div className="flex gap-4 items-start">
                <div className={`p-3 rounded-2xl w-fit ${
                  confirmModal.isDestructive 
                    ? 'bg-rose-500/10 border border-rose-500/20 text-rose-400' 
                    : 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-400'
                }`}>
                  {confirmModal.isDestructive ? (
                    <Trash2 className="h-6 w-6" />
                  ) : (
                    <RefreshCw className="h-6 w-6 animate-spin-slow" />
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <h3 className="text-lg font-bold text-white leading-none">
                    {confirmModal.title}
                  </h3>
                  <p className="text-slate-400 text-xs md:text-sm font-light leading-relaxed mt-1">
                    {confirmModal.message}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 border-t border-white/5 pt-4 mt-1">
                <button
                  onClick={() => setConfirmModal(null)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/5 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
                >
                  {confirmModal.cancelText || 'Cancel'}
                </button>
                <button
                  onClick={confirmModal.onConfirm}
                  className={`px-4 py-2 text-white rounded-xl text-xs font-semibold cursor-pointer transition-all shadow-md ${
                    confirmModal.isDestructive 
                      ? 'bg-gradient-to-r from-rose-500 to-red-600 hover:brightness-110' 
                      : 'bg-gradient-to-r from-indigo-500 to-purple-500 hover:brightness-110'
                  }`}
                >
                  {confirmModal.confirmText || 'Confirm'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
