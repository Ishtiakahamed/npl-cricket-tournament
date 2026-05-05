const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Participants
  getParticipants: () => ipcRenderer.invoke('db:getParticipants'),
  addParticipant: (p) => ipcRenderer.invoke('db:addParticipant', p),
  updateParticipant: (p) => ipcRenderer.invoke('db:updateParticipant', p),
  deleteParticipant: (id) => ipcRenderer.invoke('db:deleteParticipant', id),

  // Groups
  getGroups: () => ipcRenderer.invoke('db:getGroups'),
  addGroup: (g) => ipcRenderer.invoke('db:addGroup', g),
  updateGroup: (g) => ipcRenderer.invoke('db:updateGroup', g),
  deleteGroup: (id) => ipcRenderer.invoke('db:deleteGroup', id),

  // Scripts
  getScripts: (groupId) => ipcRenderer.invoke('db:getScripts', groupId),
  addScript: (s) => ipcRenderer.invoke('db:addScript', s),
  updateScript: (s) => ipcRenderer.invoke('db:updateScript', s),
  deleteScript: (id) => ipcRenderer.invoke('db:deleteScript', id),

  // Script Steps
  getScriptSteps: (scriptId) => ipcRenderer.invoke('db:getScriptSteps', scriptId),
  addScriptStep: (step) => ipcRenderer.invoke('db:addScriptStep', step),
  updateScriptStep: (step) => ipcRenderer.invoke('db:updateScriptStep', step),
  deleteScriptStep: (id) => ipcRenderer.invoke('db:deleteScriptStep', id),
  bulkAddScriptSteps: (data) => ipcRenderer.invoke('db:bulkAddScriptSteps', data),

  // Approval Queue
  getApprovalQueue: (filter) => ipcRenderer.invoke('db:getApprovalQueue', filter),
  approveStep: (id) => ipcRenderer.invoke('db:approveStep', id),
  rejectStep: (id) => ipcRenderer.invoke('db:rejectStep', id),
  approveAllDraft: () => ipcRenderer.invoke('db:approveAllDraft'),

  // Logs
  getLogs: (opts) => ipcRenderer.invoke('db:getLogs', opts),
  addLog: (log) => ipcRenderer.invoke('db:addLog', log),
  clearLogs: () => ipcRenderer.invoke('db:clearLogs'),

  // Settings
  getSettings: () => ipcRenderer.invoke('db:getSettings'),
  setSetting: (data) => ipcRenderer.invoke('db:setSetting', data),

  // Stats
  getStats: () => ipcRenderer.invoke('db:getStats'),

  // Seed
  seedSampleData: () => ipcRenderer.invoke('db:seedSampleData'),

  // Export
  exportScript: (id) => ipcRenderer.invoke('db:exportScript', id),
});
