const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { initDatabase, getDb } = require('./database');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    icon: path.join(__dirname, '..', 'assets', 'icon.png'),
    title: 'Telegram Discussion Simulator',
    backgroundColor: '#0e1621',
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }
}

app.whenReady().then(() => {
  initDatabase();
  registerIpcHandlers();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

function registerIpcHandlers() {
  const db = getDb();

  // --- Participants ---
  ipcMain.handle('db:getParticipants', () => {
    return db.prepare('SELECT * FROM participants ORDER BY sort_order').all();
  });

  ipcMain.handle('db:addParticipant', (_e, p) => {
    const stmt = db.prepare(
      'INSERT INTO participants (name, role, avatar_color, sort_order) VALUES (?, ?, ?, ?)'
    );
    const info = stmt.run(p.name, p.role, p.avatar_color, p.sort_order || 0);
    return { id: info.lastInsertRowid, ...p };
  });

  ipcMain.handle('db:updateParticipant', (_e, p) => {
    db.prepare('UPDATE participants SET name=?, role=?, avatar_color=?, sort_order=? WHERE id=?')
      .run(p.name, p.role, p.avatar_color, p.sort_order, p.id);
    return p;
  });

  ipcMain.handle('db:deleteParticipant', (_e, id) => {
    db.prepare('DELETE FROM participants WHERE id=?').run(id);
    return { success: true };
  });

  // --- Groups ---
  ipcMain.handle('db:getGroups', () => {
    return db.prepare('SELECT * FROM groups ORDER BY created_at DESC').all();
  });

  ipcMain.handle('db:addGroup', (_e, g) => {
    const stmt = db.prepare(
      'INSERT INTO groups (name, username, link, description, mode) VALUES (?, ?, ?, ?, ?)'
    );
    const info = stmt.run(g.name, g.username, g.link, g.description, g.mode || 'simulation');
    return { id: info.lastInsertRowid, ...g };
  });

  ipcMain.handle('db:updateGroup', (_e, g) => {
    db.prepare('UPDATE groups SET name=?, username=?, link=?, description=?, mode=? WHERE id=?')
      .run(g.name, g.username, g.link, g.description, g.mode, g.id);
    return g;
  });

  ipcMain.handle('db:deleteGroup', (_e, id) => {
    db.prepare('DELETE FROM groups WHERE id=?').run(id);
    return { success: true };
  });

  // --- Scripts ---
  ipcMain.handle('db:getScripts', (_e, groupId) => {
    if (groupId) {
      return db.prepare('SELECT * FROM scripts WHERE group_id=? ORDER BY created_at DESC').all(groupId);
    }
    return db.prepare('SELECT * FROM scripts ORDER BY created_at DESC').all();
  });

  ipcMain.handle('db:addScript', (_e, s) => {
    const stmt = db.prepare(
      'INSERT INTO scripts (group_id, title, topic, description) VALUES (?, ?, ?, ?)'
    );
    const info = stmt.run(s.group_id, s.title, s.topic, s.description || '');
    return { id: info.lastInsertRowid, ...s };
  });

  ipcMain.handle('db:updateScript', (_e, s) => {
    db.prepare('UPDATE scripts SET group_id=?, title=?, topic=?, description=? WHERE id=?')
      .run(s.group_id, s.title, s.topic, s.description, s.id);
    return s;
  });

  ipcMain.handle('db:deleteScript', (_e, id) => {
    db.prepare('DELETE FROM script_steps WHERE script_id=?').run(id);
    db.prepare('DELETE FROM scripts WHERE id=?').run(id);
    return { success: true };
  });

  // --- Script Steps ---
  ipcMain.handle('db:getScriptSteps', (_e, scriptId) => {
    return db.prepare(
      `SELECT ss.*, p.name as participant_name, p.avatar_color
       FROM script_steps ss
       LEFT JOIN participants p ON ss.participant_id = p.id
       WHERE ss.script_id=?
       ORDER BY ss.step_number`
    ).all(scriptId);
  });

  ipcMain.handle('db:addScriptStep', (_e, step) => {
    const stmt = db.prepare(
      `INSERT INTO script_steps (script_id, step_number, participant_id, message_type, message_text, reply_to_step, delay_seconds, scheduled_time, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    const info = stmt.run(
      step.script_id, step.step_number, step.participant_id,
      step.message_type, step.message_text, step.reply_to_step,
      step.delay_seconds, step.scheduled_time, step.status || 'draft'
    );
    return { id: info.lastInsertRowid, ...step };
  });

  ipcMain.handle('db:updateScriptStep', (_e, step) => {
    db.prepare(
      `UPDATE script_steps SET step_number=?, participant_id=?, message_type=?, message_text=?, reply_to_step=?, delay_seconds=?, scheduled_time=?, status=? WHERE id=?`
    ).run(
      step.step_number, step.participant_id, step.message_type,
      step.message_text, step.reply_to_step, step.delay_seconds,
      step.scheduled_time, step.status, step.id
    );
    return step;
  });

  ipcMain.handle('db:deleteScriptStep', (_e, id) => {
    db.prepare('DELETE FROM script_steps WHERE id=?').run(id);
    return { success: true };
  });

  ipcMain.handle('db:bulkAddScriptSteps', (_e, { scriptId, steps }) => {
    const stmt = db.prepare(
      `INSERT INTO script_steps (script_id, step_number, participant_id, message_type, message_text, reply_to_step, delay_seconds, scheduled_time, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    const insertMany = db.transaction((items) => {
      for (const s of items) {
        stmt.run(scriptId, s.step_number, s.participant_id, s.message_type, s.message_text, s.reply_to_step, s.delay_seconds, s.scheduled_time, s.status || 'draft');
      }
    });
    insertMany(steps);
    return { success: true };
  });

  // --- Approval Queue ---
  ipcMain.handle('db:getApprovalQueue', (_e, filter) => {
    let query = `SELECT ss.*, s.title as script_title, p.name as participant_name, p.avatar_color, g.name as group_name
      FROM script_steps ss
      LEFT JOIN scripts s ON ss.script_id = s.id
      LEFT JOIN participants p ON ss.participant_id = p.id
      LEFT JOIN groups g ON s.group_id = g.id`;
    if (filter && filter !== 'all') {
      query += ` WHERE ss.status = '${filter}'`;
    }
    query += ' ORDER BY ss.scheduled_time, ss.step_number';
    return db.prepare(query).all();
  });

  ipcMain.handle('db:approveStep', (_e, id) => {
    db.prepare("UPDATE script_steps SET status='approved' WHERE id=?").run(id);
    return { success: true };
  });

  ipcMain.handle('db:rejectStep', (_e, id) => {
    db.prepare("UPDATE script_steps SET status='rejected' WHERE id=?").run(id);
    return { success: true };
  });

  ipcMain.handle('db:approveAllDraft', () => {
    db.prepare("UPDATE script_steps SET status='approved' WHERE status='draft'").run();
    return { success: true };
  });

  // --- Logs ---
  ipcMain.handle('db:getLogs', (_e, { limit, type } = {}) => {
    let query = 'SELECT * FROM logs';
    const params = [];
    if (type && type !== 'all') {
      query += ' WHERE type=?';
      params.push(type);
    }
    query += ' ORDER BY created_at DESC';
    if (limit) {
      query += ' LIMIT ?';
      params.push(limit);
    }
    return db.prepare(query).all(...params);
  });

  ipcMain.handle('db:addLog', (_e, log) => {
    const stmt = db.prepare('INSERT INTO logs (type, message, details) VALUES (?, ?, ?)');
    const info = stmt.run(log.type, log.message, log.details || '');
    return { id: info.lastInsertRowid };
  });

  ipcMain.handle('db:clearLogs', () => {
    db.prepare('DELETE FROM logs').run();
    return { success: true };
  });

  // --- Settings ---
  ipcMain.handle('db:getSettings', () => {
    const rows = db.prepare('SELECT * FROM settings').all();
    const settings = {};
    for (const row of rows) {
      settings[row.key] = row.value;
    }
    return settings;
  });

  ipcMain.handle('db:setSetting', (_e, { key, value }) => {
    db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, value);
    return { success: true };
  });

  // --- Stats ---
  ipcMain.handle('db:getStats', () => {
    const participants = db.prepare('SELECT COUNT(*) as count FROM participants').get().count;
    const groups = db.prepare('SELECT COUNT(*) as count FROM groups').get().count;
    const scripts = db.prepare('SELECT COUNT(*) as count FROM scripts').get().count;
    const pendingApprovals = db.prepare("SELECT COUNT(*) as count FROM script_steps WHERE status='draft'").get().count;
    const approvedMessages = db.prepare("SELECT COUNT(*) as count FROM script_steps WHERE status='approved'").get().count;
    const totalSteps = db.prepare('SELECT COUNT(*) as count FROM script_steps').get().count;
    const recentLogs = db.prepare('SELECT * FROM logs ORDER BY created_at DESC LIMIT 10').all();
    return { participants, groups, scripts, pendingApprovals, approvedMessages, totalSteps, recentLogs };
  });

  // --- Seed sample data ---
  ipcMain.handle('db:seedSampleData', () => {
    const { seedSampleData } = require('./database');
    seedSampleData();
    return { success: true };
  });

  // --- Export ---
  ipcMain.handle('db:exportScript', (_e, scriptId) => {
    const script = db.prepare('SELECT * FROM scripts WHERE id=?').get(scriptId);
    const steps = db.prepare(
      `SELECT ss.*, p.name as participant_name FROM script_steps ss
       LEFT JOIN participants p ON ss.participant_id = p.id
       WHERE ss.script_id=? ORDER BY ss.step_number`
    ).all(scriptId);
    return { script, steps };
  });
}
