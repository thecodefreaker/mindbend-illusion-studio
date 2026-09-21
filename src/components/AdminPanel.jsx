import React, { useState, useEffect } from 'react';
import { 
  Instagram, Key, Clock, Send, ShieldCheck, AlertCircle, CheckCircle2, 
  ExternalLink, RefreshCw, Zap, Sliders, Calendar, Globe, Sparkles, Check,
  Search, HelpCircle, ChevronRight, UserCheck, ArrowRight, Lock, LogOut, Monitor,
  ChevronDown, ChevronUp, FileText, Film, Play, Folder, Trash2
} from 'lucide-react';
import { ILLUSIONS_REGISTRY } from '../illusions/registry';

const API_BASE = '/api';

export const AdminPanel = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('connect'); // 'connect' | 'post-now' | 'scheduler' | 'logs'
  const [connectionMethod, setConnectionMethod] = useState('direct'); // 'direct' (No Facebook) | 'meta_api'
  
  // Status state
  const [systemStatus, setSystemStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  // Direct Instagram (No Facebook) State
  const [directUsername, setDirectUsername] = useState('');
  const [directPassword, setDirectPassword] = useState('');
  const [directSession, setDirectSession] = useState({ loggedIn: false, accounts: [] });
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [selectedPostAccount, setSelectedPostAccount] = useState('');

  // Direct Cookie Import State
  const [directAuthMode, setDirectAuthMode] = useState('cookie'); // 'cookie' | 'credentials'
  const [cookieInput, setCookieInput] = useState('');
  const [cookieTargetUser, setCookieTargetUser] = useState('');
  const [isImportingCookie, setIsImportingCookie] = useState(false);
  const [showCookieInstructions, setShowCookieInstructions] = useState(true);

  // Meta Graph API State
  const [accessToken, setAccessToken] = useState('');
  const [igUserId, setIgUserId] = useState('');
  const [customPublicUrl, setCustomPublicUrl] = useState('');
  const [profileData, setProfileData] = useState(null);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [discoveredAccounts, setDiscoveredAccounts] = useState([]);

  // 1-Click Post Now state
  const [instantIllusion, setInstantIllusion] = useState('dancer');
  const [instantHook, setInstantHook] = useState("Reverse this spin in your mind 🧠");
  const [instantSub, setInstantSub] = useState("Are you seeing clockwise or counter-clockwise? Comment below! 👇");
  const [instantDuration, setInstantDuration] = useState(10);
  const [isPostingNow, setIsPostingNow] = useState(false);
  const [postProgressStep, setPostProgressStep] = useState(0);
  const [postProgressMessage, setPostProgressMessage] = useState('');
  const [postResult, setPostResult] = useState(null);

  // Scheduler settings
  const [schedulerEnabled, setSchedulerEnabled] = useState(false);
  const [frequencyType, setFrequencyType] = useState('hours');
  const [intervalHours, setIntervalHours] = useState(4);
  const [dailyTime, setDailyTime] = useState('09:00');
  const [cronExpression, setCronExpression] = useState('0 */4 * * *');
  const [activeIllusions, setActiveIllusions] = useState(['dancer', 'helix', 'feet', 'cafe']);
  const [hashtags, setHashtags] = useState('#opticalillusion #mindtrick #brainteaser #reelsviral #neuroscience');

  // Logs
  const [logs, setLogs] = useState([]);

  // Rendered Videos Library (Instant Posting)
  const [renderedVideos, setRenderedVideos] = useState([]);
  const [videoSourceMode, setVideoSourceMode] = useState('latest'); // 'latest' | 'library' | 'custom' | 'render_fresh'
  const [selectedVideoFilename, setSelectedVideoFilename] = useState('');
  const [customVideoPath, setCustomVideoPath] = useState('');

  // Fetch status & session
  const fetchStatus = async () => {
    try {
      const res = await fetch(`${API_BASE}/status`);
      const data = await res.json();
      if (data.ok) {
        setSystemStatus(data);
        setConnectionMethod(data.config.connectionMode || 'direct');
        setAccessToken(data.config.accessToken || '');
        setIgUserId(data.config.igUserId || '');
        setCustomPublicUrl(data.config.customPublicUrl || '');
        setSchedulerEnabled(data.config.enabled || false);
        setFrequencyType(data.config.frequencyType || 'hours');
        setIntervalHours(data.config.intervalHours || 4);
        setDailyTime(data.config.dailyTime || '09:00');
        setCronExpression(data.config.cronExpression || '0 */4 * * *');
        setActiveIllusions(data.config.activeIllusions || ['dancer', 'helix', 'feet', 'cafe']);
        setHashtags(data.config.hashtags || '');
      }
    } catch (e) {
      console.warn("Backend API not reachable:", e);
    }
  };

  const fetchDirectSession = async () => {
    try {
      const res = await fetch(`${API_BASE}/direct/session`);
      const data = await res.json();
      setDirectSession(data);
      if (data.activeAccount) {
        setSelectedPostAccount(prev => prev || data.activeAccount);
      }
    } catch (e) {}
  };

  const fetchLogs = async () => {
    try {
      const res = await fetch(`${API_BASE}/logs`);
      const data = await res.json();
      if (data.ok) {
        setLogs(data.logs || []);
      }
    } catch (e) {}
  };

  const fetchRenderedVideos = async () => {
    try {
      const res = await fetch(`${API_BASE}/rendered-videos`);
      const data = await res.json();
      if (data.ok && data.videos) {
        setRenderedVideos(data.videos);
        if (data.videos.length > 0 && !selectedVideoFilename) {
          setSelectedVideoFilename(data.videos[0].filename);
        }
      }
    } catch (e) {
      console.warn("Failed to fetch rendered videos:", e);
    }
  };

  const handleDeleteVideo = async (filename) => {
    if (!confirm(`Delete ${filename}?`)) return;
    try {
      const res = await fetch(`${API_BASE}/rendered-videos/${encodeURIComponent(filename)}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.ok) {
        fetchRenderedVideos();
        setStatusMessage({ type: 'success', text: `Deleted ${filename}` });
      }
    } catch (e) {
      setStatusMessage({ type: 'error', text: `Failed to delete video: ${e.message}` });
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStatus();
      fetchDirectSession();
      fetchLogs();
      fetchRenderedVideos();
    }
  }, [isOpen]);

  // Switch Active Instagram Account
  const handleSwitchAccount = async (targetUsername) => {
    try {
      const res = await fetch(`${API_BASE}/direct/switch-account`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: targetUsername })
      });
      const data = await res.json();
      if (data.ok) {
        setStatusMessage({ type: 'success', text: `Switched active posting target to @${targetUsername}` });
        setSelectedPostAccount(targetUsername);
        await fetchDirectSession();
      } else {
        throw new Error(data.error);
      }
    } catch (e) {
      setStatusMessage({ type: 'error', text: e.message });
    }
  };

  // Remove an Account Profile
  const handleRemoveAccount = async (targetUsername) => {
    if (!window.confirm(`Are you sure you want to remove @${targetUsername}?`)) return;
    try {
      const res = await fetch(`${API_BASE}/direct/remove-account`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: targetUsername })
      });
      const data = await res.json();
      if (data.ok) {
        setStatusMessage({ type: 'success', text: `Removed @${targetUsername} profile.` });
        await fetchDirectSession();
      } else {
        throw new Error(data.error);
      }
    } catch (e) {
      setStatusMessage({ type: 'error', text: e.message });
    }
  };

  // Handle Direct Instagram Login
  const handleDirectLogin = async () => {
    setIsLoading(true);
    setStatusMessage(null);
    try {
      const res = await fetch(`${API_BASE}/direct/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: directUsername, password: directPassword })
      });

      const data = await res.json();
      if (data.ok) {
        setStatusMessage({ type: 'success', text: `Successfully connected @${directUsername}! Zero Facebook needed.` });
        setDirectUsername('');
        setDirectPassword('');
        setShowAddAccount(false);
        await fetchDirectSession();
        handleSaveSettings({ connectionMode: 'direct' });
      } else {
        throw new Error(data.error || 'Login failed');
      }
    } catch (e) {
      setStatusMessage({ type: 'error', text: e.message });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Interactive Browser Login
  const handleInteractiveLogin = async (targetUser = '') => {
    setStatusMessage(null);
    try {
      const res = await fetch(`${API_BASE}/direct/interactive-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: targetUser || directUsername })
      });
      const data = await res.json();
      setStatusMessage({
        type: 'success',
        text: "Dedicated browser window opened! Log in with your Instagram account. It saves automatically into its isolated profile."
      });
      // Poll session
      const timer = setInterval(async () => {
        const sRes = await fetch(`${API_BASE}/direct/session`);
        const sData = await sRes.json();
        if (sData.loggedIn) {
          clearInterval(timer);
          setDirectSession(sData);
          setShowAddAccount(false);
          setStatusMessage({ type: 'success', text: `Connected! Target profile is @${sData.activeAccount}` });
        }
      }, 3000);
      setTimeout(() => clearInterval(timer), 60000);
    } catch (e) {
      setStatusMessage({ type: 'error', text: e.message });
    }
  };

  // Direct Cookie / Session ID Import
  const handleImportCookie = async (overrideUser = '') => {
    if (!cookieInput.trim()) {
      setStatusMessage({ type: 'error', text: "Please paste your sessionid value or exported cookies first." });
      return;
    }
    const targetUser = overrideUser || cookieTargetUser || directSession.activeAccount || directUsername || '';
    try {
      setIsImportingCookie(true);
      setStatusMessage({ type: 'info', text: "Injecting cookies & verifying session on Instagram..." });
      const res = await fetch(`${API_BASE}/direct/import-cookies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cookieInput: cookieInput.trim(),
          username: targetUser
        })
      });
      const data = await res.json();
      if (data.ok) {
        setStatusMessage({ type: 'success', text: data.message || `Successfully authenticated @${data.username}!` });
        setCookieInput('');
        setShowAddAccount(false);
        await fetchDirectSession();
        handleSaveSettings({ connectionMode: 'direct' });
      } else {
        throw new Error(data.error || "Failed to authenticate session using cookies.");
      }
    } catch (e) {
      setStatusMessage({ type: 'error', text: e.message });
    } finally {
      setIsImportingCookie(false);
    }
  };

  // Direct Logout
  const handleDirectLogout = async () => {
    if (directSession.activeAccount) {
      await handleRemoveAccount(directSession.activeAccount);
    } else {
      await fetch(`${API_BASE}/direct/logout`, { method: 'POST' });
      setDirectSession({ loggedIn: false, accounts: [] });
      setStatusMessage({ type: 'success', text: "Disconnected Instagram session." });
    }
  };

  // Save Settings
  const handleSaveSettings = async (overrides = {}) => {
    try {
      const payload = {
        connectionMode: overrides.connectionMode ?? connectionMethod,
        accessToken: overrides.accessToken ?? accessToken,
        igUserId: overrides.igUserId ?? igUserId,
        customPublicUrl,
        enabled: overrides.enabled ?? schedulerEnabled,
        frequencyType,
        intervalHours: parseInt(intervalHours) || 4,
        dailyTime,
        cronExpression,
        activeIllusions,
        hashtags
      };

      const res = await fetch(`${API_BASE}/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.ok) {
        fetchStatus();
        return true;
      }
    } catch (e) {
      console.error("Failed to save settings:", e);
    }
    return false;
  };

  // Execute 1-Click Post Now
  const handlePostNow = async () => {
    if (connectionMethod === 'direct' && !directSession.loggedIn) {
      setStatusMessage({ type: 'error', text: "Please log in to your Instagram account in Tab 1 first." });
      return;
    }
    if (connectionMethod === 'meta_api' && (!accessToken || !igUserId)) {
      setStatusMessage({ type: 'error', text: "Please provide Meta Graph API credentials in Tab 1." });
      return;
    }

    const isUsingExisting = videoSourceMode !== 'render_fresh';
    setIsPostingNow(true);
    setPostProgressStep(isUsingExisting ? 2 : 1);
    setPostProgressMessage(
      isUsingExisting 
        ? "Using existing rendered video (Skipped 15s render step)..."
        : "Rendering 60 FPS illusion video headlessly via Puppeteer..."
    );
    setPostResult(null);
    setStatusMessage(null);

    try {
      const payload = {
        connectionMode: connectionMethod,
        targetAccount: selectedPostAccount || directSession.activeAccount,
        accessToken,
        igUserId,
        hookText: instantHook,
        subText: instantSub,
      };

      if (videoSourceMode === 'latest') {
        payload.useLatestVideo = true;
      } else if (videoSourceMode === 'library') {
        payload.videoFilename = selectedVideoFilename;
      } else if (videoSourceMode === 'custom') {
        if (!customVideoPath.trim()) {
          throw new Error("Please specify a custom video path.");
        }
        payload.videoPath = customVideoPath.trim();
      } else {
        payload.renderFresh = true;
        payload.illusionId = instantIllusion;
        payload.duration = instantDuration;
      }

      const res = await fetch(`${API_BASE}/post-now`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      setPostProgressStep(3);
      setPostProgressMessage(connectionMethod === 'direct' ? "Uploading Reel directly to Instagram Web..." : "Transcoding on Meta servers...");

      let data = {};
      try {
        data = await res.json();
      } catch (err) {
        throw new Error(`Server temporarily unreachable (${res.status}). The server was restarting. Please try again!`);
      }

      if (data.ok) {
        setPostProgressStep(4);
        setPostProgressMessage("Published successfully!");
        setPostResult(data.publishResult);
        fetchLogs();
        fetchRenderedVideos();
      } else {
        throw new Error(data.error || "Publishing failed");
      }
    } catch (e) {
      setStatusMessage({ type: 'error', text: e.message });
      setPostProgressStep(0);
      setPostProgressMessage("");
    } finally {
      setIsPostingNow(false);
    }
  };

  const isConnected = connectionMethod === 'direct' ? directSession.loggedIn : !!profileData;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-4xl bg-lab-900 border border-lab-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 border-b border-lab-800 bg-lab-850 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-pink-600 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-pink-500/20">
              <Instagram className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center flex-wrap gap-2">
                Instagram Reels Automation & Publishing
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                  isConnected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                }`}>
                  {isConnected ? 'LIVE CONNECTED' : 'SETUP REQUIRED'}
                </span>
                {systemStatus?.gpu?.available && (
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full font-mono bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 font-bold">
                    ⚡ GPU: {systemStatus.gpu.name} (NVENC 60FPS)
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400">
                {connectionMethod === 'direct' ? 'Direct Instagram Web (Zero Facebook Required)' : 'Official Meta Graph API v21.0'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-xl bg-lab-800 text-slate-400 hover:text-white text-xs font-semibold"
          >
            Close
          </button>
        </div>

        {/* Status Alerts */}
        {statusMessage && (
          <div className={`mx-6 mt-4 p-3.5 rounded-xl text-xs flex items-center gap-2.5 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
              : 'bg-red-500/10 text-red-300 border border-red-500/30'
          }`}>
            {statusMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" /> : <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="px-6 border-b border-lab-800 bg-lab-850/50 flex gap-2 overflow-x-auto">
          {[
            { id: 'connect', label: '1. Connect Instagram', icon: Key },
            { id: 'post-now', label: '2. 1-Click Post Reel', icon: Zap },
            { id: 'scheduler', label: '3. Automated Scheduler', icon: Clock },
            { id: 'logs', label: '4. Live Logs', icon: Calendar },
          ].map(t => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`py-3 px-3.5 text-xs font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
                  activeTab === t.id
                    ? 'border-neon-cyan text-neon-cyan'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" /> {t.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* TAB 1: CONNECT INSTAGRAM */}
          {activeTab === 'connect' && (
            <div className="space-y-5">
              {/* Connection Mode Switcher */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-2">
                  Choose How You Want to Connect
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Option 1: Direct Instagram */}
                  <button
                    type="button"
                    onClick={() => {
                      setConnectionMethod('direct');
                      handleSaveSettings({ connectionMode: 'direct' });
                    }}
                    className={`p-4 rounded-xl border text-left transition-all relative ${
                      connectionMethod === 'direct'
                        ? 'bg-gradient-to-br from-purple-900/30 via-pink-900/20 to-lab-850 border-neon-cyan shadow-lg shadow-cyan-500/10'
                        : 'bg-lab-850 border-lab-750 text-slate-400 hover:bg-lab-800'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <Instagram className="w-4 h-4 text-pink-400" />
                        <span className="font-bold text-xs text-white">Direct Instagram (No Facebook)</span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold">
                        RECOMMENDED
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300">
                      Zero Facebook account required. Uses your Instagram username & password or 1-click browser login.
                    </p>
                  </button>

                  {/* Option 2: Meta Graph API */}
                  <button
                    type="button"
                    onClick={() => {
                      setConnectionMethod('meta_api');
                      handleSaveSettings({ connectionMode: 'meta_api' });
                    }}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      connectionMethod === 'meta_api'
                        ? 'bg-cyan-500/15 border-neon-cyan text-white shadow-lg shadow-cyan-500/10'
                        : 'bg-lab-850 border-lab-750 text-slate-400 hover:bg-lab-800'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-neon-cyan" />
                        <span className="font-bold text-xs text-white">Meta Developer Graph API</span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-lab-800 text-slate-400">
                        Needs Facebook Page
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Requires a Facebook Page and a Meta Developer App token.
                    </p>
                  </button>
                </div>
              </div>

              {/* OPTION 1 CONTENT: DIRECT INSTAGRAM */}
              {connectionMethod === 'direct' && (
                <div className="space-y-4 pt-2">
                  {/* If there are connected accounts */}
                  {directSession.accounts && directSession.accounts.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Instagram className="w-4 h-4 text-pink-400" />
                          <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                            Connected Instagram Accounts ({directSession.accounts.length})
                          </h4>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowAddAccount(!showAddAccount)}
                          className="px-3 py-1.5 rounded-lg bg-pink-500/15 hover:bg-pink-500/25 border border-pink-500/30 text-pink-300 text-xs font-bold flex items-center gap-1.5 transition-all"
                        >
                          {showAddAccount ? 'Cancel' : '+ Add Another Account'}
                        </button>
                      </div>

                      {/* Account Cards */}
                      <div className="grid grid-cols-1 gap-2.5">
                        {directSession.accounts.map((acc) => {
                          const isActive = acc.username.toLowerCase() === (directSession.activeAccount || '').toLowerCase();
                          return (
                            <div
                              key={acc.username}
                              className={`p-3.5 rounded-xl border flex items-center justify-between transition-all ${
                                isActive
                                  ? 'bg-gradient-to-r from-lab-850 to-lab-800 border-emerald-500/50 shadow-lg shadow-emerald-500/5'
                                  : 'bg-lab-850/80 border-lab-750 hover:border-lab-700'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-pink-500 via-rose-500 to-amber-500 flex items-center justify-center text-white font-bold text-sm shadow-md">
                                  {acc.username.slice(0, 2).toUpperCase()}
                                </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="font-bold text-sm text-white">@{acc.username}</span>
                                      {isActive ? (
                                        acc.authenticated ? (
                                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono text-[10px] font-bold border border-emerald-500/30 flex items-center gap-1">
                                            <CheckCircle2 className="w-3 h-3" /> ACTIVE & READY
                                          </span>
                                        ) : (
                                          <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-mono text-[10px] font-bold border border-amber-500/30 flex items-center gap-1">
                                            <AlertCircle className="w-3 h-3" /> NEEDS BROWSER LOGIN
                                          </span>
                                        )
                                      ) : (
                                        <span className="px-2 py-0.5 rounded-full bg-lab-800 text-slate-400 font-mono text-[10px] border border-lab-700">
                                          {acc.authenticated ? 'STANDBY' : 'NOT LOGGED IN'}
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-[11px] text-slate-400 mt-0.5">
                                      Isolated profile: <code className="text-slate-300 font-mono">instagram_profiles/{acc.username}/</code>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  {!acc.authenticated && (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setDirectAuthMode('cookie');
                                          setCookieTargetUser(acc.username);
                                          setShowAddAccount(true);
                                        }}
                                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all"
                                      >
                                        <Key className="w-3.5 h-3.5" /> Import Cookie
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleInteractiveLogin(acc.username)}
                                        className="px-3 py-1.5 rounded-lg bg-lab-800 hover:bg-lab-750 border border-lab-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all"
                                      >
                                        <Monitor className="w-3.5 h-3.5 text-pink-400" /> Browser Window
                                      </button>
                                    </>
                                  )}
                                  {!isActive && (
                                    <button
                                      type="button"
                                      onClick={() => handleSwitchAccount(acc.username)}
                                      className="px-3 py-1.5 rounded-lg bg-neon-cyan/15 hover:bg-neon-cyan/25 border border-neon-cyan/30 text-neon-cyan text-xs font-semibold flex items-center gap-1.5 transition-all"
                                    >
                                      <Zap className="w-3 h-3" /> Set as Active
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveAccount(acc.username)}
                                    className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 hover:text-red-300 text-xs transition-all"
                                    title={`Disconnect @${acc.username}`}
                                  >
                                    <LogOut className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Multi-Account Isolation Badge */}
                      <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/20 flex items-start gap-2.5 text-slate-300 text-xs">
                        <ShieldCheck className="w-4 h-4 text-neon-cyan flex-shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-white">Zero Browser Conflict Architecture:</strong> Each Instagram account is sandboxed in its own dedicated browser profile. You can be logged in to Account 1 and Account 2 at the same time—they have separate cookies and never cross-post or log each other out!
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Connect New / First Account Form */}
                  {(!directSession.accounts || directSession.accounts.length === 0 || showAddAccount) && (
                    <div className="p-5 bg-lab-850 border border-lab-750 rounded-xl space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                            <Lock className="w-3.5 h-3.5 text-neon-cyan" /> 
                            {directSession.accounts && directSession.accounts.length > 0 
                              ? 'Authenticate / Connect Instagram Account' 
                              : 'Connect Your Instagram Account'}
                          </h4>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            All credentials and sessions stay strictly local on your machine.
                          </p>
                        </div>

                        {/* Mode Switcher */}
                        <div className="flex items-center bg-lab-800 p-1 rounded-lg border border-lab-700 self-start sm:self-auto">
                          <button
                            type="button"
                            onClick={() => setDirectAuthMode('cookie')}
                            className={`px-3 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
                              directAuthMode === 'cookie'
                                ? 'bg-emerald-600 text-white shadow-sm'
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            <Key className="w-3 h-3" /> Import Cookie (Fastest)
                          </button>
                          <button
                            type="button"
                            onClick={() => setDirectAuthMode('credentials')}
                            className={`px-3 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
                              directAuthMode === 'credentials'
                                ? 'bg-pink-600 text-white shadow-sm'
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            <Lock className="w-3 h-3" /> Password / Browser
                          </button>
                        </div>
                      </div>

                      {/* MODE 1: COOKIE / SESSION IMPORT (RECOMMENDED) */}
                      {directAuthMode === 'cookie' && (
                        <div className="space-y-3.5 pt-1">
                          <div className="p-3 rounded-xl bg-emerald-950/25 border border-emerald-500/25 text-xs text-emerald-200 flex items-start gap-2.5">
                            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                            <div>
                              <strong className="text-white">Bypasses 2FA, SMS verification, and checkpoints:</strong> Just copy your <code className="bg-emerald-900/60 px-1 py-0.5 rounded font-mono text-emerald-300">sessionid</code> cookie from your browser where you are already logged in to Instagram.
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                              <label className="text-xs text-slate-300 font-medium block mb-1">
                                Target Instagram Username
                              </label>
                              <input
                                type="text"
                                value={cookieTargetUser || directSession.activeAccount || 'zodi.acillus'}
                                onChange={(e) => setCookieTargetUser(e.target.value)}
                                placeholder="e.g. zodi.acillus"
                                className="w-full px-3.5 py-2.5 rounded-xl bg-lab-800 border border-lab-700 text-xs text-white focus:outline-none focus:border-neon-cyan font-mono"
                              />
                            </div>

                            <div className="sm:col-span-2">
                              <label className="text-xs text-slate-300 font-medium block mb-1 flex items-center justify-between">
                                <span>Paste <code className="text-emerald-400 font-mono">sessionid</code> or Full Cookies</span>
                                <button
                                  type="button"
                                  onClick={() => setShowCookieInstructions(!showCookieInstructions)}
                                  className="text-[11px] text-neon-cyan hover:underline flex items-center gap-1"
                                >
                                  {showCookieInstructions ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                  {showCookieInstructions ? 'Hide Instructions' : 'How to get sessionid (30 sec)'}
                                </button>
                              </label>
                              <textarea
                                value={cookieInput}
                                onChange={(e) => setCookieInput(e.target.value)}
                                rows={3}
                                placeholder="Paste your sessionid value (e.g. 69482938472%3AS7d8g...) OR full Cookie header OR Cookie-Editor JSON..."
                                className="w-full px-3.5 py-2 rounded-xl bg-lab-800 border border-lab-700 text-xs text-white font-mono focus:outline-none focus:border-emerald-400 placeholder:text-slate-500"
                              />
                            </div>
                          </div>

                          {/* Collapsible Step-by-Step Guide */}
                          {showCookieInstructions && (
                            <div className="p-3.5 rounded-xl bg-lab-800 border border-lab-750 text-[11px] text-slate-300 space-y-2">
                              <div className="font-bold text-white flex items-center gap-1.5">
                                <FileText className="w-3.5 h-3.5 text-neon-cyan" />
                                How to copy your sessionid from your browser (Chrome / Brave / Edge / Firefox):
                              </div>
                              <ol className="list-decimal list-inside space-y-1 text-slate-300">
                                <li>Open <a href="https://www.instagram.com" target="_blank" rel="noreferrer" className="text-neon-cyan underline">instagram.com</a> in your regular browser where you are logged in.</li>
                                <li>Press <kbd className="px-1.5 py-0.5 bg-lab-900 border border-lab-700 rounded text-slate-200 font-mono text-[10px]">F12</kbd> (or right-click anywhere and select <strong>Inspect</strong>).</li>
                                <li>Click the <strong>Application</strong> tab at the top (in Firefox: <strong>Storage</strong> tab).</li>
                                <li>In the left sidebar, expand <strong>Cookies</strong> &rarr; click <strong>https://www.instagram.com</strong>.</li>
                                <li>Look for the row named <strong className="text-emerald-300 font-mono">sessionid</strong> &rarr; double-click its <strong>Value</strong> &rarr; press <kbd className="px-1.5 py-0.5 bg-lab-900 border border-lab-700 rounded text-slate-200 font-mono text-[10px]">Ctrl+C</kbd> to copy.</li>
                                <li>Paste it into the box above and click <strong>Import & Authenticate Session</strong>!</li>
                              </ol>
                              <div className="text-[10px] text-slate-400 pt-1 border-t border-lab-700">
                                💡 <em>Pro-tip: If you use the <strong>Cookie-Editor</strong> browser extension, simply click the extension icon &rarr; click <strong>Export</strong> &rarr; and paste here!</em>
                              </div>
                            </div>
                          )}

                          <div className="flex items-center gap-3 pt-1">
                            <button
                              type="button"
                              onClick={() => handleImportCookie(cookieTargetUser || directSession.activeAccount || 'zodi.acillus')}
                              disabled={isImportingCookie || !cookieInput.trim()}
                              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 hover:brightness-110 disabled:opacity-50 transition-all"
                            >
                              {isImportingCookie ? (
                                <>
                                  <RefreshCw className="w-4 h-4 animate-spin" />
                                  Verifying with Instagram...
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="w-4 h-4" />
                                  Import & Authenticate Session
                                </>
                              )}
                            </button>
                            <span className="text-[11px] text-slate-400">
                              Instant 1-step verification. Zero SMS or 2FA codes needed.
                            </span>
                          </div>
                        </div>
                      )}

                      {/* MODE 2: USERNAME & PASSWORD / BROWSER WINDOW */}
                      {directAuthMode === 'credentials' && (
                        <div className="space-y-4 pt-1">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="text-xs text-slate-300 font-medium block mb-1">
                                Instagram Username or Phone
                              </label>
                              <input
                                type="text"
                                value={directUsername}
                                onChange={(e) => setDirectUsername(e.target.value)}
                                placeholder="e.g. zodi.acillus"
                                className="w-full px-3.5 py-2.5 rounded-xl bg-lab-800 border border-lab-700 text-xs text-white focus:outline-none focus:border-neon-cyan"
                              />
                            </div>

                            <div>
                              <label className="text-xs text-slate-300 font-medium block mb-1">
                                Instagram Password
                              </label>
                              <input
                                type="password"
                                value={directPassword}
                                onChange={(e) => setDirectPassword(e.target.value)}
                                placeholder="••••••••••••"
                                className="w-full px-3.5 py-2.5 rounded-xl bg-lab-800 border border-lab-700 text-xs text-white focus:outline-none focus:border-neon-cyan"
                              />
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-3 pt-2">
                            <button
                              type="button"
                              onClick={handleDirectLogin}
                              disabled={isLoading || !directUsername || !directPassword}
                              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-pink-500/20 hover:brightness-110 disabled:opacity-50"
                            >
                              <Instagram className="w-4 h-4" />
                              {isLoading ? 'Logging in...' : 'Log In with Password'}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleInteractiveLogin(directUsername || directSession.activeAccount)}
                              className="px-4 py-2.5 rounded-xl bg-lab-800 hover:bg-lab-750 border border-lab-700 text-xs font-semibold text-slate-200 flex items-center gap-1.5 shadow-sm"
                            >
                              <Monitor className="w-3.5 h-3.5 text-neon-cyan" />
                              Log In via Browser Window
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* OPTION 2 CONTENT: META GRAPH API */}
              {connectionMethod === 'meta_api' && (
                <div className="space-y-4 pt-2">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-1">
                      Meta Access Token (EAABw...)
                    </label>
                    <input
                      type="password"
                      value={accessToken}
                      onChange={(e) => setAccessToken(e.target.value)}
                      placeholder="Paste EAABw... from developers.facebook.com"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-lab-800 border border-lab-700 text-xs font-mono text-white focus:outline-none focus:border-neon-cyan"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-1">
                      Instagram Business Account ID
                    </label>
                    <input
                      type="text"
                      value={igUserId}
                      onChange={(e) => setIgUserId(e.target.value)}
                      placeholder="e.g. 17841405309211029"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-lab-800 border border-lab-700 text-xs font-mono text-white focus:outline-none focus:border-neon-cyan"
                    />
                  </div>

                  <button
                    onClick={() => handleSaveSettings({ connectionMode: 'meta_api' })}
                    className="px-5 py-2.5 rounded-xl bg-neon-cyan text-lab-950 font-bold text-xs"
                  >
                    Save Meta API Settings
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: 1-CLICK POST NOW */}
          {activeTab === 'post-now' && (
            <div className="space-y-5">
              <div className="p-4 bg-lab-850 border border-lab-750 rounded-xl flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-neon-amber" /> Publish Reel to Instagram Now
                  </h3>
                  <p className="text-xs text-slate-400">
                    Mode: <strong className="text-neon-cyan">{connectionMethod === 'direct' ? 'Direct Instagram (No Facebook)' : 'Meta Graph API'}</strong>
                  </p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold font-mono ${
                  isConnected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                }`}>
                  {isConnected ? 'READY TO POST' : 'LOGIN REQUIRED'}
                </span>
              </div>

              {/* Target Account Selector (Multi-Account) */}
              {connectionMethod === 'direct' && directSession.accounts && directSession.accounts.length > 0 && (
                <div className="p-3.5 bg-lab-850 border border-lab-750 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Instagram className="w-4 h-4 text-pink-400" />
                    <span className="text-xs font-semibold text-white">Post to Instagram Profile:</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={selectedPostAccount || directSession.activeAccount || directSession.accounts[0]?.username}
                      onChange={(e) => setSelectedPostAccount(e.target.value)}
                      className="px-3 py-1.5 rounded-lg bg-lab-800 border border-lab-700 text-xs font-bold text-neon-cyan focus:outline-none focus:border-neon-cyan"
                    >
                      {directSession.accounts.map((a) => (
                        <option key={a.username} value={a.username}>
                          @{a.username} {a.username.toLowerCase() === (directSession.activeAccount || '').toLowerCase() ? '(Active Target)' : ''}
                        </option>
                      ))}
                    </select>
                    <span className="text-[10px] text-slate-400 font-mono">
                      (Dedicated Sandbox)
                    </span>
                  </div>
                </div>
              )}

              {/* If account needs authentication */}
              {connectionMethod === 'direct' && !isConnected && (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 text-xs text-amber-300">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 text-amber-400" />
                    <div>
                      <div className="font-semibold">Instagram session for @{directSession.activeAccount || 'account'} is not authenticated yet.</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">Import your session cookie (bypasses 2FA) or log in via browser window once.</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('connect');
                        setDirectAuthMode('cookie');
                        setShowAddAccount(true);
                        setCookieTargetUser(directSession.activeAccount || '');
                      }}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-600/20 transition-all"
                    >
                      <Key className="w-3.5 h-3.5" /> Import Cookie (Fastest)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInteractiveLogin(directSession.activeAccount)}
                      className="px-3.5 py-2 rounded-xl bg-lab-800 hover:bg-lab-750 border border-lab-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all"
                    >
                      <Monitor className="w-3.5 h-3.5 text-pink-400" /> Browser Window
                    </button>
                  </div>
                </div>
              )}

              {/* Progress Stepper if posting */}
              {isPostingNow && (
                <div className="p-5 rounded-xl bg-lab-850 border border-cyan-500/40 space-y-4">
                  <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-neon-cyan" />
                      Publishing Pipeline...
                    </span>
                    <span className="font-mono text-neon-cyan">{postProgressMessage}</span>
                  </div>

                  <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-mono">
                    <div className={`p-2 rounded-lg border ${postProgressStep >= 1 ? 'bg-cyan-500/20 border-cyan-500 text-neon-cyan font-bold' : 'bg-lab-800 border-lab-750 text-slate-500'}`}>
                      {videoSourceMode !== 'render_fresh' ? '1. Select Video' : '1. Headless 60FPS'}
                    </div>
                    <div className={`p-2 rounded-lg border ${postProgressStep >= 2 ? 'bg-cyan-500/20 border-cyan-500 text-neon-cyan font-bold' : 'bg-lab-800 border-lab-750 text-slate-500'}`}>
                      2. Verify MP4
                    </div>
                    <div className={`p-2 rounded-lg border ${postProgressStep >= 3 ? 'bg-cyan-500/20 border-cyan-500 text-neon-cyan font-bold' : 'bg-lab-800 border-lab-750 text-slate-500'}`}>
                      3. Instagram Upload
                    </div>
                    <div className={`p-2 rounded-lg border ${postProgressStep >= 4 ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 font-bold' : 'bg-lab-800 border-lab-750 text-slate-500'}`}>
                      4. Live on Feed!
                    </div>
                  </div>
                </div>
              )}

              {/* Success Result */}
              {postResult && (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    <span>Reel published live to Instagram! {postResult.message || ''}</span>
                  </div>
                  {postResult.permalink && (
                    <a
                      href={postResult.permalink}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold flex items-center gap-1.5 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> View on Instagram
                    </a>
                  )}
                </div>
              )}

              {/* VIDEO SOURCE SELECTION */}
              <div className="p-4 bg-lab-850 border border-lab-750 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <Film className="w-3.5 h-3.5 text-neon-cyan" /> Video Source
                  </label>
                  <button
                    type="button"
                    onClick={fetchRenderedVideos}
                    className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
                    title="Refresh video list"
                  >
                    <RefreshCw className="w-3 h-3" /> Refresh Library ({renderedVideos.length})
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setVideoSourceMode('latest')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      videoSourceMode === 'latest'
                        ? 'bg-emerald-500/20 border-emerald-500 text-white shadow-md shadow-emerald-500/10'
                        : 'bg-lab-800 border-lab-700 text-slate-400 hover:border-lab-600'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                        <Zap className="w-3.5 h-3.5" /> Latest Video
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono font-bold">
                        FASTEST
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 line-clamp-1">
                      {renderedVideos[0] ? renderedVideos[0].filename : 'No rendered video yet'}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {renderedVideos[0] ? `${renderedVideos[0].sizeMB} MB • Skip 15s render` : 'Render one first'}
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setVideoSourceMode('library')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      videoSourceMode === 'library'
                        ? 'bg-cyan-500/20 border-neon-cyan text-white shadow-md shadow-cyan-500/10'
                        : 'bg-lab-800 border-lab-700 text-slate-400 hover:border-lab-600'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-neon-cyan flex items-center gap-1">
                        <Folder className="w-3.5 h-3.5" /> Pick from Library
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-lab-700 text-slate-300 font-mono">
                        {renderedVideos.length} videos
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300">
                      Choose existing file
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Instant upload without re-rendering
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setVideoSourceMode('render_fresh')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      videoSourceMode === 'render_fresh'
                        ? 'bg-purple-500/20 border-purple-500 text-white shadow-md shadow-purple-500/10'
                        : 'bg-lab-800 border-lab-700 text-slate-400 hover:border-lab-600'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-purple-400 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5" /> Render Fresh
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 font-mono">
                        NVENC GPU
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300">
                      Record 10s animation
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Creates new MP4 from canvas
                    </p>
                  </button>
                </div>

                {/* Sub-UI based on mode */}
                {videoSourceMode === 'latest' && renderedVideos[0] && (
                  <div className="p-2.5 rounded-lg bg-lab-800/80 border border-lab-700 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <div>
                        <div className="font-mono text-emerald-300 font-medium">{renderedVideos[0].filename}</div>
                        <div className="text-[10px] text-slate-400">
                          Size: {renderedVideos[0].sizeMB} MB • Type: {renderedVideos[0].illusionType} • Created: {new Date(renderedVideos[0].createdAt).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                    <a
                      href={renderedVideos[0].url}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1 rounded bg-lab-700 hover:bg-lab-650 text-slate-200 text-[11px] flex items-center gap-1 shrink-0"
                    >
                      <Play className="w-3 h-3" /> Preview
                    </a>
                  </div>
                )}

                {videoSourceMode === 'library' && (
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center gap-2">
                      <select
                        value={selectedVideoFilename}
                        onChange={(e) => setSelectedVideoFilename(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-lab-800 border border-lab-700 text-xs text-white font-mono focus:outline-none focus:border-neon-cyan"
                      >
                        {renderedVideos.length === 0 ? (
                          <option value="">No rendered videos found in library</option>
                        ) : (
                          renderedVideos.map(v => (
                            <option key={v.filename} value={v.filename}>
                              {v.filename} ({v.sizeMB} MB - {new Date(v.createdAt).toLocaleDateString()} {new Date(v.createdAt).toLocaleTimeString()})
                            </option>
                          ))
                        )}
                      </select>
                      {selectedVideoFilename && (
                        <a
                          href={`/videos/${selectedVideoFilename}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-2 rounded-xl bg-lab-800 hover:bg-lab-750 border border-lab-700 text-slate-200 text-xs flex items-center gap-1 shrink-0 font-medium"
                        >
                          <Play className="w-3.5 h-3.5" /> Preview
                        </a>
                      )}
                      {selectedVideoFilename && (
                        <button
                          type="button"
                          onClick={() => handleDeleteVideo(selectedVideoFilename)}
                          className="p-2 rounded-xl bg-lab-800 hover:bg-red-500/20 border border-lab-700 text-slate-400 hover:text-red-400 transition-colors"
                          title="Delete video"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Point to custom path toggle / input */}
                <div className="pt-1">
                  {videoSourceMode === 'custom' ? (
                    <div className="space-y-1">
                      <label className="text-[11px] text-slate-300 font-medium">Custom MP4 File Path</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={customVideoPath}
                          onChange={(e) => setCustomVideoPath(e.target.value)}
                          placeholder="/home/kaliuser/illusion-studio/rendered_reels/my_video.mp4"
                          className="w-full px-3 py-1.5 rounded-lg bg-lab-800 border border-lab-700 text-xs text-white font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => setVideoSourceMode('latest')}
                          className="px-2 py-1 text-[11px] text-slate-400 hover:text-slate-200"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setVideoSourceMode('custom')}
                      className="text-[11px] text-slate-500 hover:text-slate-300 underline"
                    >
                      Or enter a custom file path on disk...
                    </button>
                  )}
                </div>
              </div>

              {/* Select Illusion (Only shown if Render Fresh is chosen) */}
              {videoSourceMode === 'render_fresh' && (
                <div className="p-4 bg-lab-850 border border-purple-500/30 rounded-xl space-y-3">
                  <label className="text-xs font-bold uppercase tracking-wider text-purple-300 block">
                    Select Illusion to Render Fresh (NVIDIA RTX 2050 NVENC)
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 max-h-52 overflow-y-auto pr-1">
                    {ILLUSIONS_REGISTRY.map(ill => (
                      <button
                        key={ill.id}
                        type="button"
                        onClick={() => {
                          setInstantIllusion(ill.id);
                          setInstantHook(ill.defaultOverlay);
                          setInstantSub(ill.defaultSubtext);
                        }}
                        className={`p-2.5 rounded-xl border text-xs font-medium text-left flex items-center justify-between transition-all ${
                          instantIllusion === ill.id
                            ? 'bg-purple-500/20 border-purple-400 text-white font-bold shadow-md'
                            : 'bg-lab-800 border-lab-700 text-slate-400 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          <span>{ill.icon}</span>
                          <span className="truncate">{ill.name}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Captions */}
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-1">
                    Top Hook Text
                  </label>
                  <input
                    type="text"
                    value={instantHook}
                    onChange={(e) => setInstantHook(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-lab-800 border border-lab-700 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-1">
                    Caption Subtitle & Comment Call-to-Action
                  </label>
                  <input
                    type="text"
                    value={instantSub}
                    onChange={(e) => setInstantSub(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-lab-800 border border-lab-700 text-xs text-white"
                  />
                </div>
              </div>

              <button
                onClick={isConnected ? handlePostNow : () => handleInteractiveLogin(directSession.activeAccount)}
                disabled={isPostingNow}
                className={`w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-xl transition-all ${
                  isConnected
                    ? 'bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 text-white shadow-pink-500/20 hover:brightness-110'
                    : 'bg-pink-600 hover:bg-pink-500 text-white shadow-pink-600/30'
                }`}
              >
                {isPostingNow ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>
                      {videoSourceMode !== 'render_fresh'
                        ? 'Uploading Reel to Instagram...'
                        : 'Processing on GPU & Uploading Reel...'}
                    </span>
                  </>
                ) : !isConnected ? (
                  <>
                    <Monitor className="w-4 h-4" />
                    <span>Log In via Browser Window to Activate @{directSession.activeAccount || 'account'}</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>
                      {videoSourceMode === 'latest'
                        ? '⚡ Publish Latest Reel Instantly (Skip Render)'
                        : videoSourceMode === 'library'
                        ? '⚡ Publish Selected Reel Instantly'
                        : videoSourceMode === 'custom'
                        ? '⚡ Publish Custom Video Instantly'
                        : '🎨 Render & Publish Reel (GPU NVENC)'}
                    </span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* TAB 3: AUTOMATED SCHEDULER */}
          {activeTab === 'scheduler' && (
            <div className="space-y-5">
              {/* Enable Toggle Card */}
              <div className="p-4 bg-lab-850 border border-lab-750 rounded-xl flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Clock className="w-4 h-4 text-neon-cyan" /> Automated Background Publishing
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Runs headlessly on cron schedule even if this browser tab is closed.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const next = !schedulerEnabled;
                    setSchedulerEnabled(next);
                    handleSaveSettings({ enabled: next });
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold font-mono transition-all ${
                    schedulerEnabled
                      ? 'bg-emerald-500 text-lab-950 shadow-lg shadow-emerald-500/30'
                      : 'bg-lab-800 text-slate-400 border border-lab-700'
                  }`}
                >
                  {schedulerEnabled ? 'SCHEDULER ACTIVE' : 'SCHEDULER PAUSED'}
                </button>
              </div>

              {/* Frequency Picker */}
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block">
                  Posting Interval & Schedule Mode
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    { id: 'hours', label: 'Every N Hours', desc: 'Hourly / Recurring interval' },
                    { id: 'daily', label: 'Daily at Fixed Time', desc: 'Specific hour/minute daily' },
                    { id: 'cron', label: 'Custom Cron', desc: 'Advanced 5-part cron' },
                  ].map(mode => (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => setFrequencyType(mode.id)}
                      className={`p-3 rounded-xl border text-left ${
                        frequencyType === mode.id
                          ? 'bg-cyan-500/20 border-neon-cyan text-white font-bold'
                          : 'bg-lab-800 border-lab-700 text-slate-400'
                      }`}
                    >
                      <div className="text-xs text-white">{mode.label}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{mode.desc}</div>
                    </button>
                  ))}
                </div>

                {/* Mode-Specific Inputs */}
                {frequencyType === 'hours' && (
                  <div className="p-3 bg-lab-850 rounded-xl border border-lab-750">
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-slate-300 font-medium">Post every:</span>
                      <span className="text-neon-cyan font-mono font-bold">{intervalHours} hour(s)</span>
                    </div>
                    <div className="flex gap-2">
                      {[1, 2, 4, 6, 8, 12, 24].map(h => (
                        <button
                          key={h}
                          type="button"
                          onClick={() => setIntervalHours(h)}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-mono ${
                            intervalHours === h ? 'bg-neon-cyan text-lab-950 font-bold' : 'bg-lab-800 text-slate-400'
                          }`}
                        >
                          {h}h
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {frequencyType === 'daily' && (
                  <div className="p-3 bg-lab-850 rounded-xl border border-lab-750 flex items-center justify-between">
                    <span className="text-xs text-slate-300 font-medium">Dispatch Daily At (Local Time):</span>
                    <input
                      type="time"
                      value={dailyTime}
                      onChange={(e) => setDailyTime(e.target.value)}
                      className="px-3 py-1.5 rounded-lg bg-lab-800 border border-lab-700 text-xs font-mono text-neon-cyan"
                    />
                  </div>
                )}

                {frequencyType === 'cron' && (
                  <div className="p-3 bg-lab-850 rounded-xl border border-lab-750">
                    <label className="text-xs text-slate-300 block mb-1">Standard Cron Expression (5 fields):</label>
                    <input
                      type="text"
                      value={cronExpression}
                      onChange={(e) => setCronExpression(e.target.value)}
                      placeholder="0 */4 * * *"
                      className="w-full px-3 py-1.5 rounded-lg bg-lab-800 border border-lab-700 text-xs font-mono text-neon-cyan"
                    />
                  </div>
                )}
              </div>

              {/* Illusions Rotation Pool */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Content Rotation Pool ({activeIllusions.length} of {ILLUSIONS_REGISTRY.length} selected)
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveIllusions(ILLUSIONS_REGISTRY.map(i => i.id))}
                      className="text-[11px] text-neon-cyan hover:underline font-medium"
                    >
                      Select All
                    </button>
                    <span className="text-slate-600">•</span>
                    <button
                      type="button"
                      onClick={() => setActiveIllusions([])}
                      className="text-[11px] text-slate-400 hover:underline"
                    >
                      Clear
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-56 overflow-y-auto pr-1">
                  {ILLUSIONS_REGISTRY.map(item => {
                    const isSelected = activeIllusions.includes(item.id);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setActiveIllusions(activeIllusions.filter(x => x !== item.id));
                          } else {
                            setActiveIllusions([...activeIllusions, item.id]);
                          }
                        }}
                        className={`p-2.5 rounded-xl border text-xs flex items-center justify-between transition-all ${
                          isSelected
                            ? 'bg-cyan-500/20 border-cyan-500 text-white font-bold'
                            : 'bg-lab-800 border-lab-700 text-slate-400 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          <span>{item.icon}</span>
                          <span className="truncate">{item.name}</span>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 text-neon-cyan shrink-0 ml-1" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Hashtag Bundle */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-1">
                  Reel Hashtags & Tags
                </label>
                <input
                  type="text"
                  value={hashtags}
                  onChange={(e) => setHashtags(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-lab-800 border border-lab-700 text-xs text-slate-300 font-mono"
                />
              </div>

              <button
                onClick={() => handleSaveSettings()}
                className="w-full py-3 rounded-xl bg-neon-cyan text-lab-950 font-bold text-xs hover:brightness-110 transition-all"
              >
                Save & Apply Scheduler Configuration
              </button>
            </div>
          )}

          {/* TAB 4: AUDIT LOGS */}
          {activeTab === 'logs' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Publishing Audit Trail ({logs.length} entries)
                </h3>
                <button
                  onClick={fetchLogs}
                  className="px-2.5 py-1 rounded-lg bg-lab-800 text-slate-400 hover:text-white text-xs flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" /> Refresh Logs
                </button>
              </div>

              {logs.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500 bg-lab-850 rounded-xl border border-lab-750">
                  No automated posts recorded yet. Connect your Instagram in Tab 1 to start!
                </div>
              ) : (
                <div className="space-y-2">
                  {logs.map(log => (
                    <div
                      key={log.id}
                      className="p-3.5 rounded-xl bg-lab-850 border border-lab-750 flex flex-wrap items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold ${
                          log.status === 'SUCCESS' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                        }`}>
                          {log.status}
                        </span>
                        <div>
                          <div className="font-bold text-white flex items-center gap-2">
                            <span>{log.hookText || log.illusionId}</span>
                            {log.videoFile && (
                              <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${log.usedExisting ? 'bg-cyan-500/20 text-neon-cyan' : 'bg-purple-500/20 text-purple-300'}`}>
                                {log.usedExisting ? '⚡ Existing MP4' : '🎨 Rendered Fresh'}
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono flex flex-wrap items-center gap-2 mt-0.5">
                            <span>{new Date(log.timestamp).toLocaleString()}</span>
                            <span>•</span>
                            <span>Method: {log.method || 'Direct'}</span>
                            {log.videoFile && (
                              <>
                                <span>•</span>
                                <span className="text-slate-300">{log.videoFile}</span>
                              </>
                            )}
                            {log.durationSec && (
                              <>
                                <span>•</span>
                                <span>{log.durationSec}s</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
