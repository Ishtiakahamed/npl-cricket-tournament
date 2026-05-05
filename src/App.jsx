import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import Home from './pages/Home';
import TelegramSettings from './pages/TelegramSettings';
import Groups from './pages/Groups';
import Participants from './pages/Participants';
import ScriptManager from './pages/ScriptManager';
import AIDraftGenerator from './pages/AIDraftGenerator';
import ScheduleTimeline from './pages/ScheduleTimeline';
import ApprovalQueue from './pages/ApprovalQueue';
import Simulation from './pages/Simulation';
import Logs from './pages/Logs';
import Settings from './pages/Settings';

export default function App() {
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1b2836',
            color: '#e4ecf2',
            border: '1px solid rgba(109,130,150,0.2)',
          },
        }}
      />
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/telegram-settings" element={<TelegramSettings />} />
          <Route path="/groups" element={<Groups />} />
          <Route path="/participants" element={<Participants />} />
          <Route path="/script-manager" element={<ScriptManager />} />
          <Route path="/ai-draft" element={<AIDraftGenerator />} />
          <Route path="/schedule" element={<ScheduleTimeline />} />
          <Route path="/approval" element={<ApprovalQueue />} />
          <Route path="/simulation" element={<Simulation />} />
          <Route path="/logs" element={<Logs />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
    </>
  );
}
