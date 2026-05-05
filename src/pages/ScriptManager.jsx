import { useState, useEffect, useCallback } from 'react';
import { useApp } from '../contexts/AppContext';
import { MESSAGE_TYPES, getMessageTypeInfo, generateSchedule } from '../utils/scheduler';
import toast from 'react-hot-toast';

export default function ScriptManager() {
  const { api, groups, participants, scripts, refreshScripts } = useApp();
  const [selectedScript, setSelectedScript] = useState(null);
  const [steps, setSteps] = useState([]);
  const [showScriptForm, setShowScriptForm] = useState(false);
  const [showStepForm, setShowStepForm] = useState(false);
  const [editingStep, setEditingStep] = useState(null);
  const [scriptForm, setScriptForm] = useState({ group_id: '', title: '', topic: '', description: '' });
  const [stepForm, setStepForm] = useState({ participant_id: '', message_type: 'message', message_text: '', reply_to_step: '', delay_seconds: 45, scheduled_time: '', status: 'draft' });

  const loadSteps = useCallback(async (scriptId) => {
    const data = await api.getScriptSteps(scriptId);
    setSteps(data);
  }, [api]);

  useEffect(() => {
    if (selectedScript) loadSteps(selectedScript.id);
  }, [selectedScript, loadSteps]);

  const handleCreateScript = async (e) => {
    e.preventDefault();
    if (!scriptForm.title.trim()) { toast.error('Title required'); return; }
    const script = await api.addScript({ ...scriptForm, group_id: scriptForm.group_id || null });
    await refreshScripts();
    setSelectedScript(script);
    setShowScriptForm(false);
    toast.success('Script created');
  };

  const handleDeleteScript = async (id) => {
    if (!confirm('Delete this script and all its steps?')) return;
    await api.deleteScript(id);
    await refreshScripts();
    if (selectedScript?.id === id) { setSelectedScript(null); setSteps([]); }
    toast.success('Script deleted');
  };

  const handleAddStep = async (e) => {
    e.preventDefault();
    if (!selectedScript) return;
    if (!stepForm.message_text.trim()) { toast.error('Message text required'); return; }
    const stepNumber = editingStep ? editingStep.step_number : steps.length + 1;
    if (editingStep) {
      await api.updateScriptStep({ ...stepForm, id: editingStep.id, script_id: selectedScript.id, step_number: stepNumber, participant_id: parseInt(stepForm.participant_id) || null, reply_to_step: parseInt(stepForm.reply_to_step) || null });
      toast.success('Step updated');
    } else {
      await api.addScriptStep({ ...stepForm, script_id: selectedScript.id, step_number: stepNumber, participant_id: parseInt(stepForm.participant_id) || null, reply_to_step: parseInt(stepForm.reply_to_step) || null });
      toast.success('Step added');
    }
    await loadSteps(selectedScript.id);
    setShowStepForm(false);
    setEditingStep(null);
    setStepForm({ participant_id: '', message_type: 'message', message_text: '', reply_to_step: '', delay_seconds: 45, scheduled_time: '', status: 'draft' });
  };

  const handleEditStep = (step) => {
    setStepForm({
      participant_id: step.participant_id?.toString() || '',
      message_type: step.message_type,
      message_text: step.message_text,
      reply_to_step: step.reply_to_step?.toString() || '',
      delay_seconds: step.delay_seconds || 45,
      scheduled_time: step.scheduled_time || '',
      status: step.status || 'draft',
    });
    setEditingStep(step);
    setShowStepForm(true);
  };

  const handleDeleteStep = async (id) => {
    await api.deleteScriptStep(id);
    await loadSteps(selectedScript.id);
    toast.success('Step deleted');
  };

  const handleAutoSchedule = async () => {
    if (steps.length === 0) { toast.error('No steps to schedule'); return; }
    const scheduled = generateSchedule(steps);
    for (const step of scheduled) {
      await api.updateScriptStep({ ...step, script_id: selectedScript.id });
    }
    await loadSteps(selectedScript.id);
    await api.addLog({ type: 'info', message: `Auto-scheduled ${steps.length} steps`, details: `Script: ${selectedScript.title}` });
    toast.success('Schedule generated');
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-telegram-text">Script Manager</h1>
          <p className="text-telegram-textSec text-sm">Create and manage discussion scripts with step-by-step flows.</p>
        </div>
        <button onClick={() => setShowScriptForm(!showScriptForm)} className="btn-primary">
          {showScriptForm ? 'Cancel' : '+ New Script'}
        </button>
      </div>

      {showScriptForm && (
        <form onSubmit={handleCreateScript} className="card mb-6">
          <h3 className="text-sm font-semibold text-telegram-text mb-4">New Discussion Script</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-telegram-textSec block mb-1">Title *</label>
              <input value={scriptForm.title} onChange={(e) => setScriptForm({ ...scriptForm, title: e.target.value })} className="input-field" placeholder="AI in Modern Education" />
            </div>
            <div>
              <label className="text-xs text-telegram-textSec block mb-1">Group</label>
              <select value={scriptForm.group_id} onChange={(e) => setScriptForm({ ...scriptForm, group_id: e.target.value })} className="select-field">
                <option value="">No group</option>
                {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="text-xs text-telegram-textSec block mb-1">Topic</label>
              <input value={scriptForm.topic} onChange={(e) => setScriptForm({ ...scriptForm, topic: e.target.value })} className="input-field" placeholder="How can AI improve education?" />
            </div>
          </div>
          <button type="submit" className="btn-primary mt-4">Create Script</button>
        </form>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Scripts list */}
        <div className="space-y-2">
          <h3 className="text-xs text-telegram-textSec font-semibold uppercase tracking-wider mb-2">Scripts ({scripts.length})</h3>
          {scripts.length === 0 ? (
            <p className="text-telegram-textSec text-xs card text-center py-6">No scripts yet.</p>
          ) : scripts.map((s) => (
            <button key={s.id} onClick={() => setSelectedScript(s)}
              className={`w-full text-left card transition-colors ${selectedScript?.id === s.id ? 'border-telegram-accent' : 'hover:border-telegram-textSec/30'}`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-telegram-text">{s.title}</p>
                  <p className="text-xs text-telegram-textSec mt-0.5">{s.topic || 'No topic'}</p>
                </div>
                <button onClick={(e) => { e.stopPropagation(); handleDeleteScript(s.id); }}
                  className="p-1 rounded hover:bg-telegram-red/20 text-telegram-textSec hover:text-telegram-red">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </button>
          ))}
        </div>

        {/* Steps */}
        <div className="lg:col-span-2">
          {selectedScript ? (
            <>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-telegram-text">{selectedScript.title}</h3>
                  <p className="text-xs text-telegram-textSec">{steps.length} steps</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={handleAutoSchedule} className="btn-secondary text-xs">Auto Schedule</button>
                  <button onClick={() => { setEditingStep(null); setStepForm({ participant_id: '', message_type: 'message', message_text: '', reply_to_step: '', delay_seconds: 45, scheduled_time: '', status: 'draft' }); setShowStepForm(!showStepForm); }}
                    className="btn-primary text-xs">+ Add Step</button>
                </div>
              </div>

              {showStepForm && (
                <form onSubmit={handleAddStep} className="card mb-4">
                  <h4 className="text-xs font-semibold text-telegram-text mb-3">{editingStep ? 'Edit Step' : 'New Step'}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-telegram-textSec block mb-0.5">Participant</label>
                      <select value={stepForm.participant_id} onChange={(e) => setStepForm({ ...stepForm, participant_id: e.target.value })} className="select-field text-xs">
                        <option value="">Select participant</option>
                        {participants.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-telegram-textSec block mb-0.5">Message Type</label>
                      <select value={stepForm.message_type} onChange={(e) => setStepForm({ ...stepForm, message_type: e.target.value })} className="select-field text-xs">
                        {MESSAGE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-[10px] text-telegram-textSec block mb-0.5">Message Text *</label>
                      <textarea value={stepForm.message_text} onChange={(e) => setStepForm({ ...stepForm, message_text: e.target.value })} className="input-field text-xs" rows={3} placeholder="Type the discussion message..." />
                    </div>
                    <div>
                      <label className="text-[10px] text-telegram-textSec block mb-0.5">Reply To Step #</label>
                      <select value={stepForm.reply_to_step} onChange={(e) => setStepForm({ ...stepForm, reply_to_step: e.target.value })} className="select-field text-xs">
                        <option value="">None</option>
                        {steps.filter((s) => !editingStep || s.id !== editingStep.id).map((s) => (
                          <option key={s.step_number} value={s.step_number}>Step {s.step_number}: {s.participant_name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-telegram-textSec block mb-0.5">Delay (seconds)</label>
                      <input type="number" value={stepForm.delay_seconds} onChange={(e) => setStepForm({ ...stepForm, delay_seconds: parseInt(e.target.value) || 0 })} className="input-field text-xs" />
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button type="submit" className="btn-primary text-xs">{editingStep ? 'Update' : 'Add'}</button>
                    <button type="button" onClick={() => { setShowStepForm(false); setEditingStep(null); }} className="btn-secondary text-xs">Cancel</button>
                  </div>
                </form>
              )}

              <div className="space-y-2">
                {steps.map((step) => {
                  const typeInfo = getMessageTypeInfo(step.message_type);
                  return (
                    <div key={step.id} className="card py-3">
                      <div className="flex items-start gap-3">
                        <div className="text-xs font-mono text-telegram-textSec w-6 text-right shrink-0 pt-0.5">{step.step_number}</div>
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0" style={{ backgroundColor: step.avatar_color || '#0088cc' }}>
                          {(step.participant_name || '?').split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-medium text-telegram-text">{step.participant_name || 'Unknown'}</span>
                            <span className="badge text-[10px]" style={{ backgroundColor: typeInfo.color + '20', color: typeInfo.color }}>{typeInfo.label}</span>
                            {step.reply_to_step && <span className="text-[10px] text-telegram-textSec">↩ Reply to #{step.reply_to_step}</span>}
                            {step.scheduled_time && <span className="text-[10px] text-telegram-accent font-mono">{step.scheduled_time}</span>}
                          </div>
                          <p className="text-xs text-telegram-text/80 mt-1 leading-relaxed">{step.message_text}</p>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <button onClick={() => handleEditStep(step)} className="p-1 rounded hover:bg-telegram-hover text-telegram-textSec hover:text-telegram-text">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" /></svg>
                          </button>
                          <button onClick={() => handleDeleteStep(step.id)} className="p-1 rounded hover:bg-telegram-red/20 text-telegram-textSec hover:text-telegram-red">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {steps.length === 0 && (
                  <p className="text-telegram-textSec text-xs text-center py-8">No steps yet. Add steps to build the discussion flow.</p>
                )}
              </div>
            </>
          ) : (
            <div className="card text-center py-16">
              <p className="text-telegram-textSec text-sm">Select a script from the left or create a new one.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
