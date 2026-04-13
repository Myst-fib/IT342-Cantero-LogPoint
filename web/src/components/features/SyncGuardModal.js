import React, { useState, useEffect, useRef, useCallback } from 'react';
import '../../styles/SyncGuardModal.css';
import SearchIcon             from '@mui/icons-material/Search';
import ShieldOutlinedIcon     from '@mui/icons-material/ShieldOutlined';
import SyncIcon               from '@mui/icons-material/Sync';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HourglassEmptyIcon     from '@mui/icons-material/HourglassEmpty';
import CloseIcon              from '@mui/icons-material/Close';
import PersonOutlineIcon      from '@mui/icons-material/PersonOutline';
import BlockIcon              from '@mui/icons-material/Block';

const API = 'http://localhost:8080';

// ── localStorage keys ─────────────────────────────────────────────────────────
const LS_GUARD_ID   = 'logpoint_synced_guard_id';
const LS_GUARD_INFO = 'logpoint_synced_guard_info';
const LS_LOGS       = 'logpoint_synced_logs';
const LS_STATUS     = 'logpoint_sync_status';

export const clearSyncStorage = () => {
  [LS_GUARD_ID, LS_GUARD_INFO, LS_LOGS, LS_STATUS].forEach(k => {
    try { localStorage.removeItem(k); } catch { /* */ }
  });
};

const lsGet = (key, fallback = null) => {
  try { const v = localStorage.getItem(key); return v !== null ? JSON.parse(v) : fallback; }
  catch { return fallback; }
};
const lsSet = (key, val) => {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch { /* */ }
};

// ── Confirm dialog ─────────────────────────────────────────────────────────────
const ConfirmDialog = ({ message, onConfirm, onCancel }) => (
  <div className="sgm-confirm-overlay">
    <div className="sgm-confirm-box">
      <p className="sgm-confirm-msg">{message}</p>
      <div className="sgm-confirm-actions">
        <button className="sgm-confirm-btn cancel" onClick={onCancel}>No, keep it</button>
        <button className="sgm-confirm-btn confirm" onClick={onConfirm}>Yes, cancel sync</button>
      </div>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
const SyncGuardModal = ({ onClose, onSyncComplete }) => {
  const [guards,         setGuards]         = useState([]);
  const [search,         setSearch]         = useState('');
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState('');
  const [confirmFor,     setConfirmFor]     = useState(null);

  // ── Persistent single-guard state (restored from localStorage) ────────────
  const [syncedGuardId,   setSyncedGuardId]   = useState(() => lsGet(LS_GUARD_ID));
  const [syncedGuardInfo, setSyncedGuardInfo] = useState(() => lsGet(LS_GUARD_INFO));
  const [syncStatus,      setSyncStatus]      = useState(() => lsGet(LS_STATUS));
  // Transient status only for current mount (PENDING / COLLECTING flow)
  const [transientStatus, setTransientStatus] = useState(null);

  const guardsRef   = useRef([]);
  const pollRef     = useRef(null);
  const liveRef     = useRef(null);
  const activeGuard = useRef(null);

  // ── Persist helpers ───────────────────────────────────────────────────────
  const saveSync = (id, info, status, logs) => {
    if (id     !== undefined) lsSet(LS_GUARD_ID,   id);
    if (info   !== undefined) lsSet(LS_GUARD_INFO,  info);
    if (status !== undefined) lsSet(LS_STATUS,      status);
    if (logs   !== undefined) lsSet(LS_LOGS,        logs);
  };

  const wipeSync = useCallback(() => {
    clearSyncStorage();
    setSyncedGuardId(null);
    setSyncedGuardInfo(null);
    setSyncStatus(null);
    setTransientStatus(null);
  }, []);

  // ── Fetch guard list ───────────────────────────────────────────────────────
  const fetchGuards = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${API}/api/sync/guards`, { credentials: 'include' });
      const text = await res.text();
      if (!res.ok) { setError(`Load failed (${res.status}): ${text}`); return; }
      const data = JSON.parse(text);
      setGuards(data);
      guardsRef.current = data;
    } catch (e) {
      setError(`Network error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchGuards(); }, [fetchGuards]);

  // If modal opens while status is SYNCED, just restart the live poll.
  // Do NOT call onSyncComplete here — that's what was triggering the
  // "appears to re-sync when opened" bug.
  useEffect(() => {
    if (syncStatus === 'SYNCED' && syncedGuardId) {
      startLivePoll(syncedGuardId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => () => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (liveRef.current) clearInterval(liveRef.current);
  }, []);

  // ── Poll for guard acceptance ─────────────────────────────────────────────
  const startPolling = (guardId) => {
    if (pollRef.current) clearInterval(pollRef.current);
    activeGuard.current = guardId;

    pollRef.current = setInterval(async () => {
      const gId = activeGuard.current;
      if (!gId) return;
      try {
        const res  = await fetch(`${API}/api/sync/status/${gId}`, { credentials: 'include' });
        if (!res.ok) return;
        const data = await res.json();

        if (data.status === 'ACCEPTED') {
          clearInterval(pollRef.current);
          pollRef.current = null;
          activeGuard.current = null;
          await doCollect(gId);
        } else if (data.status === 'DECLINED') {
          clearInterval(pollRef.current);
          pollRef.current = null;
          activeGuard.current = null;
          setTransientStatus(null);
          wipeSync();
        }
      } catch { /* silent */ }
    }, 2500);
  };

  // ── Collect logs after acceptance ─────────────────────────────────────────
  const doCollect = async (guardId) => {
    setTransientStatus('COLLECTING');
    try {
      const res  = await fetch(`${API}/api/sync/logs/${guardId}`, { credentials: 'include' });
      const text = await res.text();
      if (!res.ok) { setTransientStatus(null); return; }

      const logs  = JSON.parse(text);
      const guard = guardsRef.current.find(g => g.id === guardId) || lsGet(LS_GUARD_INFO);

      await fetch(`${API}/api/sync/activate/${guardId}`, {
        method: 'POST', credentials: 'include',
      });

      setSyncedGuardId(guardId);
      setSyncedGuardInfo(guard);
      setSyncStatus('SYNCED');
      setTransientStatus(null);
      saveSync(guardId, guard, 'SYNCED', logs);

      startLivePoll(guardId);
      if (onSyncComplete) onSyncComplete(logs, guard, guardId, false);
    } catch {
      setTransientStatus(null);
    }
  };

  // ── Live poll every 10 s ──────────────────────────────────────────────────
  // This is what keeps the guard logs up to date automatically —
  // no manual refresh needed.
  const startLivePoll = (guardId) => {
    if (liveRef.current) clearInterval(liveRef.current);

    liveRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${API}/api/sync/live/${guardId}`, { credentials: 'include' });
        if (res.status === 404) {
          clearInterval(liveRef.current);
          liveRef.current = null;
          return;
        }
        if (!res.ok) return;

        const freshLogs = await res.json();
        lsSet(LS_LOGS, freshLogs);
        const guard = lsGet(LS_GUARD_INFO);
        if (onSyncComplete) onSyncComplete(freshLogs, guard, guardId, false);
      } catch { /* silent */ }
    }, 10000);
  };

  // ── Send sync request ─────────────────────────────────────────────────────
  const handleSyncRequest = async (guardId) => {
    setError('');
    setTransientStatus('PENDING');
    const guard = guardsRef.current.find(g => g.id === guardId);
    setSyncedGuardId(guardId);
    setSyncedGuardInfo(guard);
    saveSync(guardId, guard, null, undefined);

    try {
      const res  = await fetch(`${API}/api/sync/request/${guardId}`, {
        method: 'POST', credentials: 'include',
      });
      const text = await res.text();
      if (!res.ok) {
        setTransientStatus(null);
        wipeSync();
        setError(`Request failed (${res.status}): ${text}`);
        return;
      }
      startPolling(guardId);
    } catch (e) {
      setTransientStatus(null);
      wipeSync();
      setError(`Network error: ${e.message}`);
    }
  };

  // ── Cancel ────────────────────────────────────────────────────────────────
  const handleCancelClick = () => setConfirmFor(syncedGuardId);

  const handleCancelConfirmed = async () => {
    const guardId = confirmFor;
    setConfirmFor(null);

    if (liveRef.current) { clearInterval(liveRef.current); liveRef.current = null; }
    if (pollRef.current)  { clearInterval(pollRef.current);  pollRef.current = null; }
    activeGuard.current = null;

    try {
      await fetch(`${API}/api/sync/cancel/${guardId}`, {
        method: 'POST', credentials: 'include',
      });
    } catch { /* silent */ }

    const frozenLogs  = lsGet(LS_LOGS, []);
    const frozenGuard = lsGet(LS_GUARD_INFO);

    setSyncStatus('CANCELLED');
    setTransientStatus(null);
    saveSync(guardId, frozenGuard, 'CANCELLED', frozenLogs);

    if (onSyncComplete) onSyncComplete(frozenLogs, frozenGuard, guardId, true);
  };

  const handleCancelDismissed = () => setConfirmFor(null);

  // ── Resync ────────────────────────────────────────────────────────────────
  const handleResync = () => {
    const guardId = syncedGuardId;
    setSyncStatus(null);
    lsSet(LS_STATUS, null);
    handleSyncRequest(guardId);
  };

  // ── Clear all ─────────────────────────────────────────────────────────────
  const handleClearAll = () => {
    if (liveRef.current) { clearInterval(liveRef.current); liveRef.current = null; }
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    activeGuard.current = null;
    if (syncedGuardId) {
      fetch(`${API}/api/sync/cancel/${syncedGuardId}`, { method: 'POST', credentials: 'include' })
        .catch(() => {});
      if (onSyncComplete) onSyncComplete(null, null, syncedGuardId, false, true);
    }
    wipeSync();
  };

  // ── Derived helpers ───────────────────────────────────────────────────────
  const isSynced    = (g) => g.id === syncedGuardId && syncStatus   === 'SYNCED';
  const isCancelled = (g) => g.id === syncedGuardId && syncStatus   === 'CANCELLED';
  const isPending   = (g) => g.id === syncedGuardId && transientStatus === 'PENDING';
  const isCollecting= (g) => g.id === syncedGuardId && transientStatus === 'COLLECTING';
  const isBlocked   = (g) =>
    g.id !== syncedGuardId &&
    (transientStatus === 'PENDING' || transientStatus === 'COLLECTING' || syncStatus === 'SYNCED');

  // ── Status chip ───────────────────────────────────────────────────────────
  const getStatusChip = (guard) => {
    if (isPending(guard))
      return <span className="sync-chip pending"><HourglassEmptyIcon className="chip-icon" /> Waiting…</span>;
    if (isCollecting(guard))
      return <span className="sync-chip accepted"><SyncIcon className="chip-icon spin-slow" /> Collecting</span>;
    if (isSynced(guard))
      return <span className="sync-chip synced"><CheckCircleOutlineIcon className="chip-icon" /> Live Sync</span>;
    if (isCancelled(guard))
      return <span className="sync-chip cancelled"><BlockIcon className="chip-icon" /> Cancelled</span>;
    return null;
  };

  // ── Action button ─────────────────────────────────────────────────────────
  const getSyncButton = (guard) => {
    if (isPending(guard))
      return <button className="sync-btn waiting" disabled><HourglassEmptyIcon className="btn-icon-sm" /> Waiting…</button>;
    if (isCollecting(guard))
      return <button className="sync-btn collecting" disabled><SyncIcon className="btn-icon-sm spin" /> Collecting…</button>;

    if (isSynced(guard)) {
      const name = syncedGuardInfo
        ? `${syncedGuardInfo.firstName} ${syncedGuardInfo.lastName}`
        : guard.firstName;
      return (
        <div className="sync-btn-group">
          <span className="sync-btn-synced-label">
            <CheckCircleOutlineIcon className="btn-icon-sm" /> Synced — {name}
          </span>
          <button className="sync-btn-cancel-sync" onClick={handleCancelClick}>Cancel</button>
        </div>
      );
    }

    if (isCancelled(guard))
      return (
        <div className="sync-btn-group">
          <span className="sync-btn-cancelled-label">
            <BlockIcon className="btn-icon-sm" /> Sync Cancelled
          </span>
          <button className="sync-btn-resync" onClick={handleResync}>
            <SyncIcon className="btn-icon-sm" /> Resync
          </button>
        </div>
      );

    if (isBlocked(guard))
      return (
        <button className="sync-btn primary" disabled title="Cancel the current sync first">
          <SyncIcon className="btn-icon-sm" /> Sync Logs
        </button>
      );

    return (
      <button className="sync-btn primary" onClick={() => handleSyncRequest(guard.id)}>
        <SyncIcon className="btn-icon-sm" /> Sync Logs
      </button>
    );
  };

  const filtered = guards.filter(g =>
    `${g.firstName} ${g.lastName} ${g.email}`.toLowerCase().includes(search.toLowerCase())
  );

  const guardName = syncedGuardInfo
    ? `${syncedGuardInfo.firstName} ${syncedGuardInfo.lastName}`
    : null;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="sgm-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      {confirmFor !== null && (
        <ConfirmDialog
          message="Are you sure you want to cancel the sync? The live feed will stop, but data already synced will remain visible."
          onConfirm={handleCancelConfirmed}
          onCancel={handleCancelDismissed}
        />
      )}

      <div className="sgm-modal">
        {/* Header */}
        <div className="sgm-header">
          <div className="sgm-header-left">
            <ShieldOutlinedIcon className="sgm-header-icon" />
            <div>
              <div className="sgm-title">Sync Guard Logs</div>
              <div className="sgm-subtitle">
                {syncStatus === 'SYNCED' && guardName
                  ? `Live syncing with ${guardName} · auto-updates every 10 s`
                  : 'Select a security guard to sync their visitor log data'}
              </div>
            </div>
          </div>
          <div className="sgm-header-right">
            {(syncStatus === 'SYNCED' || syncStatus === 'CANCELLED') && (
              <button className="sgm-clear-btn" onClick={handleClearAll}>Clear</button>
            )}
            <button className="sgm-close" onClick={onClose}><CloseIcon /></button>
          </div>
        </div>

        {/* Search */}
        <div className="sgm-search-wrap">
          <SearchIcon className="sgm-search-icon" />
          <input
            className="sgm-search"
            placeholder="Search by name or email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            autoFocus
          />
        </div>

        {/* 1-guard limit notice */}
        {(syncStatus === 'SYNCED' || transientStatus) && (
          <div className="sgm-info-banner">
            <SyncIcon style={{ fontSize: 14, flexShrink: 0 }} />
            Only one guard can be synced at a time. Cancel the current sync to select another.
          </div>
        )}

        {error && <div className="sgm-error">{error}</div>}

        {/* Guard list */}
        <div className="sgm-list">
          {loading ? (
            <div className="sgm-empty">
              <div className="sgm-spinner" />
              <span>Loading security guards…</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="sgm-empty">
              <PersonOutlineIcon className="sgm-empty-icon" />
              <span>{search ? 'No guards match your search.' : 'No security guards found.'}</span>
            </div>
          ) : (
            filtered.map(guard => (
              <div
                key={guard.id}
                className={[
                  'sgm-guard-row',
                  isSynced(guard)    ? 'synced-row'    : '',
                  isCancelled(guard) ? 'cancelled-row' : '',
                  isBlocked(guard)   ? 'blocked-row'   : '',
                ].filter(Boolean).join(' ')}
              >
                <div className={`sgm-guard-avatar${isSynced(guard) ? ' avatar-live' : ''}`}>
                  {guard.firstName?.charAt(0).toUpperCase() || 'G'}
                </div>
                <div className="sgm-guard-info">
                  <div className="sgm-guard-name">
                    {guard.firstName} {guard.lastName}
                    {getStatusChip(guard)}
                  </div>
                  <div className="sgm-guard-email">{guard.email}</div>
                </div>
                <div className="sgm-guard-action">{getSyncButton(guard)}</div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="sgm-footer">
          <span className="sgm-footer-text">
            {filtered.length} guard{filtered.length !== 1 ? 's' : ''} found
          </span>
          <button className="sgm-cancel" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default SyncGuardModal;