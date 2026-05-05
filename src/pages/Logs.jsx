import { useState, useEffect, useCallback } from 'react';
import { useApp } from '../contexts/AppContext';
import toast from 'react-hot-toast';

const LOG_TYPES = [
  { value: 'all', label: 'All' },
  { value: 'info', label: 'Info' },
  { value: 'success', label: 'Success' },
  { value: 'warning', label: 'Warning' },
  { value: 'error', label: 'Error' },
];

const typeStyles = {
  info: { dot: 'bg-telegram-accent', text: 'text-telegram-accent' },
  success: { dot: 'bg-telegram-green', text: 'text-telegram-green' },
  warning: { dot: 'bg-telegram-orange', text: 'text-telegram-orange' },
  error: { dot: 'bg-telegram-red', text: 'text-telegram-red' },
};

export default function Logs() {
  const { api } = useApp();
  const [logs, setLogs] = useState([]);
  const [filter, setFilter] = useState('all');

  const loadLogs = useCallback(async () => {
    const data = await api.getLogs({ type: filter, limit: 500 });
    setLogs(data);
  }, [api, filter]);

  useEffect(() => { loadLogs(); }, [loadLogs]);

  const handleClear = async () => {
    if (!confirm('Clear all logs?')) return;
    await api.clearLogs();
    setLogs([]);
    toast.success('Logs cleared');
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-telegram-text">Activity Logs</h1>
          <p className="text-telegram-textSec text-sm">{logs.length} log entries</p>
        </div>
        <div className="flex gap-2">
          <button onClick={loadLogs} className="btn-secondary text-xs">Refresh</button>
          <button onClick={handleClear} className="btn-danger text-xs" disabled={logs.length === 0}>Clear All</button>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        {LOG_TYPES.map((t) => (
          <button key={t.value} onClick={() => setFilter(t.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === t.value ? 'bg-telegram-blue text-white' : 'bg-telegram-panel text-telegram-textSec hover:text-telegram-text'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {logs.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-telegram-textSec text-sm">No logs yet.</p>
        </div>
      ) : (
        <div className="space-y-1">
          {logs.map((log) => {
            const style = typeStyles[log.type] || typeStyles.info;
            return (
              <div key={log.id} className="card py-2.5 px-4 flex items-start gap-3">
                <div className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${style.dot}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium ${style.text}`}>{log.type.toUpperCase()}</span>
                    <span className="text-xs text-telegram-text">{log.message}</span>
                  </div>
                  {log.details && <p className="text-[10px] text-telegram-textSec mt-0.5 truncate">{log.details}</p>}
                </div>
                <span className="text-[10px] text-telegram-textSec shrink-0">{log.created_at}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
