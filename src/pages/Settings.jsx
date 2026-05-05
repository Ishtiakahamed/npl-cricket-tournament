import { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { SAMPLE_PARTICIPANTS, SAMPLE_TOPIC, SAMPLE_SCRIPT_STEPS } from '../utils/sampleData';
import { generateSchedule } from '../utils/scheduler';
import toast from 'react-hot-toast';

export default function Settings() {
  const { api, settings, refreshAll, refreshSettings } = useApp();
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const loadSampleData = async () => {
    if (!confirm('This will replace all existing data with sample data. Continue?')) return;
    setLoading(true);
    try {
      const isElectron = typeof window !== 'undefined' && window.electronAPI;
      if (isElectron) {
        await api.seedSampleData();
      } else {
        // Clear existing data by refreshing in-memory store
        const participants = await api.getParticipants();
        for (const p of participants) await api.deleteParticipant(p.id);
        const groups = await api.getGroups();
        for (const g of groups) await api.deleteGroup(g.id);
        const scripts = await api.getScripts();
        for (const s of scripts) await api.deleteScript(s.id);
        await api.clearLogs();

        // Add participants
        const pIds = [];
        for (let i = 0; i < SAMPLE_PARTICIPANTS.length; i++) {
          const p = await api.addParticipant({ ...SAMPLE_PARTICIPANTS[i], sort_order: i + 1 });
          pIds.push(p.id);
        }

        // Add group
        const group = await api.addGroup({
          name: 'AI in Education Discussion',
          username: '@ai_education_group',
          link: 'https://t.me/ai_education_group',
          description: 'Academic discussion group for exploring AI applications in education',
          mode: 'simulation',
        });

        // Add script
        const script = await api.addScript({
          group_id: group.id,
          title: 'AI in Modern Education',
          topic: SAMPLE_TOPIC,
          description: 'A structured group discussion exploring the benefits, challenges, and future of AI in education.',
        });

        // Add steps with scheduling
        const rawSteps = SAMPLE_SCRIPT_STEPS.map((s, i) => ({
          step_number: i + 1,
          participant_id: pIds[s.participantIndex],
          message_type: s.type,
          message_text: s.text,
          reply_to_step: s.replyTo,
          delay_seconds: 45,
          scheduled_time: '',
          status: 'draft',
        }));

        const scheduled = generateSchedule(rawSteps);
        await api.bulkAddScriptSteps({ scriptId: script.id, steps: scheduled });

        await api.addLog({ type: 'success', message: 'Sample data loaded', details: '20 participants, 1 group, 1 script with 20 steps' });
      }
      await refreshAll();
      toast.success('Sample data loaded successfully!');
    } catch (err) {
      toast.error('Error loading sample data: ' + err.message);
    }
    setLoading(false);
  };

  const exportAsJSON = async () => {
    setExporting(true);
    try {
      const scripts = await api.getScripts();
      const exportData = { participants: await api.getParticipants(), groups: await api.getGroups(), scripts: [] };
      for (const s of scripts) {
        const steps = await api.getScriptSteps(s.id);
        exportData.scripts.push({ ...s, steps });
      }
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'discussion-export.json'; a.click();
      URL.revokeObjectURL(url);
      await api.addLog({ type: 'info', message: 'Data exported as JSON' });
      toast.success('Exported as JSON');
    } catch (err) {
      toast.error('Export failed: ' + err.message);
    }
    setExporting(false);
  };

  const exportAsCSV = async () => {
    try {
      const scripts = await api.getScripts();
      let csv = 'Script,Step,Participant,Type,Message,Reply To,Time,Status\n';
      for (const s of scripts) {
        const steps = await api.getScriptSteps(s.id);
        for (const step of steps) {
          csv += `"${s.title.replace(/"/g, '""')}",${step.step_number},"${(step.participant_name || '').replace(/"/g, '""')}","${step.message_type}","${step.message_text.replace(/"/g, '""')}",${step.reply_to_step || ''},"${step.scheduled_time}","${step.status}"\n`;
        }
      }
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'discussion-schedule.csv'; a.click();
      URL.revokeObjectURL(url);
      toast.success('Exported as CSV');
    } catch (err) {
      toast.error('CSV export failed: ' + err.message);
    }
  };

  const exportAsPDF = async () => {
    try {
      const { jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');

      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text('Discussion Report', 14, 22);
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text('Generated by Telegram Discussion Simulator', 14, 30);
      doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 36);

      const scripts = await api.getScripts();
      let yPos = 46;

      for (const s of scripts) {
        const steps = await api.getScriptSteps(s.id);
        if (yPos > 250) { doc.addPage(); yPos = 20; }
        doc.setFontSize(14);
        doc.setTextColor(0);
        doc.text(s.title, 14, yPos);
        yPos += 6;
        doc.setFontSize(9);
        doc.setTextColor(100);
        doc.text(`Topic: ${s.topic || 'N/A'}`, 14, yPos);
        yPos += 8;

        const tableData = steps.map((step) => [
          step.step_number, step.scheduled_time || '-', step.participant_name,
          step.message_type, step.message_text.slice(0, 80) + (step.message_text.length > 80 ? '...' : ''),
        ]);

        autoTable(doc, {
          startY: yPos,
          head: [['#', 'Time', 'Participant', 'Type', 'Message']],
          body: tableData,
          styles: { fontSize: 7, cellPadding: 2 },
          headStyles: { fillColor: [0, 136, 204] },
          columnStyles: { 0: { cellWidth: 8 }, 1: { cellWidth: 18 }, 2: { cellWidth: 30 }, 3: { cellWidth: 22 } },
        });
        yPos = doc.lastAutoTable.finalY + 15;
      }

      doc.save('discussion-report.pdf');
      toast.success('Exported as PDF');
    } catch (err) {
      toast.error('PDF export failed: ' + err.message);
    }
  };

  const saveSetting = async (key, value) => {
    await api.setSetting({ key, value });
    await refreshSettings();
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-telegram-text mb-1">Settings</h1>
      <p className="text-telegram-textSec text-sm mb-6">Application settings and data management.</p>

      {/* Sample Data */}
      <div className="card mb-4">
        <h3 className="text-sm font-semibold text-telegram-text mb-3">Sample Data</h3>
        <p className="text-xs text-telegram-textSec mb-3">
          Load 20 demo participant profiles, 1 sample group, and a complete discussion script with time-managed schedule.
        </p>
        <button onClick={loadSampleData} disabled={loading} className="btn-primary disabled:opacity-50">
          {loading ? 'Loading...' : 'Load Sample Data'}
        </button>
      </div>

      {/* Safety Settings */}
      <div className="card mb-4">
        <h3 className="text-sm font-semibold text-telegram-text mb-3">Safety Settings</h3>
        <div className="space-y-3">
          <label className="flex items-center justify-between">
            <div>
              <p className="text-xs text-telegram-text">Manual Approval Required</p>
              <p className="text-[10px] text-telegram-textSec">Require manual approval before sending real messages</p>
            </div>
            <input type="checkbox" checked={settings.require_approval !== 'false'} onChange={(e) => saveSetting('require_approval', e.target.checked.toString())}
              className="w-4 h-4 accent-telegram-blue" />
          </label>
          <label className="flex items-center justify-between">
            <div>
              <p className="text-xs text-telegram-text">Duplicate Prevention</p>
              <p className="text-[10px] text-telegram-textSec">Block duplicate messages from being sent</p>
            </div>
            <input type="checkbox" checked={settings.prevent_duplicates !== 'false'} onChange={(e) => saveSetting('prevent_duplicates', e.target.checked.toString())}
              className="w-4 h-4 accent-telegram-blue" />
          </label>
          <div>
            <label className="text-xs text-telegram-text block mb-1">Rate Limit (messages per minute per group)</label>
            <input type="number" value={settings.rate_limit || '5'} onChange={(e) => saveSetting('rate_limit', e.target.value)}
              className="input-field w-32" min={1} max={60} />
          </div>
          <div>
            <label className="text-xs text-telegram-text block mb-1">Bot Cooldown (seconds between messages)</label>
            <input type="number" value={settings.bot_cooldown || '30'} onChange={(e) => saveSetting('bot_cooldown', e.target.value)}
              className="input-field w-32" min={1} max={300} />
          </div>
        </div>
      </div>

      {/* Export */}
      <div className="card mb-4">
        <h3 className="text-sm font-semibold text-telegram-text mb-3">Export Data</h3>
        <div className="flex gap-2 flex-wrap">
          <button onClick={exportAsJSON} className="btn-secondary text-xs" disabled={exporting}>Export JSON</button>
          <button onClick={exportAsCSV} className="btn-secondary text-xs">Export CSV</button>
          <button onClick={exportAsPDF} className="btn-secondary text-xs">Export PDF Report</button>
        </div>
      </div>

      {/* About */}
      <div className="card">
        <h3 className="text-sm font-semibold text-telegram-text mb-2">About</h3>
        <div className="text-xs text-telegram-textSec space-y-1">
          <p><span className="text-telegram-text">App:</span> Telegram Group Discussion Flow Simulator and Manager</p>
          <p><span className="text-telegram-text">Version:</span> 1.0.0</p>
          <p><span className="text-telegram-text">Purpose:</span> Educational and assignment demonstration</p>
          <p><span className="text-telegram-text">Stack:</span> Electron + React + Tailwind CSS + SQLite</p>
          <p className="pt-2 border-t border-telegram-textSec/10 text-telegram-orange">
            This app is for educational demonstration only. Not designed for spam, fake engagement, or public group manipulation.
          </p>
        </div>
      </div>
    </div>
  );
}
