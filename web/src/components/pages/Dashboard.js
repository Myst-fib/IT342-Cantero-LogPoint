// Dashboard.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import '../../styles/Dashboard.css';
import DateRangeRoundedIcon from '@mui/icons-material/DateRangeRounded';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import TrendingUpOutlinedIcon from '@mui/icons-material/TrendingUpOutlined';
import EventNoteOutlinedIcon from '@mui/icons-material/EventNoteOutlined';
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import RadioButtonUncheckedOutlinedIcon from '@mui/icons-material/RadioButtonUncheckedOutlined';
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined';
import PieChartOutlineOutlinedIcon from '@mui/icons-material/PieChartOutlineOutlined';
import BarChartOutlinedIcon from '@mui/icons-material/BarChartOutlined';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import SyncIcon from '@mui/icons-material/Sync';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import SyncGuardModal from '../features/SyncGuardModal';
import {
  Chart as ChartJS, ArcElement, CategoryScale, LinearScale,
  BarElement, Title, Tooltip, Legend, PointElement, LineElement,
} from 'chart.js';
import { Pie, Bar, Line } from 'react-chartjs-2';

ChartJS.register(
  ArcElement, CategoryScale, LinearScale, BarElement,
  Title, Tooltip, Legend, PointElement, LineElement
);

// ── localStorage keys (shared with SyncGuardModal.js) ────────────────────────
const LS_GUARD_ID   = 'logpoint_synced_guard_id';
const LS_GUARD_INFO = 'logpoint_synced_guard_info';
const LS_LOGS       = 'logpoint_synced_logs';

const lsGet = (key, fallback = null) => {
  try { const v = localStorage.getItem(key); return v !== null ? JSON.parse(v) : fallback; }
  catch { return fallback; }
};

const LOGS_PER_PAGE = 10;
const POLL_INTERVAL = 15000; // 15 s — auto-refresh own logs

// ─────────────────────────────────────────────────────────────────────────────
const Dashboard = () => {
  const [stats, setStats] = useState({
    daily: 0, total: 0, activeNow: 0, completedToday: 0,
    weeklyData: [], purposeDistribution: {}, hourlyTraffic: [],
    thisMonthCount: 0, lastMonthCount: 0, ytd: 0,
    momGrowth: null, avgPerDay: 0,
  });
  const [loading,       setLoading]       = useState(true);
  const [banner,        setBanner]        = useState({ show: false, message: '', type: 'success' });
  const [currentDate,   setCurrentDate]   = useState('');
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [ownLogs,       setOwnLogs]       = useState([]);

  // ── Synced guard state (restored from localStorage on mount) ─────────────
  const [syncedLogs,      setSyncedLogs]      = useState(() => lsGet(LS_LOGS, []));
  const [syncedGuardInfo, setSyncedGuardInfo] = useState(() => lsGet(LS_GUARD_INFO));
  const [syncedGuardId,   setSyncedGuardId]   = useState(() => lsGet(LS_GUARD_ID));

  // ── Pagination for synced logs table ─────────────────────────────────────
  const [syncedPage, setSyncedPage] = useState(1);

  const hasSyncedLogs  = syncedLogs.length > 0;
  const totalSyncPages = Math.ceil(syncedLogs.length / LOGS_PER_PAGE);
  const pagedSyncedLogs = syncedLogs.slice(
    (syncedPage - 1) * LOGS_PER_PAGE,
    syncedPage       * LOGS_PER_PAGE
  );

  // Ref so the poll callback always sees current ownLogs without being
  // recreated on every render (avoids resetting the interval)
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

    const now            = new Date();
    const thisMonthCount = logs.filter(l => {
      const d = new Date(l.timeIn);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
    const lastM = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthCount = logs.filter(l => {
      const d = new Date(l.timeIn);
      return d.getMonth() === lastM.getMonth() && d.getFullYear() === lastM.getFullYear();
    }).length;
    const ytd        = logs.filter(l => new Date(l.timeIn).getFullYear() === now.getFullYear()).length;
    const momGrowth  = lastMonthCount > 0
      ? parseFloat((((thisMonthCount - lastMonthCount) / lastMonthCount) * 100).toFixed(1))
      : null;
    const avgPerDay  = now.getDate() > 0 ? Math.round(thisMonthCount / now.getDate()) : 0;

    setStats({
      daily: todayLogs.length, total: logs.length,
      activeNow: activeLogs.length, completedToday: completedToday.length,
      weeklyData, purposeDistribution: purposeCount, hourlyTraffic,
      thisMonthCount, lastMonthCount, ytd, momGrowth, avgPerDay,
    });
  }, []);

  // ── Fetch own logs (used on mount + by the auto-poll) ─────────────────────
  const fetchOwnLogs = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch('http://localhost:8080/api/visit-logs', {
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
  }, [calculateStats, showBanner]);

  // ── Auto-poll own logs every 15 s so new visitors show in real time ───────
  useEffect(() => {
    setCurrentDate(getPhilippineDate());
    fetchOwnLogs(false); // initial load (shows spinner)

    const id = setInterval(() => {
      fetchOwnLogs(true); // background refresh (silent, no spinner)
    }, POLL_INTERVAL);

    return () => clearInterval(id);
  }, [fetchOwnLogs]);

  // Re-run stats when synced logs change (live poll from SyncGuardModal)
  useEffect(() => {
    if (!loading) calculateStats(getMergedLogs(ownLogsRef.current, syncedLogs));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syncedLogs]);

  // Reset pagination if synced logs change
  useEffect(() => { setSyncedPage(1); }, [syncedLogs]);

  // ── Sync callback from SyncGuardModal ─────────────────────────────────────
  const handleSyncComplete = useCallback((logs, guard, guardId, isCancelled, shouldDelete = false) => {
    if (!guardId) return;

    if (shouldDelete || (logs === null && !isCancelled)) {
      setSyncedLogs([]);
      setSyncedGuardInfo(null);
      setSyncedGuardId(null);
      if (!isCancelled) showBanner('Sync data cleared.', 'info');
      return;
    }

    if (isCancelled) {
      showBanner('Sync cancelled – existing data remains visible.', 'info');
      return;
    }

    if (logs === null) {
      setSyncedLogs([]);
      setSyncedGuardInfo(null);
      setSyncedGuardId(null);
      return;
    }

    setSyncedLogs(logs);
    if (guard) setSyncedGuardInfo(guard);
    setSyncedGuardId(guardId);

    const name = guard
      ? `${guard.firstName} ${guard.lastName}`
      : syncedGuardInfo
        ? `${syncedGuardInfo.firstName} ${syncedGuardInfo.lastName}`
        : 'Guard';
    showBanner(`Synced ${logs.length} log(s) from ${name}`, 'success');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showBanner, syncedGuardInfo]);

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
  const momPositive    = stats.momGrowth !== null && stats.momGrowth >= 0;
  const momLabel       = stats.momGrowth !== null ? `${momPositive ? '+' : ''}${stats.momGrowth}%` : '—';
  const activeCount    = syncedLogs.filter(l => l.status === 'ACTIVE').length;
  const completedCount = syncedLogs.filter(l => l.status === 'COMPLETED').length;
  const guardInitial   = syncedGuardInfo?.firstName?.charAt(0).toUpperCase() || 'G';
  const guardName      = syncedGuardInfo ? `${syncedGuardInfo.firstName} ${syncedGuardInfo.lastName}` : '';

  // ─────────────────────────────────────────────────────────────────────────
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
        {/* Page Header */}
        <div className="page-header">
          <div>
            <div className="page-title">Dashboard</div>
            <div className="page-subtitle text-light">{currentDate}</div>
          </div>
          <div className="header-actions">
            {/* Sync button — always just opens the modal, never triggers a sync */}
            <button className="btn-view-all" onClick={() => setShowSyncModal(true)}>
              <SyncIcon className="btn-icon" />
              {hasSyncedLogs
                ? <><ShieldOutlinedIcon style={{ fontSize: 15, marginRight: 4 }} />{guardName}</>
                : 'Sync Guard Logs'}
            </button>
            <Link className="btn-add" to="/add-visitor">
              <span style={{ fontSize: 18, lineHeight: 1 }}>+</span> Add Visitor
            </Link>
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
                    <button className="chart-clear-btn"
                      onClick={() => handleSyncComplete(null, null, syncedGuardId, false, true)}>
                      × Clear guard data
                    </button>
                  )}
                </div>
                <div className="chart-body">
                  <Line data={hourlyChart.data} options={hourlyChart.options} />
                </div>
                {hasSyncedLogs && (
                  <div className="chart-sync-badge">
                    <SyncIcon style={{ fontSize: 13 }} />
                    Synced from {guardName} — {syncedLogs.length} record{syncedLogs.length !== 1 ? 's' : ''}
                  </div>
                )}
              </div>
            </div>

            {/* Monthly KPIs */}
            <div className="monthly-section">
              <div className="section-label">
                <CalendarMonthOutlinedIcon style={{ fontSize: 16, opacity: 0.7 }} />
                Monthly Overview
              </div>

              <div className="monthly-metrics">
                <div className="monthly-metric">
                  <div className="monthly-metric-top">
                    <span className="monthly-metric-label">This Month</span>
                    {stats.momGrowth !== null && (
                      <span className={`monthly-badge ${momPositive ? 'pos' : 'neg'}`}>
                        {momPositive ? '▲' : '▼'} {Math.abs(stats.momGrowth)}%
                      </span>
                    )}
                  </div>
                  <div className="monthly-metric-value">{stats.thisMonthCount.toLocaleString()}</div>
                  <div className="monthly-metric-sub">vs {stats.lastMonthCount.toLocaleString()} last month</div>
                </div>

                <div className="monthly-metric">
                  <div className="monthly-metric-top"><span className="monthly-metric-label">Last Month</span></div>
                  <div className="monthly-metric-value">{stats.lastMonthCount.toLocaleString()}</div>
                  <div className="monthly-metric-sub">completed period</div>
                </div>

                <div className="monthly-metric">
                  <div className="monthly-metric-top"><span className="monthly-metric-label">Year to Date</span></div>
                  <div className="monthly-metric-value">{stats.ytd.toLocaleString()}</div>
                  <div className="monthly-metric-sub">total visitors {new Date().getFullYear()}</div>
                </div>

                <div className="monthly-metric">
                  <div className="monthly-metric-top"><span className="monthly-metric-label">Daily Average</span></div>
                  <div className="monthly-metric-value">{stats.avgPerDay}</div>
                  <div className="monthly-metric-sub">visitors / day this month</div>
                </div>
              </div>

              {/* ── Synced guard logs panel ─────────────────────────────────── */}
              {hasSyncedLogs ? (
                <div className="chart-card synced-logs-card">
                  <div className="chart-header">
                    <div className="chart-title">
                      <ShieldOutlinedIcon className="chart-icon" />
                      Synced Guard Logs
                      <span className="synced-logs-badge">
                        {syncedLogs.length} record{syncedLogs.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <button className="chart-clear-btn"
                      onClick={() => handleSyncComplete(null, null, syncedGuardId, false, true)}>
                      × Clear
                    </button>
                  </div>

                  <div className="synced-guard-section">
                    {/* Guard info row */}
                    <div className="synced-guard-header">
                      <div className="synced-guard-avatar">{guardInitial}</div>
                      <div className="synced-guard-meta">
                        <span className="synced-guard-name">{guardName}</span>
                        <span className="synced-guard-sub">
                          {syncedLogs.length} log{syncedLogs.length !== 1 ? 's' : ''}&nbsp;·&nbsp;
                          <span className="synced-count-active">{activeCount} active</span>
                          &nbsp;·&nbsp;
                          <span className="synced-count-done">{completedCount} completed</span>
                        </span>
                      </div>
                    </div>

                    {/* Logs table — paginated */}
                    <div className="synced-logs-table">
                      <div className="slt-head">
                        <span>Visitor</span>
                        <span>Purpose</span>
                        <span>Status</span>
                      </div>
                      {pagedSyncedLogs.map((log, idx) => (
                        <div key={log.id ?? idx} className="slt-row">
                          <span className="slt-name">{log.visitorName || `Visitor #${log.visitorId}`}</span>
                          <span className="slt-purpose">{log.purposeName || '—'}</span>
                          <span className={`slt-status ${log.status?.toLowerCase()}`}>{log.status}</span>
                        </div>
                      ))}
                    </div>

                    {/* Pagination controls — only shown when > 10 records */}
                    {totalSyncPages > 1 && (
                      <div className="slt-pagination">
                        <span className="slt-page-info">
                          {(syncedPage - 1) * LOGS_PER_PAGE + 1}–{Math.min(syncedPage * LOGS_PER_PAGE, syncedLogs.length)} of {syncedLogs.length}
                        </span>
                        <div className="slt-page-btns">
                          <button
                            className="slt-page-btn"
                            onClick={() => setSyncedPage(p => Math.max(1, p - 1))}
                            disabled={syncedPage === 1}
                          >
                            <NavigateBeforeIcon style={{ fontSize: 18 }} />
                          </button>
                          <span className="slt-page-num">{syncedPage} / {totalSyncPages}</span>
                          <button
                            className="slt-page-btn"
                            onClick={() => setSyncedPage(p => Math.min(totalSyncPages, p + 1))}
                            disabled={syncedPage === totalSyncPages}
                          >
                            <NavigateNextIcon style={{ fontSize: 18 }} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* Empty state */
                <div className="chart-card synced-logs-empty">
                  <div className="synced-empty-inner">
                    <ShieldOutlinedIcon className="synced-empty-icon" />
                    <p className="synced-empty-title">No guard logs synced yet</p>
                    <p className="synced-empty-sub">
                      Click <strong>Sync Guard Logs</strong> above to pull a security guard's visitor data into the dashboard.
                    </p>
                    <button className="sync-btn primary synced-empty-btn" onClick={() => setShowSyncModal(true)}>
                      <SyncIcon className="btn-icon-sm" /> Sync Guard Logs
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Modal — only rendered when open; does NOT trigger a sync on open */}
      {showSyncModal && (
        <SyncGuardModal
          onClose={() => setShowSyncModal(false)}
          onSyncComplete={handleSyncComplete}
        />
      )}

      <Link className="fab" to="/add-visitor">+</Link>
    </div>
  );
};

export default Dashboard;