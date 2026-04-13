import React, { useState, useEffect, useRef, useCallback } from 'react';
import '../../styles/SyncGuardModal.css';
import SearchIcon          from '@mui/icons-material/Search';
import ShieldOutlinedIcon  from '@mui/icons-material/ShieldOutlined';
import SyncIcon            from '@mui/icons-material/Sync';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HourglassEmptyIcon  from '@mui/icons-material/HourglassEmpty';
import CloseIcon           from '@mui/icons-material/Close';
import PersonOutlineIcon   from '@mui/icons-material/PersonOutline';
import BlockIcon           from '@mui/icons-material/Block';

const API = 'http://localhost:8080';

// ─── small inline confirm dialog ─────────────────────────────────────────────
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

const SyncGuardModal = ({ onClose, onSyncComplete }) => {
  const [guards,      setGuards]      = useState([]);
  const [search,      setSearch]      = useState('');
  const [loading,     setLoading]     = useState(true);
  // guardId → 'PENDING' | 'COLLECTING' | 'SYNCED' | 'CANCELLED' | 'COLLECT_FAILED'
  const [statusMap,   setStatusMap]   = useState({});
  // guardId → "First Last"
  const [syncedNames, setSyncedNames] = useState({});
  // guardId → frozen snapshot (kept after cancel so badge still shows)
  const [snapshots,   setSnapshots]   = useState({});
  const [error,       setError]       = useState('');
  // guardId awaiting cancel confirmation (null = no dialog open)
  const [confirmFor,  setConfirmFor]  = useState(null);

  const guardsRef   = useRef([]);
  const pollRef     = useRef(null);   // request-phase polling interval
  const liveRef     = useRef(null);   // live-sync polling interval
  const activeGuard = useRef(null);

  const addStatus = (gId, st) =>
    setStatusMap(prev => ({ ...prev, [gId]: st }));

  // ── Fetch guard list ──────────────────────────────────────────────────────
  const fetchGuards = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${API}/api/sync/guards`, { credentials: 'include' });
      const text = await res.text();
      if (!res.ok) { setError(`Load failed (${res.status}): ${text}`); return; }
      const data = JSON.parse(text);
      setGuards(data);
      guardsRef.current = data;

      // Restore live-sync state from server
      const restoredStatus = {};
      const restoredNames  = {};
      data.forEach(g => {
        if (g.liveSync) {
          restoredStatus[g.id] = 'SYNCED';
          restoredNames[g.id]  = `${g.firstName} ${g.lastName}`;
        }
      });
      if (Object.keys(restoredStatus).length) {
        setStatusMap(prev => ({ ...prev, ...restoredStatus }));
        setSyncedNames(prev => ({ ...prev, ...restoredNames }));
      }
    } catch (e) {
      setError(`Network error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchGuards(); }, [fetchGuards]);

  // Cleanup on unmount
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
          addStatus(gId, 'DECLINED');
        }
      } catch { /* silent */ }
    }, 2500);
  };

  // ── Collect logs after acceptance ─────────────────────────────────────────
  const doCollect = async (guardId) => {
    addStatus(guardId, 'COLLECTING');
    try {
      const res  = await fetch(`${API}/api/sync/logs/${guardId}`, { credentials: 'include' });
      const text = await res.text();
      if (!res.ok) { addStatus(guardId, 'COLLECT_FAILED'); return; }

      const logs  = JSON.parse(text);
      const guard = guardsRef.current.find(g => g.id === guardId);
      const name  = guard ? `${guard.firstName} ${guard.lastName}` : 'Guard';

      // Save snapshot so it survives cancel
      setSnapshots(prev => ({ ...prev, [guardId]: { logs, guard } }));

      addStatus(guardId, 'SYNCED');
      setSyncedNames(prev => ({ ...prev, [guardId]: name }));

      // Activate live feed on backend
      await fetch(`${API}/api/sync/activate/${guardId}`, {
        method: 'POST', credentials: 'include',
      });

      startLivePoll(guardId);

      if (onSyncComplete) onSyncComplete(logs, guard, guardId, false);
    } catch {
      addStatus(guardId, 'COLLECT_FAILED');
    }
  };

  // ── Live poll: re-fetch every 10 s while SYNCED ───────────────────────────
  // Reflects new visitors AND edits to host/purpose automatically.
  // Stops immediately when /live returns 404 (i.e. after cancel).
  const startLivePoll = (guardId) => {
    if (liveRef.current) clearInterval(liveRef.current);

    liveRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${API}/api/sync/live/${guardId}`, { credentials: 'include' });

        // 404 means backend cancelled the sync → stop polling, keep frozen snapshot
        if (res.status === 404) {
          clearInterval(liveRef.current);
          liveRef.current = null;
          return;
        }
        if (!res.ok) return;

        const freshLogs = await res.json();
        const snap = snapshots[guardId];

        // Update snapshot silently (no banner) and push to parent
        setSnapshots(prev => ({ ...prev, [guardId]: { ...prev[guardId], logs: freshLogs } }));
        if (onSyncComplete) onSyncComplete(freshLogs, snap?.guard, guardId, false);
      } catch { /* silent */ }
    }, 10000);
  };

  // ── Send sync request ─────────────────────────────────────────────────────
  const handleSyncRequest = async (guardId) => {
    setError('');
    addStatus(guardId, 'PENDING');
    try {
      const res  = await fetch(`${API}/api/sync/request/${guardId}`, {
        method: 'POST', credentials: 'include',
      });
      const text = await res.text();
      if (!res.ok) {
        addStatus(guardId, undefined);
        setError(`Request failed (${res.status}): ${text}`);
        return;
      }
      startPolling(guardId);
    } catch (e) {
      setError(`Network error: ${e.message}`);
      addStatus(guardId, undefined);
    }
  };

  // ── Cancel flow: show confirm dialog first ────────────────────────────────
  const handleCancelClick = (guardId) => {
    setConfirmFor(guardId);
  };

  const handleCancelConfirmed = async () => {
    const guardId = confirmFor;
    setConfirmFor(null);

    // Stop live polling immediately
    if (liveRef.current) { clearInterval(liveRef.current); liveRef.current = null; }
    if (pollRef.current)  { clearInterval(pollRef.current);  pollRef.current = null; }
    activeGuard.current = null;

    // Tell backend to stop live feed (data not deleted there either)
    try {
      await fetch(`${API}/api/sync/cancel/${guardId}`, {
        method: 'POST', credentials: 'include',
      });
    } catch { /* silent */ }

    // Mark as CANCELLED – NOT undefined, so it can't be re-synced from this session
    addStatus(guardId, 'CANCELLED');

    // Notify parent: pass isCancelled=true so it keeps the frozen snapshot
    const snap = snapshots[guardId];
    if (onSyncComplete) onSyncComplete(snap?.logs ?? null, snap?.guard ?? null, guardId, true);
  };

  const handleCancelDismissed = () => setConfirmFor(null);

  // ── Filtered list ─────────────────────────────────────────────────────────
  const filtered = guards.filter(g =>
    `${g.firstName} ${g.lastName} ${g.email}`.toLowerCase().includes(search.toLowerCase())
  );

  // ── Status chip ───────────────────────────────────────────────────────────
  const getStatusChip = (guard) => {
    const st = statusMap[guard.id];
    if (st === 'PENDING')
      return <span className="sync-chip pending"><HourglassEmptyIcon className="chip-icon" /> Waiting…</span>;
    if (st === 'COLLECTING')
      return <span className="sync-chip accepted"><SyncIcon className="chip-icon spin-slow" /> Collecting</span>;
    if (st === 'SYNCED')
      return <span className="sync-chip synced"><CheckCircleOutlineIcon className="chip-icon" /> Live Sync</span>;
    if (st === 'CANCELLED')
      return <span className="sync-chip cancelled"><BlockIcon className="chip-icon" /> Cancelled</span>;
    if (st === 'COLLECT_FAILED')
      return <span className="sync-chip declined"><CloseIcon className="chip-icon" /> Failed</span>;
    return null;
  };

  // ── Action button ─────────────────────────────────────────────────────────
  const getSyncButton = (guard) => {
    const st   = statusMap[guard.id];
    const name = syncedNames[guard.id] || guard.firstName;

    if (st === 'PENDING')
      return <button className="sync-btn waiting" disabled><HourglassEmptyIcon className="btn-icon-sm" /> Waiting…</button>;

    if (st === 'COLLECTING')
      return <button className="sync-btn collecting" disabled><SyncIcon className="btn-icon-sm spin" /> Collecting…</button>;

    if (st === 'COLLECT_FAILED')
      return (
        <button className="sync-btn retry" onClick={() => handleSyncRequest(guard.id)}>
          <SyncIcon className="btn-icon-sm" /> Retry
        </button>
      );

    // ── SYNCED: show label + Cancel button ──────────────────────────────────
    if (st === 'SYNCED')
      return (
        <div className="sync-btn-group">
          <span className="sync-btn-synced-label">
            <CheckCircleOutlineIcon className="btn-icon-sm" /> Synced — {name}
          </span>
          <button
            className="sync-btn-cancel-sync"
            onClick={() => handleCancelClick(guard.id)}
            title="Cancel live sync"
          >
            Cancel
          </button>
        </div>
      );

    // ── CANCELLED: show frozen badge, no action allowed ─────────────────────
    if (st === 'CANCELLED')
      return (
        <span className="sync-btn-cancelled-label">
          <BlockIcon className="btn-icon-sm" /> Sync Cancelled
        </span>
      );

    // Default: not yet synced
    const anyActive = Object.values(statusMap).some(
      s => s === 'PENDING' || s === 'COLLECTING' || s === 'SYNCED'
    );
    return (
      <button
        className="sync-btn primary"
        onClick={() => handleSyncRequest(guard.id)}
        disabled={anyActive}
      >
        <SyncIcon className="btn-icon-sm" /> Sync Logs
      </button>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div
      className="sgm-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Confirm dialog sits above everything */}
      {confirmFor !== null && (
        <ConfirmDialog
          message="Are you sure you want to cancel the sync? The live feed will stop, but the data already synced will remain visible."
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
              <div className="sgm-subtitle">Select a security guard to sync their visitor log data</div>
            </div>
          </div>
          <button className="sgm-close" onClick={onClose}><CloseIcon /></button>
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
            filtered.map(guard => {
              const st = statusMap[guard.id];
              return (
                <div
                  key={guard.id}
                  className={[
                    'sgm-guard-row',
                    st === 'SYNCED'    ? 'synced-row'    : '',
                    st === 'CANCELLED' ? 'cancelled-row' : '',
                    st === 'DECLINED'  ? 'declined'      : '',
                  ].filter(Boolean).join(' ')}
                >
                  <div className={`sgm-guard-avatar${st === 'SYNCED' ? ' avatar-live' : ''}`}>
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
              );
            })
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