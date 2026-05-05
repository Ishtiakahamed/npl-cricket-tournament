import { useApp } from '../contexts/AppContext';
import { useNavigate } from 'react-router-dom';

const statCards = [
  { key: 'participants', label: 'Participants', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z', color: 'bg-blue-500/20 text-blue-400', link: '/participants' },
  { key: 'groups', label: 'Groups', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z', color: 'bg-green-500/20 text-green-400', link: '/groups' },
  { key: 'scripts', label: 'Scripts', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', color: 'bg-purple-500/20 text-purple-400', link: '/script-manager' },
  { key: 'pendingApprovals', label: 'Pending Approvals', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2', color: 'bg-orange-500/20 text-orange-400', link: '/approval' },
  { key: 'approvedMessages', label: 'Approved Messages', icon: 'M5 13l4 4L19 7', color: 'bg-emerald-500/20 text-emerald-400', link: '/approval' },
  { key: 'totalSteps', label: 'Total Script Steps', icon: 'M4 6h16M4 10h16M4 14h16M4 18h16', color: 'bg-cyan-500/20 text-cyan-400', link: '/script-manager' },
];

export default function Home() {
  const { stats, loading } = useApp();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin w-8 h-8 border-2 border-telegram-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-telegram-text">Dashboard</h1>
        <p className="text-telegram-textSec text-sm mt-1">
          Telegram Group Discussion Flow Simulator — Educational Mode
        </p>
      </div>

      {/* Safety Banner */}
      <div className="card mb-6 border-telegram-blue/30 bg-telegram-blue/10">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-telegram-accent mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <div>
            <p className="text-sm font-medium text-telegram-accent">Educational & Demonstration Use Only</p>
            <p className="text-xs text-telegram-textSec mt-1">
              This app is designed for educational demonstration, community management learning, and controlled test-group use.
              Simulation Mode shows Telegram-style discussions without sending real messages.
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {statCards.map((card) => (
          <button
            key={card.key}
            onClick={() => navigate(card.link)}
            className="card hover:border-telegram-accent/30 transition-all text-left group"
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg ${card.color} flex items-center justify-center`}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={card.icon} />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-telegram-text">{stats?.[card.key] ?? 0}</p>
                <p className="text-xs text-telegram-textSec">{card.label}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        <div className="card">
          <h3 className="text-sm font-semibold text-telegram-text mb-3">Quick Actions</h3>
          <div className="space-y-2">
            <button onClick={() => navigate('/simulation')} className="w-full btn-primary text-left flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Run Simulation
            </button>
            <button onClick={() => navigate('/ai-draft')} className="w-full btn-secondary text-left flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Generate AI Draft
            </button>
            <button onClick={() => navigate('/script-manager')} className="w-full btn-secondary text-left flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Create New Script
            </button>
          </div>
        </div>

        <div className="card">
          <h3 className="text-sm font-semibold text-telegram-text mb-3">Recent Activity</h3>
          {stats?.recentLogs?.length > 0 ? (
            <div className="space-y-2 max-h-[180px] overflow-y-auto">
              {stats.recentLogs.map((log) => (
                <div key={log.id} className="flex items-start gap-2 text-xs">
                  <span className={`shrink-0 w-1.5 h-1.5 rounded-full mt-1.5 ${
                    log.type === 'error' ? 'bg-telegram-red' :
                    log.type === 'warning' ? 'bg-telegram-orange' :
                    log.type === 'success' ? 'bg-telegram-green' : 'bg-telegram-accent'
                  }`} />
                  <div>
                    <p className="text-telegram-text">{log.message}</p>
                    <p className="text-telegram-textSec text-[10px]">{log.created_at}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-telegram-textSec text-xs">No activity yet. Load sample data from Settings to get started.</p>
          )}
        </div>
      </div>

      {/* Mode Explanation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card border-telegram-green/20">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-full bg-telegram-green/20 flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-telegram-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-telegram-green">Simulation Mode</h3>
          </div>
          <p className="text-xs text-telegram-textSec leading-relaxed">
            Shows a Telegram-style group discussion timeline without sending real messages. Create demo participants,
            write discussion scripts, and visualize the conversation flow. Perfect for assignment presentations.
          </p>
        </div>

        <div className="card border-telegram-orange/20">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-full bg-telegram-orange/20 flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-telegram-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-telegram-orange">Controlled Test Group Mode</h3>
          </div>
          <p className="text-xs text-telegram-textSec leading-relaxed">
            Optional mode for testing with a real Telegram test group. Every message requires manual approval before sending.
            Includes rate limits, activity logs, and emergency stop. For test groups owned by the user only.
          </p>
        </div>
      </div>
    </div>
  );
}
