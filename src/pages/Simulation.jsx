import { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '../contexts/AppContext';
import { getMessageTypeInfo } from '../utils/scheduler';

export default function Simulation() {
  const { api, scripts, emergencyStop } = useApp();
  const [selectedScript, setSelectedScript] = useState('');
  const [steps, setSteps] = useState([]);
  const [visibleSteps, setVisibleSteps] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [currentIndex, setCurrentIndex] = useState(0);
  const chatEndRef = useRef(null);
  const timerRef = useRef(null);

  const loadSteps = useCallback(async () => {
    if (!selectedScript) { setSteps([]); return; }
    const data = await api.getScriptSteps(parseInt(selectedScript));
    setSteps(data);
    setVisibleSteps([]);
    setCurrentIndex(0);
    setIsPlaying(false);
    setIsPaused(false);
  }, [api, selectedScript]);

  useEffect(() => { loadSteps(); }, [loadSteps]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [visibleSteps]);

  useEffect(() => {
    if (emergencyStop && isPlaying) {
      setIsPlaying(false);
      setIsPaused(true);
      if (timerRef.current) clearTimeout(timerRef.current);
    }
  }, [emergencyStop, isPlaying]);

  const playNext = useCallback(() => {
    if (currentIndex >= steps.length || emergencyStop) {
      setIsPlaying(false);
      return;
    }
    const step = steps[currentIndex];
    setVisibleSteps((prev) => [...prev, { ...step, animating: true }]);
    setCurrentIndex((prev) => prev + 1);

    setTimeout(() => {
      setVisibleSteps((prev) => prev.map((s, i) => i === prev.length - 1 ? { ...s, animating: false } : s));
    }, 300);

    if (currentIndex + 1 < steps.length) {
      const nextStep = steps[currentIndex + 1];
      const delay = (nextStep.delay_seconds || 2) * 1000 / speed;
      timerRef.current = setTimeout(playNext, Math.max(delay, 500));
    } else {
      timerRef.current = setTimeout(() => setIsPlaying(false), 1000);
    }
  }, [currentIndex, steps, speed, emergencyStop]);

  const handlePlay = () => {
    if (steps.length === 0) return;
    if (isPaused) {
      setIsPaused(false);
      setIsPlaying(true);
      playNext();
      return;
    }
    setVisibleSteps([]);
    setCurrentIndex(0);
    setIsPlaying(true);
    const step = steps[0];
    setVisibleSteps([{ ...step, animating: true }]);
    setCurrentIndex(1);
    setTimeout(() => {
      setVisibleSteps((prev) => prev.map((s) => ({ ...s, animating: false })));
    }, 300);

    if (steps.length > 1) {
      const nextDelay = (steps[1].delay_seconds || 2) * 1000 / speed;
      timerRef.current = setTimeout(() => {
        setCurrentIndex(1);
      }, Math.max(nextDelay, 500));
    } else {
      setTimeout(() => setIsPlaying(false), 1000);
    }
  };

  useEffect(() => {
    if (isPlaying && !isPaused && currentIndex > 0 && currentIndex < steps.length) {
      const step = steps[currentIndex];
      const delay = (step.delay_seconds || 2) * 1000 / speed;
      timerRef.current = setTimeout(playNext, Math.max(delay, 500));
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [isPlaying, isPaused, currentIndex, playNext, speed, steps]);

  const handlePause = () => {
    setIsPlaying(false);
    setIsPaused(true);
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setIsPaused(false);
    setVisibleSteps([]);
    setCurrentIndex(0);
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  const handleShowAll = () => {
    setVisibleSteps(steps.map((s) => ({ ...s, animating: false })));
    setCurrentIndex(steps.length);
    setIsPlaying(false);
    setIsPaused(false);
  };

  const getReplyPreview = (replyToStep) => {
    if (!replyToStep) return null;
    const replyStep = steps.find((s) => s.step_number === replyToStep);
    if (!replyStep) return null;
    return { name: replyStep.participant_name, text: replyStep.message_text, color: replyStep.avatar_color };
  };

  const scriptInfo = scripts.find((s) => s.id === parseInt(selectedScript));

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-telegram-dark border-b border-telegram-textSec/10 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-telegram-blue flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-telegram-text">
                {scriptInfo ? scriptInfo.title : 'Simulation Mode'}
              </h2>
              <p className="text-[10px] text-telegram-textSec">
                {steps.length} participants · {visibleSteps.length}/{steps.length} messages
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <select value={selectedScript} onChange={(e) => setSelectedScript(e.target.value)} className="select-field text-xs w-48">
              <option value="">Select script...</option>
              {scripts.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
            </select>

            <div className="flex items-center gap-1 bg-telegram-panel rounded-lg px-2 py-1">
              <span className="text-[10px] text-telegram-textSec">Speed:</span>
              {[0.5, 1, 2, 5, 10].map((s) => (
                <button key={s} onClick={() => setSpeed(s)}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${speed === s ? 'bg-telegram-blue text-white' : 'text-telegram-textSec hover:text-telegram-text'}`}>
                  {s}x
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto px-4 py-4" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'200\' height=\'200\' viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M 0 0 L 200 200 M 200 0 L 0 200\' stroke=\'%23ffffff05\' stroke-width=\'1\'/%3E%3C/svg%3E")' }}>
        {steps.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <svg className="w-16 h-16 text-telegram-textSec/20 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={0.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="text-telegram-textSec text-sm">Select a script and press Play to start the simulation.</p>
              <p className="text-telegram-textSec/60 text-xs mt-1">The discussion will appear here like a real Telegram group chat.</p>
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-1">
            {visibleSteps.length > 0 && scriptInfo?.topic && (
              <div className="text-center my-4">
                <span className="bg-telegram-panel/80 text-telegram-textSec text-[10px] px-3 py-1 rounded-full">
                  Topic: {scriptInfo.topic}
                </span>
              </div>
            )}
            {visibleSteps.map((step, i) => {
              const typeInfo = getMessageTypeInfo(step.message_type);
              const replyPreview = getReplyPreview(step.reply_to_step);
              const showName = i === 0 || visibleSteps[i - 1]?.participant_id !== step.participant_id;
              return (
                <div key={`${step.id}-${i}`} className={`flex gap-2 ${step.animating ? 'animate-fade-in' : ''}`}
                  style={{ animation: step.animating ? 'fadeInUp 0.3s ease-out' : 'none' }}>
                  <div className="w-8 shrink-0">
                    {showName && (
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold" style={{ backgroundColor: step.avatar_color || '#0088cc' }}>
                        {(step.participant_name || '?')[0].toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 max-w-[85%]">
                    {showName && (
                      <span className="text-xs font-medium block mb-0.5" style={{ color: step.avatar_color || '#64b5ef' }}>
                        {step.participant_name}
                      </span>
                    )}
                    <div className="bg-telegram-msg rounded-lg rounded-tl-sm px-3 py-2 inline-block max-w-full">
                      {replyPreview && (
                        <div className="border-l-2 pl-2 mb-1.5 py-0.5" style={{ borderColor: replyPreview.color || '#64b5ef' }}>
                          <p className="text-[10px] font-medium" style={{ color: replyPreview.color || '#64b5ef' }}>{replyPreview.name}</p>
                          <p className="text-[10px] text-telegram-textSec truncate max-w-[250px]">{replyPreview.text}</p>
                        </div>
                      )}
                      <p className="text-sm text-telegram-text leading-relaxed">{step.message_text}</p>
                      <div className="flex items-center justify-end gap-1.5 mt-1">
                        <span className="badge text-[8px] py-0" style={{ backgroundColor: typeInfo.color + '20', color: typeInfo.color }}>{typeInfo.label}</span>
                        <span className="text-[10px] text-telegram-textSec">{step.scheduled_time || ''}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={chatEndRef} />
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-telegram-dark border-t border-telegram-textSec/10 px-4 py-3">
        <div className="flex items-center justify-center gap-3 max-w-3xl mx-auto">
          <button onClick={handleReset} className="btn-secondary text-xs" disabled={visibleSteps.length === 0}>
            Reset
          </button>
          {isPlaying ? (
            <button onClick={handlePause} className="btn-warning text-xs px-6">
              Pause
            </button>
          ) : (
            <button onClick={handlePlay} disabled={steps.length === 0 || emergencyStop} className="btn-primary text-xs px-6 disabled:opacity-50">
              {isPaused ? 'Resume' : visibleSteps.length > 0 ? 'Replay' : 'Play'}
            </button>
          )}
          <button onClick={handleShowAll} className="btn-secondary text-xs" disabled={steps.length === 0}>
            Show All
          </button>

          <div className="ml-auto flex items-center gap-2">
            <div className="w-32 bg-telegram-panel rounded-full h-1.5">
              <div className="bg-telegram-accent rounded-full h-1.5 transition-all"
                style={{ width: `${steps.length ? (visibleSteps.length / steps.length) * 100 : 0}%` }} />
            </div>
            <span className="text-[10px] text-telegram-textSec">{visibleSteps.length}/{steps.length}</span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
