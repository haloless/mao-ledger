import { BrowserRouter, Route, Routes } from 'react-router-dom';
import AppShell from './components/AppShell';
import { ThemeProvider } from './theme/ThemeContext';
import AiHelper from './pages/AiHelper';
import Contract from './pages/Contract';
import Dashboard from './pages/Dashboard';
import Plan from './pages/Plan';
import Settings from './pages/Settings';
import Summary from './pages/Summary';
import Transactions from './pages/Transactions';

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppShell />}>
            <Route index element={<Dashboard />} />
            <Route path="contract" element={<Contract />} />
            <Route path="plan" element={<Plan />} />
            <Route path="transactions" element={<Transactions />} />
            <Route path="summary" element={<Summary />} />
            <Route path="ai-helper" element={<AiHelper />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
