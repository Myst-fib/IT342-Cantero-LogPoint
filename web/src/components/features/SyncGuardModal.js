import React, { useState, useEffect, useRef, useCallback } from 'react';
import '../../styles/SyncGuardModal.css';
import SearchIcon from '@mui/icons-material/Search';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import SyncIcon from '@mui/icons-material/Sync';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import CloseIcon from '@mui/icons-material/Close';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';

const API = 'http://localhost:8080';

const SyncGuardModal = ({ onClose, onSyncComplete }) => {
  const [guards, setGuards]       = useState([]);
  const [search, setSearch]       = useState('');
  const [loading, setLoading]     = useState(true);
  const [statusMap, setStatusMap] = useState({});  // guardId -> UI status
  const [syncedNames, setSyncedNames] = useState({}); // guardId -> "First Last"
  const [error, setError]         = useState('');
  const [debugLog, setDebugLog]   = useState([]);

  const guardsRef   = useRef([]);
  const intervalRef = useRef(null);
  const activeGuard = useRef(null);

  const addDebug = (msg) => {
    console.log('[SyncModal]', msg);
    setDebugLog(prev => [...prev.slice(-4), msg]);
  };

  useEffect(() => { guardsRef.current = guards; }, [guards]);
  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  // ── Fetch guard list ──────────────────────────────────────────────────────
  const fetchGuards = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/sync/guards`, { credentials: 'include' });
      const text = await res.text();
      if (!res.ok) { setError(`Load failed (${res.status}): ${text}`); return; }
      const data = JSON.parse(text);
      setGuards(data);
      guardsRef.current = data;

      // Restore any guards that are already in liveSync state
      const map = {};
      const names = {};
      data.forEach(g => {
        if (g.liveSync) {
          map[g.id] = 'SYNCED';
          names[g.id] = `${g.firstName} ${g.lastName}`;
        }
      });
      if (Object.keys(map).length) {
        setStatusMap(prev => ({ ...prev, ...map }));
        setSyncedNames(prev => ({ ...prev, ...names }));
      }
    } catch (e) {
      setError(`Network error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchGuards(); }, [fetchGuards]);

  // ── Collect logs after acceptance ─────────────────────────────────────────
  const doCollect = async (guardId) => {
    addDebug(`Collecting logs for guard ${guardId}…`);
    setStatusMap(prev => ({ ...prev, [guardId]: 'COLLECTING' }));

    try {
      const res = await fetch(`${API}/api/sync/logs/${guardId}`, { credentials: 'include' });
      const text = await res.text();
      addDebug(`/logs response: ${res.status} — ${text.slice(0, 120)}`);

      if (!res.ok) {
        setError(`Collect failed (${res.status}): ${text}`);
        setStatusMap(prev => ({ ...prev, [guardId]: 'COLLECT_FAILED' }));
        return;
      }

      const logs = JSON.parse(text);
      addDebug(`Got ${logs.length} log(s). Activating live sync.`);

      const guard = guardsRef.current.find(g => g.id === guardId);
      const guardName = guard ? `${guard.firstName} ${guard.lastName}` : 'Guard';

      setStatusMap(prev => ({ ...prev, [guardId]: 'SYNCED' }));
      setSyncedNames(prev => ({ ...prev, [guardId]: guardName }));

      // Tell backend to activate live sync & clear the pending request
      await fetch(`${API}/api/sync/activate/${guardId}`, { method: 'POST', credentials: 'include' });

      if (onSyncComplete) onSyncComplete(logs, guard, guardId);

    } catch (e) {
      addDebug(`Collect exception: ${e.message}`);
      setError(`Collect error: ${e.message}`);
      setStatusMap(prev => ({ ...prev, [guardId]: 'COLLECT_FAILED' }));
    }
  };

  // ── Polling ────────────────────────────────────────────────────────────────
  const startPolling = (guardId) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    activeGuard.current = guardId;
    addDebug(`Polling status for guard ${guardId}…`);

    intervalRef.current = setInterval(async () => {
      const gId = activeGuard.current;
      if (!gId) return;
      try {
        const res = await fetch(`${API}/api/sync/status/${gId}`, { credentials: 'include' });
        if (!res.ok) return;
        const data = await res.json();
        addDebug(`Poll result for ${gId}: ${data.status}`);

        if (data.status === 'ACCEPTED') {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
          activeGuard.current = null;
          await doCollect(gId);
        } else if (data.status === 'DECLINED') {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
          activeGuard.current = null;
          setStatusMap(prev => ({ ...prev, [gId]: 'DECLINED' }));
          addDebug(`Guard ${gId} declined.`);
        }
      } catch (e) {
        addDebug(`Poll error: ${e.message}`);
      }
    }, 2500);
  };

  // ── Send sync request ──────────────────────────────────────────────────────
  const handleSyncRequest = async (guardId) => {
    setError('');
    setDebugLog([]);
    setStatusMap(prev => ({ ...prev, [guardId]: 'PENDING' }));
    addDebug(`Sending request to guard ${guardId}…`);

    try {
      const res = await fetch(`${API}/api/sync/request/${guardId}`, {
        method: 'POST', credentials: 'include',
      });
      const text = await res.text();
      if (!res.ok) {
        setError(`Request failed (${res.status}): ${text}`);
        setStatusMap(prev => ({ ...prev, [guardId]: undefined }));
        return;
      }
      addDebug(`Request sent. Starting poll…`);
      startPolling(guardId);
    } catch (e) {
      setError(`Network error: ${e.message}`);
      setStatusMap(prev => ({ ...prev, [guardId]: undefined }));
    }
  };

  // ── Deactivate (stop live sync for a guard) ───────────────────────────────
  const handleDeactivate = async (guardId) => {
    await fetch(`${API}/api/sync/deactivate/${guardId}`, { method: 'POST', credentials: 'include' });
    setStatusMap(prev => ({ ...prev, [guardId]: undefined }));
    setSyncedNames(prev => { const n = { ...prev }; delete n[guardId]; return n; });
    // Tell parent to clear this guard's data
    if (onSyncComplete) onSyncComplete(null, null, guardId);
  };

  const filtered = guards.filter(g =>
    `${g.firstName} ${g.lastName} ${g.email}`.toLowerCase().includes(search.toLowerCase())
  );

  // ── Status chip ────────────────────────────────────────────────────────────
  const getStatusChip = (guard) => {
    const st = statusMap[guard.id];
    if (st === 'PENDING')        return <span className="sync-chip pending"><HourglassEmptyIcon className="chip-icon" />Waiting...</span>;
    if (st === 'ACCEPTED' || st === 'COLLECTING') return <span className="sync-chip accepted"><SyncIcon className="chip-icon spin-slow" />Collecting</span>;
    if (st === 'DECLINED')       return <span className="sync-chip declined"><CloseIcon className="chip-icon" />Declined</span>;
    if (st === 'SYNCED')         return <span className="sync-chip synced"><CheckCircleOutlineIcon className="chip-icon" />Live Sync</span>;
    if (st === 'COLLECT_FAILED') return <span className="sync-chip declined"><CloseIcon className="chip-icon" />Failed</span>;
    return null;
  };

  // ── Action button ──────────────────────────────────────────────────────────
  const getSyncButton = (guard) => {
    const st = statusMap[guard.id];
    const name = syncedNames[guard.id] || guard.firstName;

    if (st === 'PENDING') {
      return <button className="sync-btn waiting" disabled><HourglassEmptyIcon className="btn-icon-sm" /> Waiting...</button>;
    }
    if (st === 'ACCEPTED' || st === 'COLLECTING') {
      return <button className="sync-btn collecting" disabled><SyncIcon className="btn-icon-sm spin" /> Collecting...</button>;
    }
    if (st === 'DECLINED' || st === 'COLLECT_FAILED') {
      return <button className="sync-btn retry" onClick={() => handleSyncRequest(guard.id)}><SyncIcon className="btn-icon-sm" /> Retry</button>;
    }
    if (st === 'SYNCED') {
      return (
        <div className="sync-btn-group">
          <span className="sync-btn-synced-label">
            <CheckCircleOutlineIcon className="btn-icon-sm" /> Synced · {name}
          </span>
          <button className="sync-btn-stop" onClick={() => handleDeactivate(guard.id)} title="Stop live sync">
            <CloseIcon style={{ fontSize: 14 }} />
          </button>
        </div>
      );
    }
    const anyActive = Object.values(statusMap).some(s => s === 'PENDING' || s === 'COLLECTING' || s === 'ACCEPTED');
    return (
      <button className="sync-btn primary" onClick={() => handleSyncRequest(guard.id)} disabled={anyActive}>
        <SyncIcon className="btn-icon-sm" /> Sync Logs
      </button>
    );
  };

  return (
    <div className="sgm-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sgm-modal">
        <div className="sgm-header">
          <div className="sgm-header-left">
            <ShieldOutlinedIcon className="sgm-header-icon" />
            <div>
              <div className="sgm-title">Sync Guard Logs</div>
              <div className="sgm-subtitle">Select a security guard to request their visitor log data</div>
            </div>
          </div>
          <button className="sgm-close" onClick={onClose}><CloseIcon /></button>
        </div>

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

        {error && <div className="sgm-error">⚠ {error}</div>}

        {debugLog.length > 0 && (
          <div className="sgm-debug">
            {debugLog.map((msg, i) => <div key={i}>› {msg}</div>)}
          </div>
        )}

        <div className="sgm-list">
          {loading ? (
            <div className="sgm-empty"><div className="sgm-spinner" /><span>Loading security guards…</span></div>
          ) : filtered.length === 0 ? (
            <div className="sgm-empty">
              <PersonOutlineIcon className="sgm-empty-icon" />
              <span>{search ? 'No guards match your search.' : 'No security guards found.'}</span>
            </div>
          ) : (
            filtered.map(guard => (
              <div key={guard.id} className={`sgm-guard-row ${statusMap[guard.id] === 'DECLINED' ? 'declined' : ''} ${statusMap[guard.id] === 'SYNCED' ? 'synced-row' : ''}`}>
                <div className={`sgm-guard-avatar ${statusMap[guard.id] === 'SYNCED' ? 'avatar-live' : ''}`}>
                  {guard.firstName?.charAt(0)?.toUpperCase() || 'G'}
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

        <div className="sgm-footer">
          <span className="sgm-footer-text">{filtered.length} guard{filtered.length !== 1 ? 's' : ''} found</span>
          <button className="sgm-cancel" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default SyncGuardModal;