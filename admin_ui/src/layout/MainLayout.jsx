import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import AIBox from '../components/AIBox';

export default function MainLayout() {
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar />
      <main style={{ flex: 1, overflowY: 'auto', padding: '32px 32px 48px' }}>
        <Outlet />
      </main>
      <AIBox />
    </div>
  );
}
