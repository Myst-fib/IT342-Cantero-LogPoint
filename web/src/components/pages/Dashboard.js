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

// Register ChartJS components
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
    hourlyTraffic: []
  });
  const [loading, setLoading] = useState(true);
  const [banner, setBanner] = useState({ show: false, message: '', type: 'success' });
  const [currentDate, setCurrentDate] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('week');

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
      hourlyTraffic.push({
        hour: i,
        count: hourLogs.length
      });
    }

    setStats({
      daily: todayLogs.length,
      total: logs.length,
      activeNow: activeLogs.length,
      completedToday: completedToday.length,
      weeklyData,
      purposeDistribution: purposeCount,
      hourlyTraffic
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
  }, []);

  useEffect(() => {
    setCurrentDate(getPhilippineDate());
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Chart configurations
  const weeklyChartData = {
    labels: stats.weeklyData.map(d => d.date),
    datasets: [
      {
        label: 'Visitors',
        data: stats.weeklyData.map(d => d.count),
        backgroundColor: 'rgba(0, 74, 173, 0.8)',
        borderRadius: 8,
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
          'rgba(0, 74, 173, 0.8)',
          'rgba(76, 175, 80, 0.8)',
          'rgba(255, 152, 0, 0.8)',
          'rgba(33, 150, 243, 0.8)',
          'rgba(156, 39, 176, 0.8)',
          'rgba(233, 30, 99, 0.8)',
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
        backgroundColor: 'rgba(0, 74, 173, 0.1)',
        tension: 0.4,
        fill: true,
        pointBackgroundColor: 'rgba(0, 74, 173, 1)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgba(0, 74, 173, 0.3)',
        borderWidth: 1,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          stepSize: 1,
        },
      },
      x: {
        grid: {
          display: false,
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
          boxWidth: 12,
          padding: 15,
          font: {
            size: 11,
          },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
      },
    },
  };

  return (
    <div className="dashboard-wrapper">
      {/* Banner Notification */}
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
              <div className="stat-card stat-daily">
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

              <div className="stat-card stat-total">
                <div className="stat-icon-wrap">
                  <PeopleAltOutlinedIcon className="stat-icon" />
                </div>
                <div className="stat-info">
                  <div className="stat-value">{stats.total}</div>
                  <div className="stat-label">Total Visitors</div>
                </div>
                <div className="stat-trend">
                  <span>All time records</span>
                </div>
              </div>

              <div className="stat-card stat-active">
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

              <div className="stat-card stat-completed">
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
              {/* Weekly Trend Chart */}
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
                  <Bar data={weeklyChartData} options={chartOptions} />
                </div>
              </div>

              {/* Purpose Distribution Chart */}
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

              {/* Hourly Traffic Chart */}
              <div className="chart-card full-width">
                <div className="chart-header">
                  <div className="chart-title">
                    <AccessTimeOutlinedIcon className="chart-icon" />
                    Hourly Traffic (24h)
                  </div>
                </div>
                <div className="chart-body">
                  <Line data={hourlyChartData} options={chartOptions} />
                </div>
              </div>
            </div>

            {/* Quick Stats Summary */}
            <div className="summary-cards">
              <div className="summary-card">
                <div className="summary-header">
                  <span className="summary-icon">📊</span>
                  <span className="summary-title">Peak Hours</span>
                </div>
                <div className="summary-content">
                  {stats.hourlyTraffic.length > 0 ? (
                    (() => {
                      const maxTraffic = Math.max(...stats.hourlyTraffic.map(h => h.count));
                      const peakHours = stats.hourlyTraffic
                        .filter(h => h.count === maxTraffic && h.count > 0)
                        .map(h => `${h.hour}:00 - ${h.hour + 1}:00`);
                      
                      return peakHours.length > 0 ? (
                        <p className="summary-value">{peakHours.join(', ')}</p>
                      ) : (
                        <p className="summary-placeholder">No data yet</p>
                      );
                    })()
                  ) : (
                    <p className="summary-placeholder">Loading...</p>
                  )}
                  <p className="summary-label">Busiest time periods</p>
                </div>
              </div>

              <div className="summary-card">
                <div className="summary-header">
                  <span className="summary-icon">🎯</span>
                  <span className="summary-title">Top Purpose</span>
                </div>
                <div className="summary-content">
                  {Object.keys(stats.purposeDistribution).length > 0 ? (
                    (() => {
                      const topPurpose = Object.entries(stats.purposeDistribution)
                        .sort((a, b) => b[1] - a[1])[0];
                      return (
                        <>
                          <p className="summary-value">{topPurpose[0]}</p>
                          <p className="summary-label">{topPurpose[1]} visits</p>
                        </>
                      );
                    })()
                  ) : (
                    <p className="summary-placeholder">No data yet</p>
                  )}
                </div>
              </div>

              <div className="summary-card">
                <div className="summary-header">
                  <span className="summary-icon">⚡</span>
                  <span className="summary-title">Avg Daily</span>
                </div>
                <div className="summary-content">
                  {stats.weeklyData.length > 0 ? (
                    (() => {
                      const avg = Math.round(
                        stats.weeklyData.reduce((sum, d) => sum + d.count, 0) / stats.weeklyData.length
                      );
                      return (
                        <>
                          <p className="summary-value">{avg}</p>
                          <p className="summary-label">Visitors per day</p>
                        </>
                      );
                    })()
                  ) : (
                    <p className="summary-placeholder">No data yet</p>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Floating Action Button */}
      <Link className="fab" to="/add-visitor">+</Link>
    </div>
  );
};

export default Dashboard;