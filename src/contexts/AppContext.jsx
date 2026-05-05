import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AppContext = createContext(null);

const isElectron = typeof window !== 'undefined' && window.electronAPI;

function createInMemoryStore() {
  let data = {
    participants: [],
    groups: [],
    scripts: [],
    scriptSteps: {},
    logs: [],
    settings: {},
    nextId: { participants: 1, groups: 1, scripts: 1, steps: 1, logs: 1 },
  };

  return {
    getParticipants: () => [...data.participants],
    addParticipant: (p) => {
      const item = { ...p, id: data.nextId.participants++, created_at: new Date().toISOString() };
      data.participants.push(item);
      return item;
    },
    updateParticipant: (p) => {
      const idx = data.participants.findIndex((x) => x.id === p.id);
      if (idx !== -1) data.participants[idx] = { ...data.participants[idx], ...p };
      return p;
    },
    deleteParticipant: (id) => {
      data.participants = data.participants.filter((x) => x.id !== id);
      return { success: true };
    },
    getGroups: () => [...data.groups],
    addGroup: (g) => {
      const item = { ...g, id: data.nextId.groups++, created_at: new Date().toISOString() };
      data.groups.push(item);
      return item;
    },
    updateGroup: (g) => {
      const idx = data.groups.findIndex((x) => x.id === g.id);
      if (idx !== -1) data.groups[idx] = { ...data.groups[idx], ...g };
      return g;
    },
    deleteGroup: (id) => {
      data.groups = data.groups.filter((x) => x.id !== id);
      return { success: true };
    },
    getScripts: (groupId) => {
      if (groupId) return data.scripts.filter((s) => s.group_id === groupId);
      return [...data.scripts];
    },
    addScript: (s) => {
      const item = { ...s, id: data.nextId.scripts++, created_at: new Date().toISOString() };
      data.scripts.push(item);
      data.scriptSteps[item.id] = [];
      return item;
    },
    updateScript: (s) => {
      const idx = data.scripts.findIndex((x) => x.id === s.id);
      if (idx !== -1) data.scripts[idx] = { ...data.scripts[idx], ...s };
      return s;
    },
    deleteScript: (id) => {
      data.scripts = data.scripts.filter((x) => x.id !== id);
      delete data.scriptSteps[id];
      return { success: true };
    },
    getScriptSteps: (scriptId) => {
      const steps = data.scriptSteps[scriptId] || [];
      return steps.map((s) => {
        const p = data.participants.find((x) => x.id === s.participant_id);
        return { ...s, participant_name: p?.name || 'Unknown', avatar_color: p?.avatar_color || '#0088cc' };
      });
    },
    addScriptStep: (step) => {
      const item = { ...step, id: data.nextId.steps++, created_at: new Date().toISOString() };
      if (!data.scriptSteps[step.script_id]) data.scriptSteps[step.script_id] = [];
      data.scriptSteps[step.script_id].push(item);
      return item;
    },
    updateScriptStep: (step) => {
      const steps = data.scriptSteps[step.script_id] || [];
      const idx = steps.findIndex((x) => x.id === step.id);
      if (idx !== -1) steps[idx] = { ...steps[idx], ...step };
      return step;
    },
    deleteScriptStep: (id) => {
      for (const key of Object.keys(data.scriptSteps)) {
        data.scriptSteps[key] = data.scriptSteps[key].filter((x) => x.id !== id);
      }
      return { success: true };
    },
    bulkAddScriptSteps: ({ scriptId, steps }) => {
      if (!data.scriptSteps[scriptId]) data.scriptSteps[scriptId] = [];
      for (const s of steps) {
        data.scriptSteps[scriptId].push({ ...s, id: data.nextId.steps++, script_id: scriptId, created_at: new Date().toISOString() });
      }
      return { success: true };
    },
    getApprovalQueue: (filter) => {
      let allSteps = [];
      for (const [scriptId, steps] of Object.entries(data.scriptSteps)) {
        const script = data.scripts.find((s) => s.id === Number(scriptId));
        const group = script ? data.groups.find((g) => g.id === script.group_id) : null;
        for (const step of steps) {
          if (filter && filter !== 'all' && step.status !== filter) continue;
          const p = data.participants.find((x) => x.id === step.participant_id);
          allSteps.push({
            ...step,
            script_title: script?.title || '',
            participant_name: p?.name || 'Unknown',
            avatar_color: p?.avatar_color || '#0088cc',
            group_name: group?.name || '',
          });
        }
      }
      return allSteps.sort((a, b) => (a.scheduled_time || '').localeCompare(b.scheduled_time || '') || a.step_number - b.step_number);
    },
    approveStep: (id) => {
      for (const steps of Object.values(data.scriptSteps)) {
        const step = steps.find((x) => x.id === id);
        if (step) { step.status = 'approved'; break; }
      }
      return { success: true };
    },
    rejectStep: (id) => {
      for (const steps of Object.values(data.scriptSteps)) {
        const step = steps.find((x) => x.id === id);
        if (step) { step.status = 'rejected'; break; }
      }
      return { success: true };
    },
    approveAllDraft: () => {
      for (const steps of Object.values(data.scriptSteps)) {
        for (const step of steps) {
          if (step.status === 'draft') step.status = 'approved';
        }
      }
      return { success: true };
    },
    getLogs: ({ limit, type } = {}) => {
      let filtered = [...data.logs];
      if (type && type !== 'all') filtered = filtered.filter((l) => l.type === type);
      filtered.sort((a, b) => b.id - a.id);
      if (limit) filtered = filtered.slice(0, limit);
      return filtered;
    },
    addLog: (log) => {
      const item = { ...log, id: data.nextId.logs++, created_at: new Date().toISOString() };
      data.logs.push(item);
      return item;
    },
    clearLogs: () => {
      data.logs = [];
      return { success: true };
    },
    getSettings: () => ({ ...data.settings }),
    setSetting: ({ key, value }) => {
      data.settings[key] = value;
      return { success: true };
    },
    getStats: () => ({
      participants: data.participants.length,
      groups: data.groups.length,
      scripts: data.scripts.length,
      pendingApprovals: Object.values(data.scriptSteps).flat().filter((s) => s.status === 'draft').length,
      approvedMessages: Object.values(data.scriptSteps).flat().filter((s) => s.status === 'approved').length,
      totalSteps: Object.values(data.scriptSteps).flat().length,
      recentLogs: data.logs.slice(-10).reverse(),
    }),
    exportScript: (scriptId) => {
      const script = data.scripts.find((s) => s.id === scriptId);
      const steps = (data.scriptSteps[scriptId] || []).map((s) => {
        const p = data.participants.find((x) => x.id === s.participant_id);
        return { ...s, participant_name: p?.name || 'Unknown' };
      });
      return { script, steps };
    },
    seedSampleData: () => { /* handled below */ return { success: true }; },
  };
}

let memStore = null;
function getMemStore() {
  if (!memStore) memStore = createInMemoryStore();
  return memStore;
}

export function AppProvider({ children }) {
  const [participants, setParticipants] = useState([]);
  const [groups, setGroups] = useState([]);
  const [scripts, setScripts] = useState([]);
  const [settings, setSettings] = useState({});
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [emergencyStop, setEmergencyStop] = useState(false);

  const api = isElectron ? window.electronAPI : getMemStore();

  const refreshAll = useCallback(async () => {
    const [p, g, s, st, sett] = await Promise.all([
      api.getParticipants(),
      api.getGroups(),
      api.getScripts(),
      api.getStats(),
      api.getSettings(),
    ]);
    setParticipants(p);
    setGroups(g);
    setScripts(s);
    setStats(st);
    setSettings(sett);
  }, [api]);

  useEffect(() => {
    refreshAll().then(() => setLoading(false));
  }, [refreshAll]);

  const value = {
    api,
    participants,
    groups,
    scripts,
    settings,
    stats,
    loading,
    emergencyStop,
    setEmergencyStop,
    refreshAll,
    refreshParticipants: async () => {
      setParticipants(await api.getParticipants());
      setStats(await api.getStats());
    },
    refreshGroups: async () => {
      setGroups(await api.getGroups());
      setStats(await api.getStats());
    },
    refreshScripts: async () => {
      setScripts(await api.getScripts());
      setStats(await api.getStats());
    },
    refreshStats: async () => {
      setStats(await api.getStats());
    },
    refreshSettings: async () => {
      setSettings(await api.getSettings());
    },
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
