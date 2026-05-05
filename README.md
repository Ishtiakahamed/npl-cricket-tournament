# Telegram Group Discussion Flow Simulator and Manager

A Windows desktop application for educational demonstration of Telegram-style group discussion planning, scheduling, and simulation.

> **Educational Use Only** — This app is designed for educational demonstration, community management learning, and controlled test-group use. It is NOT a spam tool, fake engagement tool, or public group manipulation tool.

## Features

### Simulation Mode (Main Feature)
- Create up to 20 demo participant profiles with names, roles, and avatars
- Build step-by-step discussion scripts with reply chains
- Visualize discussions in a Telegram-style chat interface
- Animated message playback with adjustable speed (0.5x–10x)
- No real Telegram messages are sent

### Controlled Test Group Mode (Optional)
- Connect to real Telegram test groups via Bot API
- Every message requires manual approval before sending
- Rate limiting and cooldown per bot/group
- Emergency stop button
- Full activity logs

### AI Draft Generator
- Generate discussion scripts using OpenRouter AI models
- Support for free models (Gemini, DeepSeek, Llama) and custom model IDs
- AI output saved as draft — never auto-sent
- Edit, review, and approve before use

### Time Management Algorithm
The scheduler automatically assigns realistic timing to discussion messages:
- **Beginning (first 25%)**: 45 seconds to 1 minute gaps — fast-paced opening
- **Middle (25–75%)**: 1 minute to 1.5 minute gaps — deep discussion
- **End (last 25%)**: 1.5 minutes to 2 minute gaps — wrapping up

Rules:
- No two participants message at the same time
- Reply/thread references maintained
- Natural conversation flow

### Additional Features
- 10 dashboard pages: Home, API Settings, Groups, Participants, Script Manager, AI Draft, Schedule, Approval Queue, Simulation, Logs, Settings
- Export as JSON, CSV, or PDF report
- SQLite local database (Electron) or in-memory store (browser)
- Safety features: manual approval, emergency stop, rate limits, duplicate prevention, activity logs

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Desktop | Electron |
| Frontend | React 18 + Tailwind CSS |
| Build | Vite |
| Database | SQLite (better-sqlite3) |
| AI | OpenRouter API |
| Telegram | Grammy (Bot API) |
| PDF | jsPDF + jsPDF-AutoTable |
| Packaging | electron-builder (NSIS) |

## Quick Start (Development)

### Prerequisites
- Node.js 18+ and npm

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Copy environment file (optional, API keys are configured in the app UI)
cp .env.example .env

# 3. Run in browser mode (for development)
npm run dev
# Open http://localhost:5173

# 4. Run as Electron desktop app
npm run electron:dev
```

### Build Windows EXE

```bash
# Build the app and package as Windows EXE
npm run electron:build

# Output will be in the release/ directory
```

## Sample Data

The app includes built-in sample data with:
- **20 demo participant profiles** with names, roles, and unique avatar colors
- **1 sample discussion group**: "AI in Education Discussion"
- **1 complete discussion script**: "AI in Modern Education" with 20 steps
- **Pre-configured time schedule** using the time management algorithm

To load sample data, go to **Settings → Load Sample Data**.

### Demo Participants

| # | Name | Role |
|---|------|------|
| 1 | Dr. Rahim Ahmed | Moderator / Faculty |
| 2 | Fatima Sultana | Student - CS Department |
| 3 | Kamal Hossain | Student - IT Department |
| 4 | Nusrat Jahan | Student - CS Department |
| 5 | Arif Khan | Student - Engineering |
| 6 | Sadia Begum | Student - Data Science |
| 7 | Tanvir Islam | Student - CS Department |
| 8 | Rifat Chowdhury | Teaching Assistant |
| 9 | Minhaz Uddin | Student - IT Department |
| 10 | Anika Rahman | Student - CS Department |
| 11 | Shakil Hasan | Student - Engineering |
| 12 | Tasnim Akter | Student - Data Science |
| 13 | Jubayer Ali | Student - IT Department |
| 14 | Mehreen Fatima | Student - CS Department |
| 15 | Imran Hossain | Student - Engineering |
| 16 | Sumaiya Khatun | Student - CS Department |
| 17 | Nazmul Haque | Student - IT Department |
| 18 | Farzana Yesmin | Student - Data Science |
| 19 | Rashed Mahmud | Student - CS Department |
| 20 | Lamia Akter | Student - CS Department |

### Sample Discussion Flow

```
08:00:00  Dr. Rahim Ahmed    → Opens topic: AI in education
08:00:45  Fatima Sultana      → Asks about AI tools in universities
08:01:30  Kamal Hossain       → Answers with ChatGPT, Grammarly examples
08:02:15  Nusrat Jahan        → Agrees about adaptive learning
08:03:00  Arif Khan           → Shares Georgia State University example
08:04:00  Sadia Begum         → Raises data privacy concerns
08:05:00  Tanvir Islam        → Discusses FERPA compliance
08:06:00  Rifat Chowdhury     → Counters: FERPA not enough
08:07:15  Minhaz Uddin        → Disagrees: over-regulation slows innovation
08:08:30  Anika Rahman        → Finland AI example
08:10:00  Shakil Hasan        → Can AI replace teachers?
08:11:30  Tasnim Akter        → No, emotional intelligence needed
08:13:00  Jubayer Ali         → AI coding platforms
08:14:30  Mehreen Fatima      → Warns about AI dependency
08:16:00  Imran Hossain       → AI simulation tools in engineering
08:18:00  Sumaiya Khatun      → Cost concerns for smaller institutions
08:20:00  Nazmul Haque        → Open-source alternatives
08:22:00  Farzana Yesmin      → Blockchain + AI for privacy
08:24:00  Rashed Mahmud       → Final question
08:26:00  Lamia Akter         → Final summary
```

## Simulation Mode vs Controlled Test Group Mode

### Simulation Mode
- Default mode for educational demonstration
- All discussions shown inside the app only
- No real Telegram API calls
- "Approve All" available for convenience
- Perfect for assignment presentations

### Controlled Test Group Mode
- Optional mode for real Telegram testing
- Requires Bot Token configuration
- Messages sent only to user-owned test groups
- Every message requires individual manual approval
- Rate limiting: configurable messages per minute
- Emergency stop button available
- Full audit trail in activity logs

## Safety Features

1. **Manual approval** before any real message sending
2. **Emergency stop** button — immediately halts all operations
3. **Per-group rate limit** — configurable messages per minute
4. **Per-bot cooldown** — minimum seconds between messages
5. **Duplicate message prevention** — blocks identical messages
6. **Full activity logs** — all actions recorded with timestamps
7. **Test-group-only warning** — visible reminder in the UI
8. **No hidden auto-spam behavior** — simulation is completely offline

## Project Structure

```
├── electron/
│   ├── main.js          # Electron main process
│   ├── preload.js       # IPC bridge
│   └── database.js      # SQLite setup & seed data
├── src/
│   ├── main.jsx         # React entry point
│   ├── App.jsx          # Router setup
│   ├── index.css        # Tailwind CSS
│   ├── components/
│   │   └── Layout.jsx   # Sidebar + main layout
│   ├── contexts/
│   │   └── AppContext.jsx  # Global state + in-memory fallback
│   ├── pages/
│   │   ├── Home.jsx              # Dashboard overview
│   │   ├── TelegramSettings.jsx  # API key configuration
│   │   ├── Groups.jsx            # Group management
│   │   ├── Participants.jsx      # Demo participant profiles
│   │   ├── ScriptManager.jsx     # Discussion script editor
│   │   ├── AIDraftGenerator.jsx  # AI-powered draft generation
│   │   ├── ScheduleTimeline.jsx  # Time management visualization
│   │   ├── ApprovalQueue.jsx     # Message approval system
│   │   ├── Simulation.jsx        # Telegram-style chat simulation
│   │   ├── Logs.jsx              # Activity logs viewer
│   │   └── Settings.jsx          # App settings & data export
│   └── utils/
│       ├── scheduler.js    # Time management algorithm
│       └── sampleData.js   # 20 demo profiles & sample script
├── .env.example
├── package.json
├── vite.config.js
├── tailwind.config.js
└── index.html
```

## License

MIT — Educational use only.
