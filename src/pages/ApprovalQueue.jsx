import { useState, useEffect, useCallback } from 'react';
import { useApp } from '../contexts/AppContext';
import { getMessageTypeInfo } from '../utils/scheduler';
import toast from 'react-hot-toast';

export default function ApprovalQueue() {
  const { api, refreshStats } = useApp();
  const [queue, setQueue] = useState([]);
  const [filter, setFilter] = useState('all');
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');

  const loadQueue = useCallback(async () => {
    const data = await api.getApprovalQueue(filter);
    setQueue(data);
  }, [api, filter]);

  useEffect(() => { loadQueue(); }, [loadQueue]);

  const handleApprove = async (id) => {
    await api.approveStep(id);
    await api.addLog({ type: 'success', message: `Message #${id} approved` });
    await loadQueue();
    await refreshStats();
    toast.success('Message approved');
  };

  const handleReject = async (id) => {
    await api.rejectStep(id);
    await api.addLog({ type: 'warning', message: `Message #${id} rejected` });
    await loadQueue();
    await refreshStats();
    toast.success('Message rejected');
  };

  const handleApproveAll = async () => {
    if (!confirm('Approve all draft messages? (Simulation Mode only)')) return;
    await api.approveAllDraft();
    await api.addLog({ type: 'success', message: 'All draft messages approved (Simulation Mode)' });
    await loadQueue();
    await refreshStats();
    toast.success('All drafts approved');
  };

  const handleSaveEdit = async (step) => {
    await api.updateScriptStep({ ...step, message_text: editText });
    setEditingId(null);
    await loadQueue();
    toast.success('Message updated');
  };

  const statusCounts = {
    all: queue.length,
    draft: queue.filter((q) => q.status === 'draft').length,
    approved: queue.filter((q) => q.status === 'approved').length,
    rejected: queue.filter((q) => q.status === 'rejected').length,
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-telegram-text">Approval Queue</h1>
          <p className="text-telegram-textSec text-sm">Review and approve messages before simulation or sending.</p>
        </div>
        <button onClick={handleApproveAll} disabled={statusCounts.draft === 0} className="btn-success disabled:opacity-50">
          Approve All Drafts
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        {(['all', 'draft', 'approved', 'rejected']).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === f ? 'bg-telegram-blue text-white' : 'bg-telegram-panel text-telegram-textSec hover:text-telegram-text'
            }`}>
            {f.charAt(0).toUpperCase() + f.slice(1)} ({statusCounts[f]})
          </button>
        ))}
      </div>

      {/* Safety notice for real mode */}
      <div className="card mb-4 border-telegram-orange/20 bg-telegram-orange/5">
        <p className="text-xs text-telegram-textSec">
          <span className="text-telegram-orange font-medium">Safety:</span> Messages must be manually approved before being sent in Controlled Test Group Mode. &quot;Approve All&quot; is only for Simulation Mode.
        </p>
      </div>

      {queue.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-telegram-textSec text-sm">
            {filter === 'all' ? 'No messages in the queue. Create a script first.' : `No ${filter} messages.`}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {queue.map((item) => {
            const typeInfo = getMessageTypeInfo(item.message_type);
            return (
              <div key={item.id} className="card py-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0" style={{ backgroundColor: item.avatar_color || '#0088cc' }}>
                    {(item.participant_name || '?').split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-xs font-medium text-telegram-text">{item.participant_name}</span>
                      <span className="badge text-[10px]" style={{ backgroundColor: typeInfo.color + '20', color: typeInfo.color }}>{typeInfo.label}</span>
                      <span className={`badge text-[10px] ${item.status === 'draft' ? 'badge-draft' : item.status === 'approved' ? 'badge-approved' : 'badge-rejected'}`}>
                        {item.status}
                      </span>
                      {item.scheduled_time && <span className="text-[10px] text-telegram-accent font-mono">{item.scheduled_time}</span>}
                      {item.script_title && <span className="text-[10px] text-telegram-textSec">Script: {item.script_title}</span>}
                      {item.group_name && <span className="text-[10px] text-telegram-textSec">Group: {item.group_name}</span>}
                    </div>
                    {editingId === item.id ? (
                      <div className="flex gap-2 mt-1">
                        <textarea value={editText} onChange={(e) => setEditText(e.target.value)} className="input-field text-xs flex-1" rows={2} />
                        <div className="flex flex-col gap-1">
                          <button onClick={() => handleSaveEdit(item)} className="btn-primary text-xs py-1">Save</button>
                          <button onClick={() => setEditingId(null)} className="btn-secondary text-xs py-1">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-telegram-text/80 leading-relaxed">{item.message_text}</p>
                    )}
                  </div>
                  {editingId !== item.id && (
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => { setEditingId(item.id); setEditText(item.message_text); }}
                        title="Edit" className="p-1.5 rounded hover:bg-telegram-hover text-telegram-textSec hover:text-telegram-text">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" /></svg>
                      </button>
                      {item.status !== 'approved' && (
                        <button onClick={() => handleApprove(item.id)} title="Approve"
                          className="p-1.5 rounded hover:bg-telegram-green/20 text-telegram-textSec hover:text-telegram-green">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                        </button>
                      )}
                      {item.status !== 'rejected' && (
                        <button onClick={() => handleReject(item.id)} title="Reject"
                          className="p-1.5 rounded hover:bg-telegram-red/20 text-telegram-textSec hover:text-telegram-red">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
