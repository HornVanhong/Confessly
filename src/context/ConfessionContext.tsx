"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Confession, ConfessionCategory } from '@/types';

export interface FacebookConfig {
  pageId: string;
  accessToken: string;
  isConnected: boolean;
}

const DEFAULT_FACEBOOK_CONFIG: FacebookConfig = {
  pageId: '1174167879112870',
  accessToken: '',
  isConnected: false
};

interface ConfessionContextType {
  confessions: Confession[];
  addConfession: (content: string, category: ConfessionCategory, nickname: string, isPublic: boolean, image?: string) => Confession;
  addComment: (confessionId: string, content: string, nickname: string) => void;
  addReaction: (confessionId: string, reactionType: 'hug' | 'heart' | 'sad' | 'laugh' | 'shocked') => void;
  approveConfession: (confessionId: string, facebookPostId?: string) => void;
  rejectConfession: (confessionId: string) => void;
  deleteConfession: (confessionId: string) => void;
  resetConfessionToPending: (confessionId: string) => void;
  reportConfession: (confessionId: string) => void;
  clearReports: (confessionId: string) => void;
  isAdmin: boolean;
  setIsAdmin: (isAdmin: boolean) => void;
  facebookConfig: FacebookConfig;
  updateFacebookConfig: (config: FacebookConfig) => void;
}

const ConfessionContext = createContext<ConfessionContextType | undefined>(undefined);

export const ConfessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [confessions, setConfessions] = useState<Confession[]>([]);
  const [isAdmin, setIsAdminState] = useState(false);
  const [facebookConfig, setFacebookConfig] = useState<FacebookConfig>(DEFAULT_FACEBOOK_CONFIG);

  // Load initial data on mount
  useEffect(() => {
    const fetchConfessions = async () => {
      try {
        const res = await fetch('/api/confessions');
        if (res.ok) {
          const data = await res.json();
          setTimeout(() => {
            setConfessions(data);
          }, 0);
        }
      } catch (error) {
        console.error("Failed to load confessions from MySQL:", error);
      }
    };
    fetchConfessions();

    // Load admin session
    const adminSession = localStorage.getItem('confessly_admin_session');
    if (adminSession === 'true') {
      setTimeout(() => {
        setIsAdminState(true);
      }, 0);
    }

    // Load facebook config
    const storedFB = localStorage.getItem('confessly_facebook_config');
    if (storedFB) {
      try {
        const parsed = JSON.parse(storedFB) as Partial<FacebookConfig>;
        const storedConfig: FacebookConfig = {
          pageId: parsed.pageId || DEFAULT_FACEBOOK_CONFIG.pageId,
          accessToken: parsed.accessToken || '',
          isConnected: Boolean(parsed.isConnected && (parsed.pageId || DEFAULT_FACEBOOK_CONFIG.pageId) && parsed.accessToken)
        };
        setTimeout(() => {
          setFacebookConfig(storedConfig);
        }, 0);

        // Auto-sync configuration to server on mount if connected
        if (storedConfig.isConnected && storedConfig.accessToken) {
          fetch('/api/settings/facebook', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(storedConfig),
          }).catch((err) => console.error('Failed to auto-sync Facebook config to server:', err));
        }
      } catch (error) {
        console.error("Failed to parse facebook config", error);
        localStorage.setItem('confessly_facebook_config', JSON.stringify(DEFAULT_FACEBOOK_CONFIG));
      }
    } else {
      localStorage.setItem('confessly_facebook_config', JSON.stringify(DEFAULT_FACEBOOK_CONFIG));
      setTimeout(() => {
        setFacebookConfig(DEFAULT_FACEBOOK_CONFIG);
      }, 0);
    }
  }, []);

  const setIsAdmin = (val: boolean) => {
    setIsAdminState(val);
    if (val) {
      localStorage.setItem('confessly_admin_session', 'true');
    } else {
      localStorage.removeItem('confessly_admin_session');
    }
  };

  const updateFacebookConfig = async (config: FacebookConfig) => {
    const nextConfig = {
      pageId: config.pageId.trim() || DEFAULT_FACEBOOK_CONFIG.pageId,
      accessToken: config.accessToken.trim(),
      isConnected: Boolean(config.isConnected && (config.pageId.trim() || DEFAULT_FACEBOOK_CONFIG.pageId) && config.accessToken.trim())
    };
    setFacebookConfig(nextConfig);
    localStorage.setItem('confessly_facebook_config', JSON.stringify(nextConfig));

    try {
      await fetch('/api/settings/facebook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nextConfig)
      });
    } catch (err) {
      console.error('Failed to sync Facebook config with server settings:', err);
    }
  };



  const addConfession = (
    content: string,
    category: ConfessionCategory,
    nickname: string,
    isPublic: boolean,
    image?: string
  ) => {
    const tempId = `temp-${Date.now()}`;
    const newConfession: Confession = {
      id: tempId,
      content,
      category,
      nickname: nickname.trim() || 'Anonymous',
      isPublic,
      status: 'pending',
      createdAt: new Date().toISOString(),
      reactions: { hug: 0, heart: 0, sad: 0, laugh: 0, shocked: 0 },
      comments: [],
      reportsCount: 0,
      image
    };

    setConfessions(prev => [newConfession, ...prev]);

    fetch('/api/confessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, category, nickname, isPublic, image })
    })
      .then(res => {
        if (res.ok) return res.json();
        throw new Error('Failed to create confession');
      })
      .then(saved => {
        setConfessions(prev => prev.map(c => c.id === tempId ? saved : c));
      })
      .catch(err => {
        console.error(err);
        setConfessions(prev => prev.filter(c => c.id !== tempId));
      });

    return newConfession;
  };

  const addComment = (confessionId: string, content: string, nickname: string) => {
    const tempId = `temp-${Date.now()}`;
    const newComment = {
      id: tempId,
      content,
      nickname: nickname.trim() || 'Anonymous',
      createdAt: new Date().toISOString()
    };

    setConfessions(prev => prev.map(c => {
      if (c.id === confessionId) {
        return { ...c, comments: [...c.comments, newComment] };
      }
      return c;
    }));

    fetch(`/api/confessions/${confessionId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, nickname })
    })
      .then(res => {
        if (res.ok) return res.json();
        throw new Error('Failed to add comment');
      })
      .then(saved => {
        setConfessions(prev => prev.map(c => {
          if (c.id === confessionId) {
            return {
              ...c,
              comments: c.comments.map(comm => comm.id === tempId ? saved : comm)
            };
          }
          return c;
        }));
      })
      .catch(err => {
        console.error(err);
        setConfessions(prev => prev.map(c => {
          if (c.id === confessionId) {
            return { ...c, comments: c.comments.filter(comm => comm.id !== tempId) };
          }
          return c;
        }));
      });
  };

  const addReaction = (
    confessionId: string,
    reactionType: 'hug' | 'heart' | 'sad' | 'laugh' | 'shocked'
  ) => {
    setConfessions(prev => prev.map(c => {
      if (c.id === confessionId) {
        return {
          ...c,
          reactions: {
            ...c.reactions,
            [reactionType]: c.reactions[reactionType] + 1
          }
        };
      }
      return c;
    }));

    fetch(`/api/confessions/${confessionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reactionType })
    }).catch(err => {
      console.error("Failed to sync reaction to server", err);
    });
  };

  const approveConfession = (confessionId: string, facebookPostId?: string) => {
    setConfessions(prev => prev.map(c => {
      if (c.id === confessionId) {
        return { ...c, status: 'approved' as const, facebookPostId };
      }
      return c;
    }));

    fetch(`/api/confessions/${confessionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'approved', facebookPostId })
    }).catch(err => {
      console.error("Failed to approve confession", err);
    });
  };

  const rejectConfession = (confessionId: string) => {
    setConfessions(prev => prev.map(c => {
      if (c.id === confessionId) {
        return { ...c, status: 'rejected' as const };
      }
      return c;
    }));

    fetch(`/api/confessions/${confessionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'rejected' })
    }).catch(err => {
      console.error("Failed to reject confession", err);
    });
  };

  const deleteConfession = (confessionId: string) => {
    setConfessions(prev => prev.filter(c => c.id !== confessionId));

    fetch(`/api/confessions/${confessionId}`, {
      method: 'DELETE'
    }).catch(err => {
      console.error("Failed to delete confession from server", err);
    });
  };

  const resetConfessionToPending = (confessionId: string) => {
    setConfessions(prev => prev.map(c => {
      if (c.id === confessionId) {
        return { ...c, status: 'pending' as const, facebookPostId: undefined };
      }
      return c;
    }));

    fetch(`/api/confessions/${confessionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'pending', clearFacebook: true })
    }).catch(err => {
      console.error("Failed to reset confession status", err);
    });
  };

  const reportConfession = (confessionId: string) => {
    setConfessions(prev => prev.map(c => {
      if (c.id === confessionId) {
        return { ...c, reportsCount: c.reportsCount + 1 };
      }
      return c;
    }));

    fetch(`/api/confessions/${confessionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ incrementReports: true })
    }).catch(err => {
      console.error("Failed to report confession on server", err);
    });
  };

  const clearReports = (confessionId: string) => {
    setConfessions(prev => prev.map(c => {
      if (c.id === confessionId) {
        return { ...c, reportsCount: 0 };
      }
      return c;
    }));

    fetch(`/api/confessions/${confessionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clearReports: true })
    }).catch(err => {
      console.error("Failed to clear reports on server", err);
    });
  };

  return (
    <ConfessionContext.Provider
      value={{
        confessions,
        addConfession,
        addComment,
        addReaction,
        approveConfession,
        rejectConfession,
        deleteConfession,
        resetConfessionToPending,
        reportConfession,
        clearReports,
        isAdmin,
        setIsAdmin,
        facebookConfig,
        updateFacebookConfig
      }}
    >
      {children}
    </ConfessionContext.Provider>
  );
};

export const useConfessions = () => {
  const context = useContext(ConfessionContext);
  if (!context) {
    throw new Error('useConfessions must be used within a ConfessionProvider');
  }
  return context;
};
