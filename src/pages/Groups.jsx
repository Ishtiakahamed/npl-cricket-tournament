import { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import toast from 'react-hot-toast';

export default function Groups() {
  const { api, groups, refreshGroups } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', username: '', link: '', description: '', mode: 'simulation' });

  const resetForm = () => {
    setForm({ name: '', username: '', link: '', description: '', mode: 'simulation' });
    setEditing(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Group name is required'); return; }
    if (editing) {
      await api.updateGroup({ ...form, id: editing });
      await api.addLog({ type: 'info', message: `Group updated: ${form.name}` });
      toast.success('Group updated');
    } else {
      await api.addGroup(form);
      await api.addLog({ type: 'info', message: `Group created: ${form.name}` });
      toast.success('Group created');
    }
    await refreshGroups();
    resetForm();
  };

  const handleEdit = (group) => {
    setForm({ name: group.name, username: group.username || '', link: group.link || '', description: group.description || '', mode: group.mode || 'simulation' });
    setEditing(group.id);
    setShowForm(true);
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete group "${name}"?`)) return;
    await api.deleteGroup(id);
    await api.addLog({ type: 'warning', message: `Group deleted: ${name}` });
    await refreshGroups();
    toast.success('Group deleted');
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-telegram-text">Groups</h1>
          <p className="text-telegram-textSec text-sm">Manage Telegram groups for discussion simulation.</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(!showForm); }} className="btn-primary">
          {showForm ? 'Cancel' : '+ Add Group'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card mb-6">
          <h3 className="text-sm font-semibold text-telegram-text mb-4">{editing ? 'Edit Group' : 'New Group'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-telegram-textSec block mb-1">Group Name *</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" placeholder="AI in Education Discussion" />
            </div>
            <div>
              <label className="text-xs text-telegram-textSec block mb-1">Username</label>
              <input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} className="input-field" placeholder="@group_username" />
            </div>
            <div>
              <label className="text-xs text-telegram-textSec block mb-1">Group Link</label>
              <input value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} className="input-field" placeholder="https://t.me/group_link" />
            </div>
            <div>
              <label className="text-xs text-telegram-textSec block mb-1">Mode</label>
              <select value={form.mode} onChange={(e) => setForm({ ...form, mode: e.target.value })} className="select-field">
                <option value="simulation">Simulation</option>
                <option value="test_group">Controlled Test Group</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="text-xs text-telegram-textSec block mb-1">Description</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-field" rows={2} placeholder="Group description..." />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button type="submit" className="btn-primary">{editing ? 'Update' : 'Create'}</button>
            <button type="button" onClick={resetForm} className="btn-secondary">Cancel</button>
          </div>
        </form>
      )}

      {groups.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-telegram-textSec text-sm">No groups yet. Add a group or load sample data from Settings.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {groups.map((group) => (
            <div key={group.id} className="card hover:border-telegram-accent/20 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm ${group.mode === 'test_group' ? 'bg-telegram-orange' : 'bg-telegram-blue'}`}>
                    {group.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-telegram-text">{group.name}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      {group.username && <span className="text-xs text-telegram-accent">{group.username}</span>}
                      <span className={`badge text-[10px] ${group.mode === 'test_group' ? 'badge-scheduled' : 'badge-approved'}`}>
                        {group.mode === 'test_group' ? 'Test Group' : 'Simulation'}
                      </span>
                    </div>
                    {group.description && <p className="text-xs text-telegram-textSec mt-1">{group.description}</p>}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => handleEdit(group)} className="p-1.5 rounded hover:bg-telegram-hover transition-colors text-telegram-textSec hover:text-telegram-text">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" /></svg>
                  </button>
                  <button onClick={() => handleDelete(group.id, group.name)} className="p-1.5 rounded hover:bg-telegram-red/20 transition-colors text-telegram-textSec hover:text-telegram-red">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
