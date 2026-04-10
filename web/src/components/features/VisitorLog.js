import React, { useState, useEffect, useCallback } from 'react';
import '../../styles/VisitorLog.css';
import EditVisitorModal from './EditVisitorModal';
import DateRangeRoundedIcon from '@mui/icons-material/DateRangeRounded';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import FilterListOutlinedIcon from '@mui/icons-material/FilterListOutlined';
import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined';
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import RadioButtonUncheckedOutlinedIcon from '@mui/icons-material/RadioButtonUncheckedOutlined';
import EventNoteOutlinedIcon from '@mui/icons-material/EventNoteOutlined';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import DeleteForeverOutlinedIcon from '@mui/icons-material/DeleteForeverOutlined';

function VisitorLog() {
  const [visitLogs, setVisitLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [banner, setBanner] = useState({ show: false, message: '', type: 'success' });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('');
  const [currentDate, setCurrentDate] = useState('');
  const [checkingOut, setCheckingOut] = useState(null);

  // Modals
  const [confirmModal, setConfirmModal] = useState({ show: false, logId: null, visitorName: '' });
  const [deleteModal, setDeleteModal] = useState({ show: false, logId: null, visitorName: '' });
  const [editModal, setEditModal] = useState({ show: false, log: null });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const getPhilippineDate = () => {
    const now = new Date();
    const philippineTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Manila' }));
    return philippineTime.toLocaleDateString('en-US', {
      month: 'long', day: '2-digit', year: 'numeric'
    });
  };

  const formatTime = (dateTimeStr) => {
    if (!dateTimeStr) return '—';
    return new Date(dateTimeStr).toLocaleString('en-US', {
      timeZone: 'Asia/Manila', hour: '2-digit', minute: '2-digit', hour12: true
    });
  };

  const showBanner = (message, type = 'success') => {
    setBanner({ show: true, message, type });
    setTimeout(() => hideBanner(), 3000);
  };

  const hideBanner = () => {
    const el = document.querySelector('.banner-notification');
    if (el) {
      el.classList.add('fade-out');
      setTimeout(() => setBanner({ show: false, message: '', type: 'success' }), 300);
    } else {
      setBanner({ show: false, message: '', type: 'success' });
    }
  };

  const fetchVisitLogs = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const response = await fetch('http://localhost:8080/api/visit-logs', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        const sorted = data.sort((a, b) => new Date(b.timeIn) - new Date(a.timeIn));
        setVisitLogs(sorted);
        if (isRefresh) showBanner('Records refreshed successfully', 'success');
      } else {
        showBanner('Failed to fetch visit logs', 'error');
      }
    } catch (error) {
      console.error('Error fetching visit logs:', error);
      showBanner('Server error. Please try again.', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    setCurrentDate(getPhilippineDate());
    fetchVisitLogs();
  }, [fetchVisitLogs]);

  useEffect(() => {
    let result = [...visitLogs];

    if (statusFilter !== 'ALL') {
      result = result.filter(log => log.status === statusFilter);
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(log =>
        log.visitorName?.toLowerCase().includes(term) ||
        log.purposeName?.toLowerCase().includes(term) ||
        log.hostName?.toLowerCase().includes(term)
      );
    }

    if (dateFilter) {
      result = result.filter(log => {
        if (!log.timeIn) return false;
        const logDate = new Date(log.timeIn).toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });
        return logDate === dateFilter;
      });
    }

    setFilteredLogs(result);
    setCurrentPage(1);
  }, [visitLogs, statusFilter, searchTerm, dateFilter]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredLogs.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);

  const handleNextPage = () => { if (currentPage < totalPages) setCurrentPage(currentPage + 1); };
  const handlePrevPage = () => { if (currentPage > 1) setCurrentPage(currentPage - 1); };

  // ── Check Out ──
  const handleCheckOut = (logId, visitorName) => {
    setConfirmModal({ show: true, logId, visitorName });
  };

  const confirmCheckOut = async () => {
    const { logId } = confirmModal;
    setConfirmModal({ show: false, logId: null, visitorName: '' });
    setCheckingOut(logId);

    try {
      const response = await fetch(`http://localhost:8080/api/visit-logs/check-out/${logId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (response.ok) {
        showBanner('✓ Visitor checked out successfully!', 'success');
        setVisitLogs(prev =>
          prev.map(log =>
            log.id === logId
              ? { ...log, status: 'COMPLETED', timeOut: new Date().toISOString() }
              : log
          )
        );
      } else {
        const error = await response.text();
        showBanner(error || 'Failed to check out visitor', 'error');
      }
    } catch (error) {
      console.error('Error checking out:', error);
      showBanner('Server error. Please try again.', 'error');
    } finally {
      setCheckingOut(null);
    }
  };

  // ── Delete ──
  const handleDelete = (logId, visitorName) => {
    setDeleteModal({ show: true, logId, visitorName });
  };

  const confirmDelete = async () => {
    const { logId } = deleteModal;
    setDeleteModal({ show: false, logId: null, visitorName: '' });

    try {
      const response = await fetch(`http://localhost:8080/api/visit-logs/${logId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        showBanner('✓ Visitor record deleted.', 'success');
        setVisitLogs(prev => prev.filter(log => log.id !== logId));
      } else {
        const error = await response.text();
        showBanner(error || 'Failed to delete record', 'error');
      }
    } catch (error) {
      console.error('Error deleting:', error);
      showBanner('Server error. Please try again.', 'error');
    }
  };

  // ── Edit ──
  const handleEdit = (log) => {
    // Make sure log.id is the actual database ID
    console.log('Editing visitor with ID:', log.id);
    setEditModal({ show: true, log });
  };

  const handleEditSave = (updatedLog) => {
    setVisitLogs(prev =>
      prev.map(log => log.id === updatedLog.id ? { ...log, ...updatedLog } : log)
    );
    setEditModal({ show: false, log: null });
    showBanner('✓ Visitor updated successfully!', 'success');
  };

  const activeCount = visitLogs.filter(l => l.status === 'ACTIVE').length;
  const completedCount = visitLogs.filter(l => l.status === 'COMPLETED').length;
  const hasActiveFilters = searchTerm || statusFilter !== 'ALL' || dateFilter;

  return (
    <div className="visitor-log-wrapper">

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

      {/* Checkout Confirm Modal */}
      {confirmModal.show && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-icon">
              <LogoutOutlinedIcon />
            </div>
            <div className="modal-title">Check Out Visitor</div>
            <div className="modal-message">
              Are you sure you want to check out <strong>{confirmModal.visitorName}</strong>?
              This will mark their visit as completed.
            </div>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setConfirmModal({ show: false, logId: null, visitorName: '' })}>
                Cancel
              </button>
              <button className="btn-checkout-confirm" onClick={confirmCheckOut}>
                Yes, Check Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteModal.show && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-icon modal-icon-danger">
              <DeleteForeverOutlinedIcon />
            </div>
            <div className="modal-title">Delete Record</div>
            <div className="modal-message">
              Are you sure you want to delete the record for <strong>{deleteModal.visitorName}</strong>?
              This action <strong>cannot be undone</strong>.
            </div>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setDeleteModal({ show: false, logId: null, visitorName: '' })}>
                Cancel
              </button>
              <button className="btn-delete-confirm" onClick={confirmDelete}>
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModal.show && (
        <EditVisitorModal
          log={editModal.log}
          onClose={() => setEditModal({ show: false, log: null })}
          onSave={handleEditSave}
        />
      )}

      <div className="visitor-log-container">

        {/* Page Header */}
        <div className="page-header">
          <div>
            <div className="page-title">Visit Logs</div>
            <div className="page-subtitle text-light">Real-time visitor check-in & check-out records</div>
          </div>
          <button className="btn-refresh" onClick={() => fetchVisitLogs(true)} disabled={refreshing}>
            <RefreshOutlinedIcon className={`refresh-icon ${refreshing ? 'spinning' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {/* Stats Row */}
        <div className="stats-row">
          <div className="stat-card stat-total">
            <div className="stat-icon-wrap">
              <EventNoteOutlinedIcon className="stat-icon" />
            </div>
            <div className="stat-info">
              <div className="stat-value">{visitLogs.length}</div>
              <div className="stat-label">Total Visits</div>
            </div>
          </div>
          <div className="stat-card stat-active">
            <div className="stat-icon-wrap active">
              <RadioButtonUncheckedOutlinedIcon className="stat-icon" />
            </div>
            <div className="stat-info">
              <div className="stat-value">{activeCount}</div>
              <div className="stat-label">Active Now</div>
            </div>
          </div>
          <div className="stat-card stat-completed">
            <div className="stat-icon-wrap completed">
              <CheckCircleOutlineOutlinedIcon className="stat-icon" />
            </div>
            <div className="stat-info">
              <div className="stat-value">{completedCount}</div>
              <div className="stat-label">Completed</div>
            </div>
          </div>
        </div>

        {/* Main Card */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Visit Records</div>
            <div className="date-display">
              <DateRangeRoundedIcon className="date-icon" />
              <span className="date-text">{currentDate}</span>
            </div>
          </div>

          {/* Filters */}
          <div className="filter-bar">
            <div className="search-wrapper">
              <SearchOutlinedIcon className="search-icon" />
              <input
                type="text"
                className="search-input"
                placeholder="Search by visitor, purpose, host..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="filter-group">
              <FilterListOutlinedIcon className="filter-icon" />
              <select
                className="filter-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="ALL">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>

            <div className="filter-group date-filter-group">
              <DateRangeRoundedIcon className="filter-icon" />
              <input
                type="date"
                className="filter-select date-filter-input"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                title="Filter by visit date"
              />
              {dateFilter && (
                <button className="clear-date-btn" onClick={() => setDateFilter('')} title="Clear date filter">
                  ×
                </button>
              )}
            </div>
          </div>

          <div className="card-body no-padding">
            {loading ? (
              <div className="loading-state">
                <div className="loading-spinner"></div>
                <div className="loading-text">Loading visit records...</div>
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="empty-state">
                <EventNoteOutlinedIcon className="empty-icon" />
                <div className="empty-title">No visit records found</div>
                <div className="empty-subtitle">
                  {hasActiveFilters
                    ? 'Try adjusting your search, filter, or date'
                    : 'Visit logs will appear here once visitors check in'}
                </div>
              </div>
            ) : (
              <div className="table-wrapper">
                <table className="log-table">
                  <thead>
                    <tr>
                      <th><div className="th-content"><PersonOutlineIcon className="th-icon" />Visitor</div></th>
                      <th><div className="th-content"><AssignmentOutlinedIcon className="th-icon" />Purpose</div></th>
                      <th><div className="th-content"><BadgeOutlinedIcon className="th-icon" />Host</div></th>
                      <th><div className="th-content"><AccessTimeOutlinedIcon className="th-icon" />Time In</div></th>
                      <th><div className="th-content"><AccessTimeOutlinedIcon className="th-icon" />Time Out</div></th>
                      <th className="th-center">Status</th>
                      <th className="th-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.map((log) => (
                      <tr key={log.id} className={`log-row ${log.status === 'ACTIVE' ? 'row-active' : ''}`}>

                        {/* Visitor */}
                        <td>
                          <div className="visitor-cell">
                            <div className="visitor-avatar">
                              {log.visitorName?.charAt(0).toUpperCase() || '?'}
                            </div>
                            <div className="visitor-info">
                              <div className="visitor-name">{log.visitorName || '—'}</div>
                              <div className="visitor-id">{log.contactNo || '—'}</div>
                            </div>
                          </div>
                        </td>

                        {/* Purpose */}
                        <td><span className="purpose-badge">{log.purposeName || '—'}</span></td>

                        {/* Host */}
                        <td><span className="host-name">{log.hostName || '—'}</span></td>

                        {/* Time In */}
                        <td>
                          <div className="time-cell">
                            <span className="time-value">{formatTime(log.timeIn)}</span>
                            <span className="time-date">
                              {log.timeIn ? new Date(log.timeIn).toLocaleDateString('en-US', { month: 'short', day: '2-digit' }) : ''}
                            </span>
                          </div>
                        </td>

                        {/* Time Out — Check Out button if ACTIVE, actual time if COMPLETED */}
                        <td>
                          {log.status === 'ACTIVE' ? (
                            <button
                              className="btn-checkout"
                              onClick={() => handleCheckOut(log.id, log.visitorName)}
                              disabled={checkingOut === log.id}
                            >
                              <LogoutOutlinedIcon className="checkout-icon" />
                              {checkingOut === log.id ? 'Checking...' : 'Check Out'}
                            </button>
                          ) : log.timeOut ? (
                            <div className="time-cell">
                              <span className="time-value">{formatTime(log.timeOut)}</span>
                              <span className="time-date">
                                {new Date(log.timeOut).toLocaleDateString('en-US', { month: 'short', day: '2-digit' })}
                              </span>
                            </div>
                          ) : (
                            <span className="time-pending">—</span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="td-center">
                          <span className={`status-badge ${log.status === 'ACTIVE' ? 'status-active' : 'status-completed'}`}>
                            <span className="status-dot"></span>
                            {log.status === 'ACTIVE' ? 'Active' : 'Completed'}
                          </span>
                        </td>

                        {/* Action — Edit + Delete */}
                        <td className="td-center">
                          <div className="action-btn-group">
                            <button
                              className="btn-action btn-edit"
                              onClick={() => handleEdit(log)}
                              title="Edit visitor"
                            >
                              <EditOutlinedIcon className="action-icon" />
                            </button>
                            <button
                              className="btn-action btn-delete"
                              onClick={() => handleDelete(log.id, log.visitorName)}
                              title="Delete record"
                            >
                              <DeleteOutlineOutlinedIcon className="action-icon" />
                            </button>
                          </div>
                        </td>

                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Table Footer */}
          {!loading && filteredLogs.length > 0 && (
            <div className="table-footer">
              <div className="footer-left">
                Showing <strong>{Math.min(indexOfLastItem, filteredLogs.length)}</strong> of{' '}
                <strong>{filteredLogs.length}</strong> records
                {hasActiveFilters && (
                  <button className="clear-filters" onClick={() => { setSearchTerm(''); setStatusFilter('ALL'); setDateFilter(''); }}>
                    Clear filters ×
                  </button>
                )}
              </div>
              <div className="footer-right">
                <button className={`pagination-btn ${currentPage === 1 ? 'disabled' : ''}`} onClick={handlePrevPage} disabled={currentPage === 1}>
                  <NavigateBeforeIcon className="pagination-icon" />Back
                </button>
                <span className="pagination-info">Page {currentPage} of {totalPages}</span>
                <button className={`pagination-btn ${currentPage === totalPages ? 'disabled' : ''}`} onClick={handleNextPage} disabled={currentPage === totalPages}>
                  Next<NavigateNextIcon className="pagination-icon" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Tips Card */}
        <div className="tips-card">
          <div className="tips-header">
            <span className="tips-icon">ℹ️</span>
            <span className="tips-title text-primary">Quick Tips</span>
          </div>
          <div className="tips-content">
            <ul className="tips-list">
              <li>Click the Refresh button to update visit records</li>
              <li>Click "Check Out" in the Time Out column to mark a visitor as departed</li>
              <li>Use the edit icon to update visitor details</li>
              <li>Use the delete icon to permanently remove a record</li>
              <li>Use the date picker to filter visitors by a specific date</li>
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
}

export default VisitorLog;