import { useState, useEffect, useCallback } from 'react';
import { useApp } from '../contexts/AppContext';
import { generateSchedule, getMessageTypeInfo, parseTime, formatTime } from '../utils/scheduler';
import toast from 'react-hot-toast';

export default function ScheduleTimeline() {
  const { api, scripts } = useApp();
  const [selectedScript, setSelectedScript] = useState('');
  const [steps, setSteps] = useState([]);
  const [startTime, setStartTime] = useState('08:00:00');

  const loadSteps = useCallback(async () => {
    if (!selectedScript) { setSteps([]); return; }
    const data = await api.getScriptSteps(parseInt(selectedScript));
    setSteps(data);
  }, [api, selectedScript]);

  useEffect(() => { loadSteps(); }, [loadSteps]);

  const handleAutoSchedule = async () => {
    if (steps.length === 0) { toast.error('No steps to schedule'); return; }
    const scheduled = generateSchedule(steps, startTime);
    for (const step of scheduled) {
      await api.updateScriptStep({ ...step, script_id: parseInt(selectedScript) });
    }
    await loadSteps();
    toast.success('Schedule generated with time-management algorithm');
  };



  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-telegram-text mb-1">Schedule Timeline</h1>
      <p className="text-telegram-textSec text-sm mb-6">Visualize and manage the discussion schedule with time-management algorithm.</p>

      {/* Algorithm Explanation */}
      <div className="card mb-6 border-telegram-blue/20 bg-telegram-blue/5">
        <h3 className="text-sm font-semibold text-telegram-accent mb-2">Time Management Algorithm</h3>
        <div className="grid grid-cols-3 gap-4 text-xs text-telegram-textSec">
          <div>
            <p className="font-medium text-telegram-green">Beginning (1-25%)</p>
            <p>45s - 1 min gaps</p>
            <p className="text-[10px] mt-0.5">Fast-paced opening</p>
          </div>
          <div>
            <p className="font-medium text-telegram-orange">Middle (25-75%)</p>
            <p>1 min - 1.5 min gaps</p>
            <p className="text-[10px] mt-0.5">Deep discussion phase</p>
          </div>
          <div>
            <p className="font-medium text-telegram-red">End (75-100%)</p>
            <p>1.5 min - 2 min gaps</p>
            <p className="text-[10px] mt-0.5">Wrapping up</p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="card mb-6">
        <div className="flex items-end gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs text-telegram-textSec block mb-1">Select Script</label>
            <select value={selectedScript} onChange={(e) => setSelectedScript(e.target.value)} className="select-field">
              <option value="">Choose a script...</option>
              {scripts.map((s) => <option key={s.id} value={s.id}>{s.title} ({s.topic || 'no topic'})</option>)}
            </select>
          </div>
          <div className="w-36">
            <label className="text-xs text-telegram-textSec block mb-1">Start Time</label>
            <input type="text" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="input-field font-mono" placeholder="08:00:00" />
          </div>
          <button onClick={handleAutoSchedule} disabled={!selectedScript || steps.length === 0} className="btn-primary disabled:opacity-50">
            Generate Schedule
          </button>
        </div>
      </div>

      {steps.length > 0 ? (
        <>
          {/* Visual Timeline */}
          <div className="card mb-6">
            <h3 className="text-sm font-semibold text-telegram-text mb-4">Visual Timeline</h3>
            <div className="relative">
              <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-telegram-textSec/20" />
              {steps.map((step) => {
                const typeInfo = getMessageTypeInfo(step.message_type);
                return (
                  <div key={step.id} className="relative pl-12 pb-6 last:pb-0">
                    <div className="absolute left-3 w-5 h-5 rounded-full border-2 flex items-center justify-center text-[8px] font-bold"
                      style={{ borderColor: typeInfo.color, backgroundColor: typeInfo.color + '30', color: typeInfo.color }}>
                      {step.step_number}
                    </div>
                    <div className="card py-2.5 px-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs text-telegram-accent">{step.scheduled_time || '--:--:--'}</span>
                        <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[8px] font-bold" style={{ backgroundColor: step.avatar_color || '#0088cc' }}>
                          {(step.participant_name || '?')[0]}
                        </div>
                        <span className="text-xs font-medium text-telegram-text">{step.participant_name}</span>
                        <span className="badge text-[10px]" style={{ backgroundColor: typeInfo.color + '20', color: typeInfo.color }}>{typeInfo.label}</span>
                        {step.delay_seconds > 0 && <span className="text-[10px] text-telegram-textSec">+{step.delay_seconds}s</span>}
                        {step.reply_to_step && <span className="text-[10px] text-telegram-textSec">↩ #{step.reply_to_step}</span>}
                      </div>
                      <p className="text-xs text-telegram-text/70 leading-relaxed">{step.message_text}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Summary Table */}
          <div className="card">
            <h3 className="text-sm font-semibold text-telegram-text mb-3">Schedule Summary</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-telegram-textSec/10">
                    <th className="text-left py-2 px-2 text-telegram-textSec font-medium">#</th>
                    <th className="text-left py-2 px-2 text-telegram-textSec font-medium">Time</th>
                    <th className="text-left py-2 px-2 text-telegram-textSec font-medium">Participant</th>
                    <th className="text-left py-2 px-2 text-telegram-textSec font-medium">Type</th>
                    <th className="text-left py-2 px-2 text-telegram-textSec font-medium">Delay</th>
                    <th className="text-left py-2 px-2 text-telegram-textSec font-medium">Reply To</th>
                  </tr>
                </thead>
                <tbody>
                  {steps.map((step) => {
                    const typeInfo = getMessageTypeInfo(step.message_type);
                    return (
                      <tr key={step.id} className="border-b border-telegram-textSec/5 hover:bg-telegram-hover/50">
                        <td className="py-2 px-2 font-mono text-telegram-textSec">{step.step_number}</td>
                        <td className="py-2 px-2 font-mono text-telegram-accent">{step.scheduled_time || '-'}</td>
                        <td className="py-2 px-2 text-telegram-text">{step.participant_name}</td>
                        <td className="py-2 px-2"><span className="badge text-[10px]" style={{ backgroundColor: typeInfo.color + '20', color: typeInfo.color }}>{typeInfo.label}</span></td>
                        <td className="py-2 px-2 text-telegram-textSec">{step.delay_seconds}s</td>
                        <td className="py-2 px-2 text-telegram-textSec">{step.reply_to_step ? `#${step.reply_to_step}` : '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {steps.length > 0 && steps[0].scheduled_time && steps[steps.length - 1].scheduled_time && (
              <div className="mt-3 pt-3 border-t border-telegram-textSec/10 flex gap-6 text-xs text-telegram-textSec">
                <span>Start: <span className="text-telegram-accent font-mono">{steps[0].scheduled_time}</span></span>
                <span>End: <span className="text-telegram-accent font-mono">{steps[steps.length - 1].scheduled_time}</span></span>
                <span>Duration: <span className="text-telegram-accent font-mono">{formatTime(parseTime(steps[steps.length - 1].scheduled_time) - parseTime(steps[0].scheduled_time))}</span></span>
                <span>Total: <span className="text-telegram-accent">{steps.length} messages</span></span>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="card text-center py-16">
          <p className="text-telegram-textSec text-sm">
            {selectedScript ? 'This script has no steps. Add steps in Script Manager first.' : 'Select a script to view and generate the schedule timeline.'}
          </p>
        </div>
      )}
    </div>
  );
}
