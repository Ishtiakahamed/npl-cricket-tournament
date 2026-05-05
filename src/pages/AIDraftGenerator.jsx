import { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { MESSAGE_TYPES } from '../utils/scheduler';
import toast from 'react-hot-toast';

const DEFAULT_MODELS = [
  { id: 'google/gemini-2.0-flash-exp:free', name: 'Gemini 2.0 Flash (Free)' },
  { id: 'deepseek/deepseek-chat-v3-0324:free', name: 'DeepSeek V3 (Free)' },
  { id: 'meta-llama/llama-3.3-70b-instruct:free', name: 'Llama 3.3 70B (Free)' },
  { id: 'custom', name: 'Custom Model ID' },
];

export default function AIDraftGenerator() {
  const { api, participants, groups, settings, refreshScripts } = useApp();
  const [topic, setTopic] = useState('');
  const [participantCount, setParticipantCount] = useState(Math.min(participants.length, 20));
  const [selectedModel, setSelectedModel] = useState(DEFAULT_MODELS[0].id);
  const [customModel, setCustomModel] = useState('');
  const [targetGroup, setTargetGroup] = useState('');
  const [generating, setGenerating] = useState(false);
  const [draft, setDraft] = useState(null);
  const [error, setError] = useState('');

  const generateDraft = async () => {
    if (!topic.trim()) { toast.error('Enter a topic'); return; }
    const apiKey = settings.openrouter_key;
    if (!apiKey) { toast.error('Set OpenRouter API key in API Settings first'); return; }
    if (participants.length === 0) { toast.error('Add participants first'); return; }

    setGenerating(true);
    setError('');
    setDraft(null);

    const modelId = selectedModel === 'custom' ? customModel : selectedModel;
    const selectedParticipants = participants.slice(0, participantCount);
    const participantList = selectedParticipants.map((p, i) => `${i + 1}. ${p.name} (${p.role})`).join('\n');
    const messageTypes = MESSAGE_TYPES.map((t) => t.value).join(', ');

    const prompt = `You are an educational discussion script generator. Generate a structured Telegram group discussion script about the topic below.

Topic: "${topic}"

Participants (use exactly these names in order):
${participantList}

Rules:
- Generate exactly ${participantCount} messages, one per participant in order.
- First message should be "opening_topic" by the first participant.
- Last message should be "final_summary" by the last participant.
- Mix these message types naturally: ${messageTypes}
- Include reply references (reply_to_step as step number) where natural.
- Keep messages 1-3 sentences each.
- Make it feel like a real academic group discussion.

Output ONLY a JSON array with objects having these exact fields:
{"step_number": 1, "participant_index": 0, "message_type": "opening_topic", "message_text": "...", "reply_to_step": null}

No markdown, no explanation, just the JSON array.`;

    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: modelId,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error?.message || `API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '';

      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (!jsonMatch) throw new Error('Could not parse AI response as JSON');

      const parsed = JSON.parse(jsonMatch[0]);
      const draftSteps = parsed.map((step) => ({
        ...step,
        participant_name: selectedParticipants[step.participant_index]?.name || `Participant ${step.participant_index + 1}`,
        participant_id: selectedParticipants[step.participant_index]?.id,
        avatar_color: selectedParticipants[step.participant_index]?.avatar_color || '#0088cc',
      }));

      setDraft(draftSteps);
      await api.addLog({ type: 'success', message: `AI draft generated: ${topic}`, details: `${draftSteps.length} messages using ${modelId}` });
      toast.success(`Generated ${draftSteps.length} messages`);
    } catch (err) {
      setError(err.message);
      await api.addLog({ type: 'error', message: 'AI generation failed', details: err.message });
      toast.error('Generation failed: ' + err.message);
    }
    setGenerating(false);
  };

  const saveDraftAsScript = async () => {
    if (!draft) return;
    const script = await api.addScript({
      group_id: targetGroup || null,
      title: `AI: ${topic}`,
      topic,
      description: 'AI-generated discussion draft',
    });

    const steps = draft.map((d, i) => ({
      step_number: i + 1,
      participant_id: d.participant_id,
      message_type: d.message_type,
      message_text: d.message_text,
      reply_to_step: d.reply_to_step,
      delay_seconds: 45 + i * 5,
      scheduled_time: '',
      status: 'draft',
    }));

    await api.bulkAddScriptSteps({ scriptId: script.id, steps });
    await refreshScripts();
    await api.addLog({ type: 'success', message: `Draft saved as script: ${topic}`, details: `${steps.length} steps` });
    toast.success('Saved as draft script! Go to Script Manager to review.');
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-telegram-text mb-1">AI Draft Generator</h1>
      <p className="text-telegram-textSec text-sm mb-6">Generate discussion scripts using OpenRouter AI models.</p>

      <div className="card mb-6">
        <div className="space-y-4">
          <div>
            <label className="text-xs text-telegram-textSec block mb-1">Discussion Topic *</label>
            <input value={topic} onChange={(e) => setTopic(e.target.value)} className="input-field" placeholder="How can Artificial Intelligence improve modern education systems?" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-telegram-textSec block mb-1">AI Model</label>
              <select value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)} className="select-field">
                {DEFAULT_MODELS.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
              {selectedModel === 'custom' && (
                <input value={customModel} onChange={(e) => setCustomModel(e.target.value)} className="input-field mt-2" placeholder="model-provider/model-name" />
              )}
            </div>
            <div>
              <label className="text-xs text-telegram-textSec block mb-1">Participants ({participants.length} available)</label>
              <input type="number" min={2} max={Math.min(participants.length, 20)} value={participantCount}
                onChange={(e) => setParticipantCount(Math.min(parseInt(e.target.value) || 2, participants.length, 20))} className="input-field" />
            </div>
            <div>
              <label className="text-xs text-telegram-textSec block mb-1">Target Group (optional)</label>
              <select value={targetGroup} onChange={(e) => setTargetGroup(e.target.value)} className="select-field">
                <option value="">No group</option>
                {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
          </div>

          <button onClick={generateDraft} disabled={generating} className="btn-primary disabled:opacity-50">
            {generating ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                Generating...
              </span>
            ) : 'Generate AI Draft'}
          </button>
        </div>
      </div>

      {error && (
        <div className="card mb-4 border-telegram-red/30 bg-telegram-red/10">
          <p className="text-sm text-telegram-red">{error}</p>
        </div>
      )}

      {draft && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-telegram-text">Generated Draft ({draft.length} messages)</h3>
            <button onClick={saveDraftAsScript} className="btn-success">Save as Script Draft</button>
          </div>
          <div className="space-y-2">
            {draft.map((step, i) => (
              <div key={i} className="card py-3">
                <div className="flex items-start gap-3">
                  <div className="text-xs font-mono text-telegram-textSec w-5 text-right shrink-0 pt-0.5">{i + 1}</div>
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0" style={{ backgroundColor: step.avatar_color }}>
                    {step.participant_name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-medium text-telegram-text">{step.participant_name}</span>
                      <span className="badge text-[10px]" style={{ backgroundColor: (MESSAGE_TYPES.find((t) => t.value === step.message_type)?.color || '#6d8296') + '20', color: MESSAGE_TYPES.find((t) => t.value === step.message_type)?.color || '#6d8296' }}>
                        {MESSAGE_TYPES.find((t) => t.value === step.message_type)?.label || step.message_type}
                      </span>
                      {step.reply_to_step && <span className="text-[10px] text-telegram-textSec">↩ #{step.reply_to_step}</span>}
                    </div>
                    <p className="text-xs text-telegram-text/80 mt-1">{step.message_text}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!draft && !generating && (
        <div className="card text-center py-12">
          <svg className="w-12 h-12 text-telegram-textSec/30 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <p className="text-telegram-textSec text-sm">Enter a topic and generate an AI-powered discussion draft.</p>
          <p className="text-telegram-textSec text-xs mt-1">Drafts are saved for review — never auto-sent.</p>
        </div>
      )}
    </div>
  );
}
