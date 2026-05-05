import { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import toast from 'react-hot-toast';

export default function TelegramSettings() {
  const { api, settings, refreshSettings } = useApp();
  const [botToken, setBotToken] = useState('');
  const [apiId, setApiId] = useState('');
  const [apiHash, setApiHash] = useState('');
  const [openRouterKey, setOpenRouterKey] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    setBotToken(settings.bot_token || '');
    setApiId(settings.api_id || '');
    setApiHash(settings.api_hash || '');
    setOpenRouterKey(settings.openrouter_key || '');
    if (settings.bot_token) setConnectionStatus('saved');
  }, [settings]);

  const saveBotToken = async () => {
    await api.setSetting({ key: 'bot_token', value: botToken });
    await api.addLog({ type: 'info', message: 'Bot token updated', details: 'Telegram Bot API token saved securely' });
    await refreshSettings();
    setConnectionStatus('saved');
    toast.success('Bot token saved');
  };

  const saveApiCredentials = async () => {
    await api.setSetting({ key: 'api_id', value: apiId });
    await api.setSetting({ key: 'api_hash', value: apiHash });
    await api.addLog({ type: 'info', message: 'API credentials updated', details: 'API ID and Hash saved' });
    await refreshSettings();
    toast.success('API credentials saved');
  };

  const testConnection = async () => {
    if (!botToken) {
      toast.error('Enter a bot token first');
      return;
    }
    setTesting(true);
    setConnectionStatus('testing');
    try {
      const response = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
      const data = await response.json();
      if (data.ok) {
        setConnectionStatus('connected');
        await api.addLog({ type: 'success', message: `Bot connected: @${data.result.username}`, details: JSON.stringify(data.result) });
        toast.success(`Connected to @${data.result.username}`);
      } else {
        setConnectionStatus('error');
        await api.addLog({ type: 'error', message: 'Bot connection failed', details: data.description });
        toast.error(data.description || 'Connection failed');
      }
    } catch (err) {
      setConnectionStatus('error');
      await api.addLog({ type: 'error', message: 'Bot connection error', details: err.message });
      toast.error('Network error: ' + err.message);
    }
    setTesting(false);
  };

  const statusColors = {
    disconnected: 'bg-gray-500',
    saved: 'bg-telegram-orange',
    testing: 'bg-yellow-500 animate-pulse',
    connected: 'bg-telegram-green',
    error: 'bg-telegram-red',
  };

  const statusLabels = {
    disconnected: 'Not Configured',
    saved: 'Saved (Not Tested)',
    testing: 'Testing...',
    connected: 'Connected',
    error: 'Connection Failed',
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-telegram-text mb-1">Telegram API Settings</h1>
      <p className="text-telegram-textSec text-sm mb-6">Configure Telegram Bot API and optional API credentials for test mode.</p>

      {/* Safety Notice */}
      <div className="card mb-6 border-telegram-orange/30 bg-telegram-orange/10">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-telegram-orange mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <div>
            <p className="text-sm font-medium text-telegram-orange">Safety Notice</p>
            <p className="text-xs text-telegram-textSec mt-1">
              API credentials are only needed for the Controlled Test Group Mode. Simulation Mode works entirely offline
              without any API keys. Real messages are never sent without manual approval.
            </p>
          </div>
        </div>
      </div>

      {/* Connection Status */}
      <div className="card mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${statusColors[connectionStatus]}`} />
            <div>
              <p className="text-sm font-medium text-telegram-text">Connection Status</p>
              <p className="text-xs text-telegram-textSec">{statusLabels[connectionStatus]}</p>
            </div>
          </div>
          <button onClick={testConnection} disabled={testing || !botToken} className="btn-secondary disabled:opacity-50">
            {testing ? 'Testing...' : 'Test Connection'}
          </button>
        </div>
      </div>

      {/* Bot Token */}
      <div className="card mb-4">
        <h3 className="text-sm font-semibold text-telegram-text mb-3">Bot Token (Primary)</h3>
        <p className="text-xs text-telegram-textSec mb-3">
          Create a bot via <span className="text-telegram-accent">@BotFather</span> on Telegram and paste the token here.
        </p>
        <div className="flex gap-2">
          <input
            type="password"
            value={botToken}
            onChange={(e) => setBotToken(e.target.value)}
            placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
            className="input-field flex-1"
          />
          <button onClick={saveBotToken} className="btn-primary">Save</button>
        </div>
      </div>

      {/* API ID & Hash */}
      <div className="card mb-4">
        <h3 className="text-sm font-semibold text-telegram-text mb-3">API Credentials (Optional)</h3>
        <p className="text-xs text-telegram-textSec mb-3">
          Only needed for advanced test mode features. Get from{' '}
          <span className="text-telegram-accent">my.telegram.org</span>.
        </p>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-telegram-textSec block mb-1">API ID</label>
            <input
              type="text"
              value={apiId}
              onChange={(e) => setApiId(e.target.value)}
              placeholder="12345678"
              className="input-field"
            />
          </div>
          <div>
            <label className="text-xs text-telegram-textSec block mb-1">API Hash</label>
            <input
              type="password"
              value={apiHash}
              onChange={(e) => setApiHash(e.target.value)}
              placeholder="0123456789abcdef0123456789abcdef"
              className="input-field"
            />
          </div>
          <button onClick={saveApiCredentials} className="btn-primary">Save Credentials</button>
        </div>
      </div>

      {/* OpenRouter API */}
      <div className="card">
        <h3 className="text-sm font-semibold text-telegram-text mb-3">OpenRouter API Key</h3>
        <p className="text-xs text-telegram-textSec mb-3">
          Used for AI-powered discussion draft generation. Get from{' '}
          <span className="text-telegram-accent">openrouter.ai</span>.
        </p>
        <div className="flex gap-2">
          <input
            type="password"
            value={openRouterKey}
            onChange={(e) => setOpenRouterKey(e.target.value)}
            placeholder="sk-or-v1-..."
            className="input-field flex-1"
          />
          <button
            onClick={async () => {
              await api.setSetting({ key: 'openrouter_key', value: openRouterKey });
              await api.addLog({ type: 'info', message: 'OpenRouter API key updated' });
              await refreshSettings();
              toast.success('OpenRouter API key saved');
            }}
            className="btn-primary"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
