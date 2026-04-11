// Dashboard.js
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import '../../styles/Dashboard.css';
import DateRangeRoundedIcon from '@mui/icons-material/DateRangeRounded';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import TrendingUpOutlinedIcon from '@mui/icons-material/TrendingUpOutlined';
import EventNoteOutlinedIcon from '@mui/icons-material/EventNoteOutlined';
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import RadioButtonUncheckedOutlinedIcon from '@mui/icons-material/RadioButtonUncheckedOutlined';
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined';
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined';
import PieChartOutlineOutlinedIcon from '@mui/icons-material/PieChartOutlineOutlined';
import BarChartOutlinedIcon from '@mui/icons-material/BarChartOutlined';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement
} from 'chart.js';
import { Pie, Bar, Line } from 'react-chartjs-2';

ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement
);

const Dashboard = () => {
  const [stats, setStats] = useState({
    daily: 0,
    total: 0,
    activeNow: 0,
    completedToday: 0,
    weeklyData: [],
    purposeDistribution: {},
    hourlyTraffic: [],
    monthlyData: [],
    thisMonthCount: 0,
    lastMonthCount: 0,
    ytd: 0,
    momGrowth: null,
    avgPerDay: 0,
    peakMonth: null,
    lowMonth: null,
  });
  const [loading, setLoading] = useState(true);
  const [banner, setBanner] = useState({ show: false, message: '', type: 'success' });
  const [currentDate, setCurrentDate] = useState('');

  const getPhilippineDate = () => {
    const now = new Date();
    const philippineTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Manila' }));
    return philippineTime.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const showBanner = (message, type = 'success') => {
    setBanner({ show: true, message, type });
    setTimeout(() => hideBanner(), 3000);
  };

  const hideBanner = () => {
    const bannerElement = document.querySelector('.banner-notification');
    if (bannerElement) {
      bannerElement.classList.add('fade-out');
      setTimeout(() => setBanner({ show: false, message: '', type: 'success' }), 300);
    } else {
      setBanner({ show: false, message: '', type: 'success' });
    }
  };

  const calculateStats = (logs) => {
    const today = new Date().toLocaleDateString('en-US', { timeZone: 'Asia/Manila' });

    // Basic stats
    const todayLogs = logs.filter(log => {
      const logDate = new Date(log.timeIn).toLocaleDateString('en-US', { timeZone: 'Asia/Manila' });
      return logDate === today;
    });

    const activeLogs = logs.filter(log => log.status === 'ACTIVE');
    const completedToday = todayLogs.filter(log => log.status === 'COMPLETED');

    // Weekly data (last 7 days)
    const weeklyData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString('en-US', { timeZone: 'Asia/Manila' });
      const dayLogs = logs.filter(log => {
        const logDate = new Date(log.timeIn).toLocaleDateString('en-US', { timeZone: 'Asia/Manila' });
        return logDate === dateStr;
      });
      weeklyData.push({
        date: date.toLocaleDateString('en-US', { weekday: 'short' }),
        count: dayLogs.length
      });
    }

    // Purpose distribution
    const purposeCount = {};
    logs.forEach(log => {
      const purpose = log.purposeName || 'Other';
      purposeCount[purpose] = (purposeCount[purpose] || 0) + 1;
    });

    // Hourly traffic (last 24 hours)
    const hourlyTraffic = [];
    for (let i = 0; i < 24; i++) {
      const hourLogs = logs.filter(log => {
        const logHour = new Date(log.timeIn).getHours();
        return logHour === i;
      });
      hourlyTraffic.push({ hour: i, count: hourLogs.length });
    }

    // Monthly data (last 12 months)
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const monthlyData = [];

    for (let i = 11; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth - i, 1);
      const targetMonth = d.getMonth();
      const targetYear = d.getFullYear();
      const monthLogs = logs.filter(log => {
        const ld = new Date(log.timeIn);
        return ld.getMonth() === targetMonth && ld.getFullYear() === targetYear;
      });
      monthlyData.push({
        month: d.toLocaleDateString('en-US', { month: 'short' }),
        fullMonth: d.toLocaleDateString('en-US', { month: 'long' }),
        count: monthLogs.length,
        isCurrent: i === 0,
      });
    }

    const thisMonthCount = monthlyData[11].count;
    const lastMonthCount = monthlyData[10].count;

    // Year-to-date: all logs in current year
    const ytd = logs.filter(log => new Date(log.timeIn).getFullYear() === currentYear).length;

    // MoM growth
    const momGrowth = lastMonthCount > 0
      ? parseFloat((((thisMonthCount - lastMonthCount) / lastMonthCount) * 100).toFixed(1))
      : null;

    // Avg visitors per day this month
    const dayOfMonth = now.getDate();
    const avgPerDay = dayOfMonth > 0 ? Math.round(thisMonthCount / dayOfMonth) : 0;

    // Peak and lowest months (from actual data)
    const nonZeroMonths = monthlyData.filter(m => m.count > 0);
    const peakMonth = nonZeroMonths.length > 0
      ? [...nonZeroMonths].sort((a, b) => b.count - a.count)[0].fullMonth
      : null;
    const lowMonth = nonZeroMonths.length > 0
      ? [...nonZeroMonths].sort((a, b) => a.count - b.count)[0].fullMonth
      : null;

    setStats({
      daily: todayLogs.length,
      total: logs.length,
      activeNow: activeLogs.length,
      completedToday: completedToday.length,
      weeklyData,
      purposeDistribution: purposeCount,
      hourlyTraffic,
      monthlyData,
      thisMonthCount,
      lastMonthCount,
      ytd,
      momGrowth,
      avgPerDay,
      peakMonth,
      lowMonth,
    });
  };

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const logsResponse = await fetch('http://localhost:8080/api/visit-logs', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      if (logsResponse.ok) {
        const logs = await logsResponse.json();
        calculateStats(logs);
      } else {
        showBanner('Failed to fetch dashboard data', 'error');
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      showBanner('Server error. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setCurrentDate(getPhilippineDate());
    fetchDashboardData();
  }, [fetchDashboardData]);

  // ── Chart configurations ──────────────────────────────────────────────────

  const weeklyChartData = {
    labels: stats.weeklyData.map(d => d.date),
    datasets: [
      {
        label: 'Visitors',
        data: stats.weeklyData.map(d => d.count),
        backgroundColor: 'rgba(0, 74, 173, 0.82)',
        borderRadius: 7,
        borderSkipped: false,
      }
    ]
  };

  const purposeChartData = {
    labels: Object.keys(stats.purposeDistribution),
    datasets: [
      {
        data: Object.values(stats.purposeDistribution),
        backgroundColor: [
          'rgba(0, 74, 173, 0.85)',
          'rgba(29, 158, 117, 0.85)',
          'rgba(186, 117, 23, 0.85)',
          'rgba(33, 150, 243, 0.85)',
          'rgba(156, 39, 176, 0.85)',
          'rgba(216, 90, 48, 0.85)',
        ],
        borderWidth: 0,
      }
    ]
  };

  const hourlyChartData = {
    labels: stats.hourlyTraffic.map(h => `${h.hour}:00`),
    datasets: [
      {
        label: 'Visitors',
        data: stats.hourlyTraffic.map(h => h.count),
        borderColor: 'rgba(0, 74, 173, 1)',
        backgroundColor: 'rgba(0, 74, 173, 0.08)',
        tension: 0.4,
        fill: true,
        pointBackgroundColor: 'rgba(0, 74, 173, 1)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 5,
      }
    ]
  };

  const monthlyChartData = {
    labels: stats.monthlyData.map(d => d.month),
    datasets: [
      {
        label: 'Visitors',
        data: stats.monthlyData.map(d => d.count),
        backgroundColor: stats.monthlyData.map(d =>
          d.isCurrent ? 'rgba(0, 74, 173, 1)' : 'rgba(0, 74, 173, 0.45)'
        ),
        borderRadius: 6,
        borderSkipped: false,
        borderWidth: 0,
      }
    ]
  };

  const baseChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(10, 10, 20, 0.88)',
        padding: 12,
        titleColor: '#fff',
        bodyColor: '#ccc',
        borderColor: 'rgba(0, 74, 173, 0.3)',
        borderWidth: 1,
        cornerRadius: 8,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(0,0,0,0.05)' },
        ticks: { stepSize: 1, font: { size: 11 }, color: '#999' },
      },
      x: {
        grid: { display: false },
        ticks: { font: { size: 11 }, color: '#999' },
      },
    },
  };

  const monthlyChartOptions = {
    ...baseChartOptions,
    plugins: {
      ...baseChartOptions.plugins,
      tooltip: {
        ...baseChartOptions.plugins.tooltip,
        callbacks: {
          label: ctx => ` ${ctx.parsed.y.toLocaleString()} visitors`,
        },
      },
    },
    scales: {
      ...baseChartOptions.scales,
      x: {
        ...baseChartOptions.scales.x,
        ticks: {
          ...baseChartOptions.scales.x.ticks,
          autoSkip: false,
          maxRotation: 0,
        },
      },
    },
  };

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          boxWidth: 10,
          padding: 14,
          font: { size: 11 },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(10,10,20,0.88)',
        padding: 12,
        cornerRadius: 8,
      },
    },
  };

  // ── Derived monthly footer values ─────────────────────────────────────────
  const momPositive = stats.momGrowth !== null && stats.momGrowth >= 0;
  const momLabel = stats.momGrowth !== null
    ? `${momPositive ? '+' : ''}${stats.momGrowth}%`
    : '—';

  return (
    <div className="dashboard-wrapper">
      {/* Banner */}
      {banner.show && (
        <div className={`banner-notification ${banner.type}`}>
          <div className="banner-content">
            <span className="banner-icon">
              {banner.type === 'success' && '✓'}
              {banner.type === 'error' && '✗'}
              {banner.type === 'warning' && '⚠'}
              {banner.type === 'info' && 'ℹ'}
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
            <Link className="btn-view-all" to="/visitor-log">
              <AssessmentOutlinedIcon className="btn-icon" />
              View All Records
            </Link>
            <Link className="btn-add" to="/add-visitor">
              <span style={{ fontSize: 18, lineHeight: 1 }}>+</span> Add Visitor
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <div className="loading-text">Loading dashboard data...</div>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon-wrap">
                  <EventNoteOutlinedIcon className="stat-icon" />
                </div>
                <div className="stat-info">
                  <div className="stat-value">{stats.daily}</div>
                  <div className="stat-label">Today's Visitors</div>
                </div>
                <div className="stat-trend positive">
                  <TrendingUpOutlinedIcon className="trend-icon" />
                  <span>Daily check-ins</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon-wrap">
                  <PeopleAltOutlinedIcon className="stat-icon" />
                </div>
                <div className="stat-info">
                  <div className="stat-value">{stats.total.toLocaleString()}</div>
                  <div className="stat-label">Total Visitors</div>
                </div>
                <div className="stat-trend">
                  <span>All time records</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon-wrap active">
                  <RadioButtonUncheckedOutlinedIcon className="stat-icon" />
                </div>
                <div className="stat-info">
                  <div className="stat-value">{stats.activeNow}</div>
                  <div className="stat-label">Active Now</div>
                </div>
                <div className="stat-trend">
                  <span>Currently on premises</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon-wrap completed">
                  <CheckCircleOutlineOutlinedIcon className="stat-icon" />
                </div>
                <div className="stat-info">
                  <div className="stat-value">{stats.completedToday}</div>
                  <div className="stat-label">Completed Today</div>
                </div>
                <div className="stat-trend">
                  <span>Checked out</span>
                </div>
              </div>
            </div>

            {/* Charts Section */}
            <div className="charts-grid">
              {/* Weekly Trend */}
              <div className="chart-card">
                <div className="chart-header">
                  <div className="chart-title">
                    <BarChartOutlinedIcon className="chart-icon" />
                    Weekly Overview
                  </div>
                  <div className="date-display">
                    <DateRangeRoundedIcon className="date-icon" />
                    <span className="date-text">Last 7 Days</span>
                  </div>
                </div>
                <div className="chart-body">
                  <Bar data={weeklyChartData} options={baseChartOptions} />
                </div>
              </div>

              {/* Purpose Distribution */}
              <div className="chart-card">
                <div className="chart-header">
                  <div className="chart-title">
                    <PieChartOutlineOutlinedIcon className="chart-icon" />
                    Visit Purposes
                  </div>
                </div>
                <div className="chart-body">
                  {Object.keys(stats.purposeDistribution).length > 0 ? (
                    <Pie data={purposeChartData} options={pieChartOptions} />
                  ) : (
                    <div className="empty-chart">
                      <PieChartOutlineOutlinedIcon className="empty-chart-icon" />
                      <p>No data available</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Hourly Traffic */}
              <div className="chart-card full-width">
                <div className="chart-header">
                  <div className="chart-title">
                    <AccessTimeOutlinedIcon className="chart-icon" />
                    Hourly Traffic (24h)
                  </div>
                </div>
                <div className="chart-body">
                  <Line data={hourlyChartData} options={baseChartOptions} />
                </div>
              </div>
            </div>

            {/* ── Monthly Visitors Section ────────────────────────────── */}
            <div className="monthly-section">
              <div className="section-label">
                <CalendarMonthOutlinedIcon style={{ fontSize: 16, opacity: 0.7 }} />
                Monthly Visitors
              </div>

              {/* KPI metric cards */}
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
                  <div className="monthly-metric-top">
                    <span className="monthly-metric-label">Last Month</span>
                  </div>
                  <div className="monthly-metric-value">{stats.lastMonthCount.toLocaleString()}</div>
                  <div className="monthly-metric-sub">completed period</div>
                </div>

                <div className="monthly-metric">
                  <div className="monthly-metric-top">
                    <span className="monthly-metric-label">Year to Date</span>
                  </div>
                  <div className="monthly-metric-value">{stats.ytd.toLocaleString()}</div>
                  <div className="monthly-metric-sub">total visitors {new Date().getFullYear()}</div>
                </div>

                <div className="monthly-metric">
                  <div className="monthly-metric-top">
                    <span className="monthly-metric-label">Daily Average</span>
                  </div>
                  <div className="monthly-metric-value">{stats.avgPerDay}</div>
                  <div className="monthly-metric-sub">visitors / day this month</div>
                </div>
              </div>

              {/* Monthly bar chart */}
              <div className="chart-card">
                <div className="chart-header">
                  <div className="chart-title">
                    <BarChartOutlinedIcon className="chart-icon" />
                    12-Month Visitor Trend
                  </div>
                  <div className="monthly-chart-legend">
                    <span className="legend-swatch current"></span>
                    <span className="legend-text">Current month</span>
                    <span className="legend-swatch past"></span>
                    <span className="legend-text">Prior months</span>
                  </div>
                </div>

                <div className="chart-body chart-body--tall">
                  <Bar data={monthlyChartData} options={monthlyChartOptions} />
                </div>

                {/* Footer summary row */}
                <div className="monthly-footer">
                  <div className="monthly-footer-item">
                    <span className="monthly-footer-label">Peak Month</span>
                    <span className="monthly-footer-value">{stats.peakMonth ?? '—'}</span>
                  </div>
                  <div className="monthly-footer-divider" />
                  <div className="monthly-footer-item">
                    <span className="monthly-footer-label">Lowest Month</span>
                    <span className="monthly-footer-value">{stats.lowMonth ?? '—'}</span>
                  </div>
                  <div className="monthly-footer-divider" />
                  <div className="monthly-footer-item">
                    <span className="monthly-footer-label">MoM Growth</span>
                    <span className={`monthly-footer-value ${momPositive ? 'green' : 'red'}`}>
                      {momLabel}
                    </span>
                  </div>
                  <div className="monthly-footer-divider" />
                  <div className="monthly-footer-item">
                    <span className="monthly-footer-label">Avg / Month (12m)</span>
                    <span className="monthly-footer-value">
                      {stats.monthlyData.length > 0
                        ? Math.round(
                            stats.monthlyData.reduce((s, d) => s + d.count, 0) /
                            stats.monthlyData.length
                          ).toLocaleString()
                        : '—'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* FAB */}
      <Link className="fab" to="/add-visitor">+</Link>
    </div>
  );
};

export default Dashboard;