import { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import toast from 'react-hot-toast';

const PRESET_COLORS = [
  '#e05555', '#e09255', '#4fae4e', '#0088cc', '#9c27b0',
  '#ff5722', '#009688', '#3f51b5', '#ff9800', '#795548',
  '#607d8b', '#e91e63', '#00bcd4', '#8bc34a', '#ffc107',
  '#673ab7', '#2196f3', '#cddc39', '#f44336', '#4caf50',
];

export default function Participants() {
  const { api, participants, refreshParticipants } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', role: '', avatar_color: '#0088cc', sort_order: 0 });

  const resetForm = () => {
    setForm({ name: '', role: '', avatar_color: PRESET_COLORS[participants.length % PRESET_COLORS.length], sort_order: participants.length + 1 });
    setEditing(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    if (editing) {
      await api.updateParticipant({ ...form, id: editing });
      toast.success('Participant updated');
    } else {
      await api.addParticipant(form);
      toast.success('Participant added');
    }
    await refreshParticipants();
    resetForm();
  };

  const handleEdit = (p) => {
    setForm({ name: p.name, role: p.role || '', avatar_color: p.avatar_color || '#0088cc', sort_order: p.sort_order || 0 });
    setEditing(p.id);
    setShowForm(true);
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete participant "${name}"?`)) return;
    await api.deleteParticipant(id);
    await refreshParticipants();
    toast.success('Participant deleted');
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-telegram-text">Demo Participants</h1>
          <p className="text-telegram-textSec text-sm">{participants.length}/20 participant profiles</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(!showForm); }} className="btn-primary">
          {showForm ? 'Cancel' : '+ Add Participant'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card mb-6">
          <h3 className="text-sm font-semibold text-telegram-text mb-4">{editing ? 'Edit Participant' : 'New Participant'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-telegram-textSec block mb-1">Name *</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" placeholder="Dr. Rahim Ahmed" />
            </div>
            <div>
              <label className="text-xs text-telegram-textSec block mb-1">Role</label>
              <input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="input-field" placeholder="Student - CS Department" />
            </div>
            <div>
              <label className="text-xs text-telegram-textSec block mb-1">Avatar Color</label>
              <div className="flex items-center gap-2">
                <input type="color" value={form.avatar_color} onChange={(e) => setForm({ ...form, avatar_color: e.target.value })} className="w-8 h-8 rounded cursor-pointer border-0" />
                <div className="flex gap-1 flex-wrap">
                  {PRESET_COLORS.slice(0, 10).map((c) => (
                    <button key={c} type="button" onClick={() => setForm({ ...form, avatar_color: c })}
                      className={`w-5 h-5 rounded-full border-2 transition-transform ${form.avatar_color === c ? 'border-white scale-125' : 'border-transparent'}`}
                      style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>
            </div>
            <div>
              <label className="text-xs text-telegram-textSec block mb-1">Sort Order</label>
              <input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })} className="input-field" />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button type="submit" className="btn-primary">{editing ? 'Update' : 'Add'}</button>
            <button type="button" onClick={resetForm} className="btn-secondary">Cancel</button>
          </div>
        </form>
      )}

      {participants.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-telegram-textSec text-sm">No participants yet. Add participants or load sample data from Settings.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {participants.map((p, idx) => (
            <div key={p.id} className="card hover:border-telegram-accent/20 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: p.avatar_color || '#0088cc' }}>
                    {p.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-telegram-text">{p.name}</p>
                    <p className="text-xs text-telegram-textSec">{p.role || `Account ${idx + 1}`}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => handleEdit(p)} className="p-1.5 rounded hover:bg-telegram-hover transition-colors text-telegram-textSec hover:text-telegram-text">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" /></svg>
                  </button>
                  <button onClick={() => handleDelete(p.id, p.name)} className="p-1.5 rounded hover:bg-telegram-red/20 transition-colors text-telegram-textSec hover:text-telegram-red">
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
