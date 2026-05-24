// Dashboard.js
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import './Dashboard.css';
import DateRangeRoundedIcon           from '@mui/icons-material/DateRangeRounded';
import PeopleAltOutlinedIcon          from '@mui/icons-material/PeopleAltOutlined';
import TrendingUpOutlinedIcon         from '@mui/icons-material/TrendingUpOutlined';
import EventNoteOutlinedIcon          from '@mui/icons-material/EventNoteOutlined';
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import RadioButtonUncheckedOutlinedIcon from '@mui/icons-material/RadioButtonUncheckedOutlined';
import AccessTimeOutlinedIcon         from '@mui/icons-material/AccessTimeOutlined';
import PieChartOutlineOutlinedIcon    from '@mui/icons-material/PieChartOutlineOutlined';
import BarChartOutlinedIcon           from '@mui/icons-material/BarChartOutlined';
import SyncIcon                       from '@mui/icons-material/Sync';
import ShieldOutlinedIcon             from '@mui/icons-material/ShieldOutlined';
import NavigateBeforeIcon             from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon               from '@mui/icons-material/NavigateNext';
import RefreshIcon                    from '@mui/icons-material/Refresh';
import HistoryIcon                    from '@mui/icons-material/History';
import SyncGuardModal                 from './SyncGuardModal';
import WeatherWidget                  from '../weather/WeatherWidget';

import {
  Chart as ChartJS, ArcElement, CategoryScale, LinearScale,
  BarElement, Title, Tooltip, Legend, PointElement, LineElement,
} from 'chart.js';
import { Pie, Bar, Line } from 'react-chartjs-2';

ChartJS.register(
  ArcElement, CategoryScale, LinearScale, BarElement,
  Title, Tooltip, Legend, PointElement, LineElement
);

const API = process.env.REACT_APP_API_URL || 'https://logpoint-backend.onrender.com';

// ── Get logged-in admin ID for user-scoped localStorage ───────────────────────
const getCurrentUserId = () => {
  try {
    const u = localStorage.getItem('user');
    if (!u) return 'guest';
    return JSON.parse(u)?.id ?? 'guest';
  } catch { return 'guest'; }
};

const makeKeys = (uid) => ({
  GUARD_ID:   `lp_sync_guard_id_${uid}`,
  GUARD_INFO: `lp_sync_guard_info_${uid}`,
  LOGS:       `lp_sync_logs_${uid}`,
  STATUS:     `lp_sync_status_${uid}`,
  HISTORY:    `lp_sync_history_${uid}`,
});

const lsGet = (key, fallback = null) => {
  try { const v = localStorage.getItem(key); return v !== null ? JSON.parse(v) : fallback; }
  catch { return fallback; }
};
const lsSet = (key, val) => {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch { /**/ }
};

const LOGS_PER_PAGE  = 8;
const LIVE_POLL_MS   = 30000; // 30 s auto-refresh for synced logs
const OWN_POLL_MS    = 60000; // 60 s for own logs (saves tokens)

const Dashboard = () => {
  const uid  = getCurrentUserId();

  // ── FIX: memoize KEYS so it doesn't recreate on every render (prevents infinite loop) ──
  const KEYS = useMemo(() => makeKeys(uid), [uid]);

  const [stats, setStats] = useState({
    daily: 0, total: 0, activeNow: 0, completedToday: 0,
    weeklyData: [], purposeDistribution: {}, hourlyTraffic: [],
  });
  const [loading,       setLoading]       = useState(true);
  const [banner,        setBanner]        = useState({ show: false, message: '', type: 'success' });
  const [currentDate,   setCurrentDate]   = useState('');
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [ownLogs,       setOwnLogs]       = useState([]);
  const [refreshing,    setRefreshing]    = useState(false);
  const [lastRefresh,   setLastRefresh]   = useState(null);
  const [showHistory,   setShowHistory]   = useState(false);

  // Synced guard state (user-scoped localStorage)
  const [syncedLogs,      setSyncedLogs]      = useState(() => lsGet(KEYS.LOGS, []));
  const [syncedGuardInfo, setSyncedGuardInfo] = useState(() => lsGet(KEYS.GUARD_INFO));
  // eslint-disable-next-line no-unused-vars
  const [syncedGuardId,   setSyncedGuardId]   = useState(() => lsGet(KEYS.GUARD_ID));
  const [syncedStatus,    setSyncedStatus]    = useState(() => lsGet(KEYS.STATUS));
  const [syncHistory,     setSyncHistory]     = useState(() => lsGet(KEYS.HISTORY, []));

  // ── NEW: track recently added log IDs for highlight ───────────────────────
  const [newLogIds, setNewLogIds] = useState(new Set());

  // Pagination
  const [syncedPage, setSyncedPage] = useState(1);

  const hasSyncedLogs  = syncedLogs.length > 0;
  const isLiveSynced   = syncedStatus === 'SYNCED';

  // ── FIX: sort newest-first before paginating ──────────────────────────────
  const sortedSyncedLogs = useMemo(
    () => [...syncedLogs].sort((a, b) => new Date(b.timeIn) - new Date(a.timeIn)),
    [syncedLogs]
  );

  const totalSyncPages  = Math.ceil(sortedSyncedLogs.length / LOGS_PER_PAGE);
  const pagedSyncedLogs = sortedSyncedLogs.slice(
    (syncedPage - 1) * LOGS_PER_PAGE,
    syncedPage       * LOGS_PER_PAGE
  );

  const ownLogsRef    = useRef(ownLogs);
  const syncedLogsRef = useRef(syncedLogs);
  useEffect(() => { ownLogsRef.current    = ownLogs;    }, [ownLogs]);
  useEffect(() => { syncedLogsRef.current = syncedLogs; }, [syncedLogs]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const getPhilippineDate = () => {
    const now = new Date();
    return new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Manila' }))
      .toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  const showBanner = useCallback((message, type = 'success') => {
    setBanner({ show: true, message, type });
    setTimeout(() => {
      const el = document.querySelector('.banner-notification');
      if (el) {
        el.classList.add('fade-out');
        setTimeout(() => setBanner({ show: false, message: '', type: 'success' }), 300);
      } else {
        setBanner({ show: false, message: '', type: 'success' });
      }
    }, 3000);
  }, []);

  const hideBanner = () => {
    const el = document.querySelector('.banner-notification');
    if (el) {
      el.classList.add('fade-out');
      setTimeout(() => setBanner({ show: false, message: '', type: 'success' }), 300);
    } else {
      setBanner({ show: false, message: '', type: 'success' });
    }
  };

  const getMergedLogs = (own, synced) => {
    const tagged = (synced || []).map(l => ({ ...l, syncedFrom: 'Guard' }));
    return [...(own || []), ...tagged].sort((a, b) => new Date(b.timeIn) - new Date(a.timeIn));
  };

  const fmtTime = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('en-PH', {
      month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  // ── Stats calculation ─────────────────────────────────────────────────────
  const calculateStats = useCallback((logs) => {
    const tz    = { timeZone: 'Asia/Manila' };
    const today = new Date().toLocaleDateString('en-US', tz);

    const todayLogs      = logs.filter(l => new Date(l.timeIn).toLocaleDateString('en-US', tz) === today);
    const activeLogs     = logs.filter(l => l.status === 'ACTIVE');
    const completedToday = todayLogs.filter(l => l.status === 'COMPLETED');

    const weeklyData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const ds = d.toLocaleDateString('en-US', tz);
      weeklyData.push({
        date: d.toLocaleDateString('en-US', { weekday: 'short' }),
        count: logs.filter(l => new Date(l.timeIn).toLocaleDateString('en-US', tz) === ds).length,
      });
    }

    const purposeCount = {};
    logs.forEach(l => {
      const p = l.purposeName || 'Other';
      purposeCount[p] = (purposeCount[p] || 0) + 1;
    });

    const hourlyTraffic = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      count: logs.filter(l => new Date(l.timeIn).getHours() === i).length,
    }));

    setStats({
      daily: todayLogs.length, total: logs.length,
      activeNow: activeLogs.length, completedToday: completedToday.length,
      weeklyData, purposeDistribution: purposeCount, hourlyTraffic,
    });
  }, []);

  // ── Fetch own logs ────────────────────────────────────────────────────────
  const fetchOwnLogs = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch(`${API}/api/visit-logs`, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        const logs = await res.json();
        setOwnLogs(logs);
        calculateStats(getMergedLogs(logs, syncedLogsRef.current));
      } else if (!silent) {
        showBanner('Failed to fetch dashboard data', 'error');
      }
    } catch {
      if (!silent) showBanner('Server error. Please try again.', 'error');
    } finally {
      if (!silent) setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calculateStats, showBanner]);

  // ── Refresh synced logs from backend ─────────────────────────────────────
  const refreshSyncedLogs = useCallback(async (silent = false) => {
    const guardId = lsGet(KEYS.GUARD_ID);
    const status  = lsGet(KEYS.STATUS);
    if (!guardId || status !== 'SYNCED') return;

    if (!silent) setRefreshing(true);
    try {
      const res = await fetch(`${API}/api/sync/live/${guardId}`, { credentials: 'include' });
      if (res.ok) {
        const freshLogs = await res.json();

        // ── Detect newly added records ──────────────────────────────────────
        const prevIds = new Set(syncedLogsRef.current.map(l => l.id));
        const added   = new Set(freshLogs.filter(l => !prevIds.has(l.id)).map(l => l.id));
        if (added.size > 0) {
          setSyncedPage(1);           // jump to page 1 so new rows are visible immediately
          setNewLogIds(added);
          setTimeout(() => setNewLogIds(new Set()), 9000); // fade highlight after 9 s
        }
        // ───────────────────────────────────────────────────────────────────

        setSyncedLogs(freshLogs);
        lsSet(KEYS.LOGS, freshLogs);
        calculateStats(getMergedLogs(ownLogsRef.current, freshLogs));
        if (!silent) {
          setLastRefresh(new Date());
          showBanner(`Refreshed — ${freshLogs.length} log(s) from guard`, 'success');
        }
      } else if (res.status === 404 || res.status === 403) {
        if (!silent) showBanner('Guard sync is no longer active.', 'warning');
      }
    } catch { /**/ } finally {
      if (!silent) setRefreshing(false);
      if (!silent) setLastRefresh(new Date());
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [KEYS, calculateStats, showBanner]);

  useEffect(() => {
    setCurrentDate(getPhilippineDate());
    fetchOwnLogs(false);
    setSyncHistory(lsGet(KEYS.HISTORY, []));

    // Own logs poll every 60 s (silent)
    const ownId = setInterval(() => fetchOwnLogs(true), OWN_POLL_MS);

    // Live synced logs auto-refresh every 30 s (silent)
    const liveId = setInterval(() => refreshSyncedLogs(true), LIVE_POLL_MS);

    return () => { clearInterval(ownId); clearInterval(liveId); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchOwnLogs, refreshSyncedLogs]);

  useEffect(() => {
    if (!loading) calculateStats(getMergedLogs(ownLogsRef.current, syncedLogs));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syncedLogs]);

  useEffect(() => { setSyncedPage(1); }, [syncedLogs]);

  // ── Sync callback from modal ──────────────────────────────────────────────
  const handleSyncComplete = useCallback((logs, guard, guardId, isCancelled, shouldDelete = false) => {
    if (!guardId) return;

    if (shouldDelete || (logs === null && !isCancelled)) {
      setSyncedLogs([]);
      setSyncedGuardInfo(null);
      setSyncedGuardId(null);
      setSyncedStatus(null);
      setNewLogIds(new Set());
      if (!isCancelled) showBanner('Sync data cleared.', 'info');
      return;
    }

    if (isCancelled) {
      showBanner('Sync cancelled — data snapshot retained.', 'info');
      setSyncedStatus('CANCELLED');
      setSyncHistory(lsGet(KEYS.HISTORY, []));
      return;
    }

    if (logs === null) {
      setSyncedLogs([]);
      setSyncedGuardInfo(null);
      setSyncedGuardId(null);
      setSyncedStatus(null);
      setNewLogIds(new Set());
      return;
    }

    // ── Detect newly added records when live poll fires via modal ───────────
    const prevIds = new Set(syncedLogsRef.current.map(l => l.id));
    const added   = new Set(logs.filter(l => !prevIds.has(l.id)).map(l => l.id));
    if (added.size > 0) {
      setSyncedPage(1);
      setNewLogIds(added);
      setTimeout(() => setNewLogIds(new Set()), 9000);
    }
    // ────────────────────────────────────────────────────────────────────────

    setSyncedLogs(logs);
    if (guard) setSyncedGuardInfo(guard);
    setSyncedGuardId(guardId);
    setSyncedStatus('SYNCED');
    setLastRefresh(new Date());

    const name = guard
      ? `${guard.firstName} ${guard.lastName}`
      : syncedGuardInfo
        ? `${syncedGuardInfo.firstName} ${syncedGuardInfo.lastName}`
        : 'Guard';
    showBanner(`Synced ${logs.length} log(s) from ${name}`, 'success');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showBanner, KEYS]);

  // ── Chart data ────────────────────────────────────────────────────────────
  const baseChartOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(10,10,20,0.88)', padding: 12,
        titleColor: '#fff', bodyColor: '#ccc',
        borderColor: 'rgba(0,74,173,0.3)', borderWidth: 1, cornerRadius: 8,
      },
    },
    scales: {
      y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { stepSize: 1, font: { size: 11 }, color: '#999' } },
      x: { grid: { display: false }, ticks: { font: { size: 11 }, color: '#999' } },
    },
  };

  const weeklyChartData = {
    labels: stats.weeklyData.map(d => d.date),
    datasets: [{
      label: 'Visitors', data: stats.weeklyData.map(d => d.count),
      backgroundColor: 'rgba(0,74,173,0.82)', borderRadius: 7, borderSkipped: false,
    }],
  };

  const purposeChartData = {
    labels: Object.keys(stats.purposeDistribution),
    datasets: [{
      data: Object.values(stats.purposeDistribution),
      backgroundColor: ['rgba(0,74,173,0.85)','rgba(29,158,117,0.85)','rgba(186,117,23,0.85)','rgba(33,150,243,0.85)','rgba(156,39,176,0.85)','rgba(216,90,48,0.85)'],
      borderWidth: 0,
    }],
  };

  const pieChartOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { boxWidth: 10, padding: 14, font: { size: 11 } } },
      tooltip: { backgroundColor: 'rgba(10,10,20,0.88)', padding: 12, cornerRadius: 8 },
    },
  };

  const buildHourlyChart = () => {
    if (!hasSyncedLogs) {
      return {
        data: {
          labels: stats.hourlyTraffic.map(h => `${h.hour}:00`),
          datasets: [{
            label: 'Visitors', data: stats.hourlyTraffic.map(h => h.count),
            borderColor: 'rgba(0,74,173,1)', backgroundColor: 'rgba(0,74,173,0.08)',
            tension: 0.4, fill: true,
            pointBackgroundColor: 'rgba(0,74,173,1)', pointBorderColor: '#fff',
            pointBorderWidth: 2, pointRadius: 3, pointHoverRadius: 5,
          }],
        },
        options: baseChartOptions,
      };
    }

    const adminHourly = Array(24).fill(0);
    stats.hourlyTraffic.forEach(h => { adminHourly[h.hour] = h.count; });
    const guardHourly = Array(24).fill(0);
    syncedLogs.forEach(l => { if (l.timeIn) { guardHourly[new Date(l.timeIn).getHours()]++; } });
    const gName = syncedGuardInfo ? `${syncedGuardInfo.firstName} ${syncedGuardInfo.lastName}` : 'Guard';

    return {
      data: {
        labels: Array.from({ length: 24 }, (_, i) => `${i}:00`),
        datasets: [
          { label: 'My Logs', data: adminHourly, borderColor: 'rgba(0,74,173,1)', backgroundColor: 'rgba(0,74,173,0.08)', tension: 0.4, fill: true, pointBackgroundColor: 'rgba(0,74,173,1)', pointBorderColor: '#fff', pointBorderWidth: 2, pointRadius: 3, pointHoverRadius: 5 },
          { label: `${gName}'s Logs`, data: guardHourly, borderColor: 'rgba(126,217,87,1)', backgroundColor: 'rgba(126,217,87,0.08)', tension: 0.4, fill: true, pointBackgroundColor: 'rgba(126,217,87,1)', pointBorderColor: '#fff', pointBorderWidth: 2, pointRadius: 3, pointHoverRadius: 5 },
        ],
      },
      options: { ...baseChartOptions, plugins: { ...baseChartOptions.plugins, legend: { display: true, position: 'top', labels: { boxWidth: 12, padding: 16, font: { size: 12 } } } } },
    };
  };

  // ── Derived values ────────────────────────────────────────────────────────
  const hourlyChart    = buildHourlyChart();
  const activeCount    = syncedLogs.filter(l => l.status === 'ACTIVE').length;
  const completedCount = syncedLogs.filter(l => l.status === 'COMPLETED').length;
  const guardInitial   = syncedGuardInfo?.firstName?.charAt(0).toUpperCase() || 'G';
  const guardName      = syncedGuardInfo ? `${syncedGuardInfo.firstName} ${syncedGuardInfo.lastName}` : '';

  const lastRefreshText = lastRefresh
    ? `Updated ${lastRefresh.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })}`
    : '';

  return (
    <div className="dashboard-wrapper">
      {/* Banner */}
      {banner.show && (
        <div className={`banner-notification ${banner.type}`}>
          <div className="banner-content">
            <span className="banner-icon">
              {banner.type === 'success' && '✓'}{banner.type === 'error' && '✗'}
              {banner.type === 'warning' && '⚠'}{banner.type === 'info' && 'ℹ'}
            </span>
            <span className="banner-message">{banner.message}</span>
            <button className="banner-close" onClick={hideBanner}>×</button>
          </div>
        </div>
      )}

      <div className="dashboard-container">
        {/* Hero */}
        <div className="page-hero">
          <div className="page-hero-title-block">
            <div className="page-hero-label">Overview</div>
            <div className="page-hero-title">Dashboard</div>
            <div className="page-hero-date">{currentDate}</div>
          </div>
          <div className="page-hero-weather">
            <WeatherWidget customStyles={{
              conditionText: { color: 'white' },
              updateText: { color: 'white' }
            }} />
          </div>
        </div>

        {/* Action row */}
        <div className="page-action-row">
          <div className="header-actions">
            <button className="btn-view-all" onClick={() => setShowSyncModal(true)}>
              <SyncIcon className="btn-icon" />
              {hasSyncedLogs
                ? <><ShieldOutlinedIcon style={{ fontSize: 15, marginRight: 4 }} />{guardName}</>
                : 'Sync Guard Logs'}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner" />
            <div className="loading-text">Loading dashboard data...</div>
          </div>
        ) : (
          <>
            {/* Stat cards */}
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon-wrap"><EventNoteOutlinedIcon className="stat-icon" /></div>
                <div className="stat-info">
                  <div className="stat-value">{stats.daily}</div>
                  <div className="stat-label">Today's Visitors</div>
                </div>
                <div className="stat-trend positive">
                  <TrendingUpOutlinedIcon className="trend-icon" />
                  <span>Daily check-ins{hasSyncedLogs ? ' (merged)' : ''}</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon-wrap"><PeopleAltOutlinedIcon className="stat-icon" /></div>
                <div className="stat-info">
                  <div className="stat-value">{stats.total.toLocaleString()}</div>
                  <div className="stat-label">Total Visitors</div>
                </div>
                <div className="stat-trend">
                  <span>{hasSyncedLogs ? `Own + ${syncedLogs.length} guard log(s)` : 'All time records'}</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon-wrap active"><RadioButtonUncheckedOutlinedIcon className="stat-icon" /></div>
                <div className="stat-info">
                  <div className="stat-value">{stats.activeNow}</div>
                  <div className="stat-label">Active Now</div>
                </div>
                <div className="stat-trend"><span>Currently on premises</span></div>
              </div>

              <div className="stat-card">
                <div className="stat-icon-wrap completed"><CheckCircleOutlineOutlinedIcon className="stat-icon" /></div>
                <div className="stat-info">
                  <div className="stat-value">{stats.completedToday}</div>
                  <div className="stat-label">Completed Today</div>
                </div>
                <div className="stat-trend"><span>Checked out</span></div>
              </div>
            </div>

            {/* ── Synced Guard Logs Panel ────────────────────────────── */}
            {hasSyncedLogs ? (
              <div className="synced-panel">
                {/* Panel header */}
                <div className="synced-panel-header">
                  <div className="synced-panel-title">
                    <ShieldOutlinedIcon className="synced-panel-icon" />
                    <span>Synced Guard Logs</span>
                    <span className={`synced-status-pill ${isLiveSynced ? 'live' : 'snapshot'}`}>
                      {isLiveSynced ? '● Live' : '◎ Snapshot'}
                    </span>
                    <span className="synced-logs-count">
                      {syncedLogs.length} record{syncedLogs.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="synced-panel-actions">
                    {lastRefreshText && (
                      <span className="synced-last-refresh">{lastRefreshText}</span>
                    )}
                    <button
                      className={`synced-refresh-btn${refreshing ? ' spinning' : ''}`}
                      onClick={() => refreshSyncedLogs(false)}
                      disabled={refreshing || !isLiveSynced}
                      title={isLiveSynced ? 'Refresh now' : 'Only available during live sync'}
                    >
                      <RefreshIcon style={{ fontSize: 16 }} />
                      {refreshing ? 'Refreshing…' : 'Refresh'}
                    </button>
                    <button
                      className="synced-history-btn"
                      onClick={() => setShowHistory(!showHistory)}
                      title="Sync history"
                    >
                      <HistoryIcon style={{ fontSize: 16 }} />
                      {syncHistory.length > 0 && (
                        <span className="synced-history-badge">{syncHistory.length}</span>
                      )}
                    </button>
                  </div>
                </div>

                {/* Guard info strip */}
                <div className="synced-guard-strip">
                  <div className="synced-guard-avatar">{guardInitial}</div>
                  <div className="synced-guard-meta">
                    <span className="synced-guard-name">{guardName}</span>
                    <span className="synced-guard-stats">
                      <span className="sg-active">{activeCount} active</span>
                      <span className="sg-sep">·</span>
                      <span className="sg-done">{completedCount} completed</span>
                      <span className="sg-sep">·</span>
                      <span className="sg-total">{syncedLogs.length} total</span>
                    </span>
                  </div>
                  <button
                    className="synced-open-modal-btn"
                    onClick={() => setShowSyncModal(true)}
                  >
                    <SyncIcon style={{ fontSize: 14 }} /> Manage
                  </button>
                </div>

                {/* Logs table */}
                <div className="synced-table-wrap">
                  <table className="synced-table">
                    <thead>
                      <tr>
                        <th>Visitor</th>
                        <th>Contact No.</th>
                        <th>Host</th>
                        <th>Purpose</th>
                        <th>Time In</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagedSyncedLogs.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="synced-table-empty">No records on this page.</td>
                        </tr>
                      ) : pagedSyncedLogs.map((log, idx) => {
                        const isNew = newLogIds.has(log.id);
                        return (
                          <tr
                            key={log.id ?? idx}
                            className={isNew ? 'new-log-row' : ''}
                          >
                            <td className="st-name">
                              {log.visitorName || `Visitor #${log.visitorId}`}
                              {isNew && <span className="new-log-badge">NEW</span>}
                            </td>
                            <td className="st-contact">{log.contactNo || '—'}</td>
                            <td className="st-host">{log.hostName || '—'}</td>
                            <td className="st-purpose">{log.purposeName || '—'}</td>
                            <td className="st-time">{fmtTime(log.timeIn)}</td>
                            <td>
                              <span className={`st-status ${log.status?.toLowerCase()}`}>
                                {log.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalSyncPages > 1 && (
                  <div className="synced-pagination">
                    <span className="synced-page-info">
                      {(syncedPage - 1) * LOGS_PER_PAGE + 1}–{Math.min(syncedPage * LOGS_PER_PAGE, syncedLogs.length)} of {syncedLogs.length}
                    </span>
                    <div className="synced-page-btns">
                      <button
                        className="synced-page-btn"
                        onClick={() => setSyncedPage(p => Math.max(1, p - 1))}
                        disabled={syncedPage === 1}
                      >
                        <NavigateBeforeIcon style={{ fontSize: 18 }} />
                      </button>
                      <span className="synced-page-num">{syncedPage} / {totalSyncPages}</span>
                      <button
                        className="synced-page-btn"
                        onClick={() => setSyncedPage(p => Math.min(totalSyncPages, p + 1))}
                        disabled={syncedPage === totalSyncPages}
                      >
                        <NavigateNextIcon style={{ fontSize: 18 }} />
                      </button>
                    </div>
                  </div>
                )}

                {/* Sync history (inline collapsible) */}
                {showHistory && syncHistory.length > 0 && (
                  <div className="synced-history-inline">
                    <div className="shi-title">
                      <HistoryIcon style={{ fontSize: 15 }} /> Recent Cancellations
                    </div>
                    <div className="shi-list">
                      {[...syncHistory].reverse().slice(0, 5).map((h, i) => (
                        <div key={i} className="shi-row">
                          <span className="shi-avatar">{h.guardName?.charAt(0) || 'G'}</span>
                          <span className="shi-name">{h.guardName}</span>
                          <span className="shi-count">{h.recordCount} records</span>
                          <span className="shi-date">
                            {new Date(h.cancelledAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Empty state */
              <div className="synced-panel synced-panel-empty">
                <div className="synced-empty-inner">
                  <ShieldOutlinedIcon className="synced-empty-icon" />
                  <p className="synced-empty-title">No guard logs synced yet</p>
                  <p className="synced-empty-sub">
                    Click <strong>Sync Guard Logs</strong> above to pull a security guard's visitor data.
                  </p>
                  <div className="synced-empty-actions">
                    <button className="sync-btn-primary" onClick={() => setShowSyncModal(true)}>
                      <SyncIcon style={{ fontSize: 16 }} /> Sync Guard Logs
                    </button>
                    {syncHistory.length > 0 && (
                      <button className="synced-history-ghost-btn" onClick={() => setShowHistory(!showHistory)}>
                        <HistoryIcon style={{ fontSize: 14 }} /> History ({syncHistory.length})
                      </button>
                    )}
                  </div>
                  {showHistory && syncHistory.length > 0 && (
                    <div className="synced-history-inline" style={{ marginTop: 12, width: '100%', maxWidth: 480 }}>
                      <div className="shi-title">
                        <HistoryIcon style={{ fontSize: 15 }} /> Recent Cancellations
                      </div>
                      <div className="shi-list">
                        {[...syncHistory].reverse().slice(0, 5).map((h, i) => (
                          <div key={i} className="shi-row">
                            <span className="shi-avatar">{h.guardName?.charAt(0) || 'G'}</span>
                            <span className="shi-name">{h.guardName}</span>
                            <span className="shi-count">{h.recordCount} records</span>
                            <span className="shi-date">
                              {new Date(h.cancelledAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Charts */}
            <div className="charts-grid">
              <div className="chart-card">
                <div className="chart-header">
                  <div className="chart-title"><BarChartOutlinedIcon className="chart-icon" />Weekly Overview</div>
                  <div className="date-display"><DateRangeRoundedIcon className="date-icon" /><span className="date-text">Last 7 Days</span></div>
                </div>
                <div className="chart-body"><Bar data={weeklyChartData} options={baseChartOptions} /></div>
              </div>

              <div className="chart-card">
                <div className="chart-header">
                  <div className="chart-title"><PieChartOutlineOutlinedIcon className="chart-icon" />Visit Purposes</div>
                </div>
                <div className="chart-body">
                  {Object.keys(stats.purposeDistribution).length > 0 ? (
                    <Pie data={purposeChartData} options={pieChartOptions} />
                  ) : (
                    <div className="empty-chart">
                      <PieChartOutlineOutlinedIcon className="empty-chart-icon" /><p>No data available</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="chart-card full-width">
                <div className="chart-header">
                  <div className="chart-title">
                    <AccessTimeOutlinedIcon className="chart-icon" />
                    {hasSyncedLogs ? `Merged Logs — You & ${guardName} (24h)` : 'Hourly Traffic (24h)'}
                  </div>
                  {hasSyncedLogs && (
                    <div className="chart-sync-badge">
                      <SyncIcon style={{ fontSize: 13 }} />
                      {syncedLogs.length} record{syncedLogs.length !== 1 ? 's' : ''} from {guardName}
                    </div>
                  )}
                </div>
                <div className="chart-body">
                  <Line data={hourlyChart.data} options={hourlyChart.options} />
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {showSyncModal && (
        <SyncGuardModal
          onClose={() => {
            setShowSyncModal(false);
            setSyncHistory(lsGet(KEYS.HISTORY, []));
          }}
          onSyncComplete={handleSyncComplete}
        />
      )}

      <Link className="fab" to="/add-visitor">+</Link>
    </div>
  );
};

export default Dashboard;



