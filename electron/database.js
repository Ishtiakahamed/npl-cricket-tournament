const Database = require('better-sqlite3');
const path = require('path');
const { app } = require('electron');

let db;

function getDbPath() {
  const userDataPath = app.getPath('userData');
  return path.join(userDataPath, 'telegram-simulator.db');
}

function initDatabase() {
  db = new Database(getDbPath());
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS participants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      role TEXT DEFAULT '',
      avatar_color TEXT DEFAULT '#0088cc',
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS groups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      username TEXT DEFAULT '',
      link TEXT DEFAULT '',
      description TEXT DEFAULT '',
      mode TEXT DEFAULT 'simulation',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS scripts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      group_id INTEGER,
      title TEXT NOT NULL,
      topic TEXT DEFAULT '',
      description TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS script_steps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      script_id INTEGER NOT NULL,
      step_number INTEGER NOT NULL,
      participant_id INTEGER,
      message_type TEXT DEFAULT 'message',
      message_text TEXT DEFAULT '',
      reply_to_step INTEGER,
      delay_seconds INTEGER DEFAULT 45,
      scheduled_time TEXT DEFAULT '',
      status TEXT DEFAULT 'draft',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (script_id) REFERENCES scripts(id) ON DELETE CASCADE,
      FOREIGN KEY (participant_id) REFERENCES participants(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT DEFAULT 'info',
      message TEXT NOT NULL,
      details TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT DEFAULT ''
    );
  `);

  return db;
}

function getDb() {
  return db;
}

function seedSampleData() {
  const existingParticipants = db.prepare('SELECT COUNT(*) as count FROM participants').get();
  if (existingParticipants.count > 0) {
    db.prepare('DELETE FROM script_steps').run();
    db.prepare('DELETE FROM scripts').run();
    db.prepare('DELETE FROM groups').run();
    db.prepare('DELETE FROM participants').run();
    db.prepare('DELETE FROM logs').run();
  }

  const colors = [
    '#e05555', '#e09255', '#4fae4e', '#0088cc', '#9c27b0',
    '#ff5722', '#009688', '#3f51b5', '#ff9800', '#795548',
    '#607d8b', '#e91e63', '#00bcd4', '#8bc34a', '#ffc107',
    '#673ab7', '#2196f3', '#cddc39', '#f44336', '#4caf50'
  ];

  const participants = [
    { name: 'Dr. Rahim Ahmed', role: 'Moderator / Faculty' },
    { name: 'Fatima Sultana', role: 'Student - CS Department' },
    { name: 'Kamal Hossain', role: 'Student - IT Department' },
    { name: 'Nusrat Jahan', role: 'Student - CS Department' },
    { name: 'Arif Khan', role: 'Student - Engineering' },
    { name: 'Sadia Begum', role: 'Student - Data Science' },
    { name: 'Tanvir Islam', role: 'Student - CS Department' },
    { name: 'Rifat Chowdhury', role: 'Teaching Assistant' },
    { name: 'Minhaz Uddin', role: 'Student - IT Department' },
    { name: 'Anika Rahman', role: 'Student - CS Department' },
    { name: 'Shakil Hasan', role: 'Student - Engineering' },
    { name: 'Tasnim Akter', role: 'Student - Data Science' },
    { name: 'Jubayer Ali', role: 'Student - IT Department' },
    { name: 'Mehreen Fatima', role: 'Student - CS Department' },
    { name: 'Imran Hossain', role: 'Student - Engineering' },
    { name: 'Sumaiya Khatun', role: 'Student - CS Department' },
    { name: 'Nazmul Haque', role: 'Student - IT Department' },
    { name: 'Farzana Yesmin', role: 'Student - Data Science' },
    { name: 'Rashed Mahmud', role: 'Student - CS Department' },
    { name: 'Lamia Akter', role: 'Student - CS Department' },
  ];

  const insertParticipant = db.prepare(
    'INSERT INTO participants (name, role, avatar_color, sort_order) VALUES (?, ?, ?, ?)'
  );
  const participantIds = [];
  for (let i = 0; i < participants.length; i++) {
    const info = insertParticipant.run(participants[i].name, participants[i].role, colors[i], i + 1);
    participantIds.push(info.lastInsertRowid);
  }

  const insertGroup = db.prepare(
    'INSERT INTO groups (name, username, link, description, mode) VALUES (?, ?, ?, ?, ?)'
  );
  const groupInfo = insertGroup.run(
    'AI in Education Discussion',
    '@ai_education_group',
    'https://t.me/ai_education_group',
    'Academic discussion group for exploring AI applications in education',
    'simulation'
  );
  const groupId = groupInfo.lastInsertRowid;

  const insertScript = db.prepare(
    'INSERT INTO scripts (group_id, title, topic, description) VALUES (?, ?, ?, ?)'
  );
  const scriptInfo = insertScript.run(
    groupId,
    'AI in Modern Education',
    'How can Artificial Intelligence improve modern education systems?',
    'A structured group discussion exploring the benefits, challenges, and future of AI in education.'
  );
  const scriptId = scriptInfo.lastInsertRowid;

  const steps = [
    { step: 1, pid: 0, type: 'opening_topic', text: "Welcome everyone! Today's topic: How can Artificial Intelligence improve modern education systems? Let's explore the benefits, challenges, and future possibilities. Please share your thoughts!", delay: 0, time: '08:00:00' },
    { step: 2, pid: 1, type: 'question', text: "Great topic, Dr. Ahmed! I'd like to start with a question - what specific AI tools are currently being used in universities for personalized learning?", delay: 45, time: '08:00:45', reply: 1 },
    { step: 3, pid: 2, type: 'answer', text: "Good question, Fatima! From what I've seen, tools like ChatGPT for tutoring, Grammarly for writing, and adaptive platforms like Khan Academy use AI to personalize learning paths based on student performance.", delay: 45, time: '08:01:30', reply: 2 },
    { step: 4, pid: 3, type: 'agree', text: "I agree with Kamal. Adaptive learning is one of the strongest use cases. AI can identify weak areas and adjust content difficulty automatically, which is impossible for teachers to do individually for 200+ students.", delay: 45, time: '08:02:15', reply: 3 },
    { step: 5, pid: 4, type: 'example', text: "Here's a real example: Georgia State University used AI chatbots to answer student queries during enrollment. They reduced 'summer melt' (students who don't show up) by 22%. That's a massive improvement!", delay: 45, time: '08:03:00' },
    { step: 6, pid: 5, type: 'question', text: "That's impressive, Arif! But what about data privacy concerns? These AI systems collect massive amounts of student data. How do we ensure it's not misused?", delay: 60, time: '08:04:00', reply: 5 },
    { step: 7, pid: 6, type: 'answer', text: "Valid concern, Sadia. Most educational AI platforms comply with FERPA regulations. But I think institutions should also have their own data governance policies and regular audits to ensure student data is protected.", delay: 60, time: '08:05:00', reply: 6 },
    { step: 8, pid: 7, type: 'counter_reply', text: "While I appreciate Tanvir's point, FERPA alone isn't enough. Many ed-tech companies sell aggregated data to third parties. We need stricter regulations specifically for AI in education.", delay: 60, time: '08:06:00', reply: 7 },
    { step: 9, pid: 8, type: 'disagree', text: "I partially disagree with Rifat. Over-regulation could slow down innovation. Instead, we should focus on transparency - let students know exactly what data is collected and how it's used.", delay: 75, time: '08:07:15', reply: 8 },
    { step: 10, pid: 9, type: 'example', text: "Here's another perspective: Finland uses AI to help teachers, not replace them. Their AI system analyzes student essays and provides feedback suggestions to teachers, who then review and personalize the feedback.", delay: 75, time: '08:08:30' },
    { step: 11, pid: 10, type: 'question', text: "Interesting point, Anika! Do you think AI could eventually replace teachers entirely, or will it always be a support tool?", delay: 90, time: '08:10:00', reply: 10 },
    { step: 12, pid: 11, type: 'answer', text: "I don't think AI will replace teachers. Teaching involves emotional intelligence, motivation, and mentoring. AI can handle repetitive tasks like grading, but the human connection in education is irreplaceable.", delay: 90, time: '08:11:30', reply: 11 },
    { step: 13, pid: 12, type: 'agree', text: "Adding to Kamal's earlier point about adaptive learning - in our IT department, we've been using AI-powered coding platforms that adjust problem difficulty based on your skill level. It's incredibly effective for learning programming.", delay: 90, time: '08:13:00', reply: 3 },
    { step: 14, pid: 13, type: 'counter_reply', text: "That's cool, Jubayer, but those platforms can also create dependency. Students might rely too much on AI hints and struggle when they have to solve problems independently during exams.", delay: 90, time: '08:14:30', reply: 13 },
    { step: 15, pid: 14, type: 'example', text: "Let me share a different angle. In our engineering lab, we use AI-powered simulation tools that let students experiment with designs virtually before building physical prototypes. This saves both time and resources.", delay: 90, time: '08:16:00' },
    { step: 16, pid: 15, type: 'question', text: "Imran, that sounds amazing! But aren't those simulation tools expensive? How can smaller institutions afford AI integration in their curriculum?", delay: 120, time: '08:18:00', reply: 15 },
    { step: 17, pid: 16, type: 'answer', text: "Good question, Sumaiya. There are open-source alternatives like TensorFlow and Hugging Face that offer free AI tools. Many cloud providers also offer free tiers for educational institutions.", delay: 120, time: '08:20:00', reply: 16 },
    { step: 18, pid: 17, type: 'counter_reply', text: "Expanding on Minhaz's point about privacy - I believe blockchain technology combined with AI could solve many data privacy issues in education by creating transparent, immutable records of data usage.", delay: 120, time: '08:22:00', reply: 9 },
    { step: 19, pid: 18, type: 'question', text: "This has been a great discussion! My final question: What's the single most important thing educational institutions should do RIGHT NOW to prepare for AI integration?", delay: 120, time: '08:24:00' },
    { step: 20, pid: 19, type: 'final_summary', text: "Great question to wrap up, Rashed! To summarize our discussion: AI offers tremendous benefits in personalized learning, automated grading, and student support. Key challenges include data privacy, cost, and avoiding over-dependency. The consensus seems to be that AI should augment teachers, not replace them. My recommendation: institutions should start with small AI pilot programs, train faculty on AI tools, and develop clear data governance policies. Thank you all for this productive discussion!", delay: 120, time: '08:26:00', reply: 19 },
  ];

  const insertStep = db.prepare(
    `INSERT INTO script_steps (script_id, step_number, participant_id, message_type, message_text, reply_to_step, delay_seconds, scheduled_time, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  for (const s of steps) {
    insertStep.run(
      scriptId, s.step, participantIds[s.pid], s.type, s.text,
      s.reply || null, s.delay, s.time, 'draft'
    );
  }

  const insertLog = db.prepare('INSERT INTO logs (type, message, details) VALUES (?, ?, ?)');
  insertLog.run('info', 'Sample data loaded', 'Seeded 20 demo participants, 1 group, 1 script with 20 discussion steps');
  insertLog.run('info', 'Application initialized', 'Telegram Discussion Simulator ready for use');
}

module.exports = { initDatabase, getDb, seedSampleData };
