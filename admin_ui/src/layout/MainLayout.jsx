import { Suspense } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import AIBox from '../components/AIBox';
import { Loading } from '../components/LoadingState';

export default function MainLayout() {
  const { pathname } = useLocation();
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar />
      <main style={{ flex: 1, overflowY: 'auto', padding: '32px 32px 48px', scrollbarGutter: 'stable' }}>
        {/* key re-mounts the page on navigation, triggering fresh page-enter animations */}
        <Suspense fallback={<Loading />}>
          <div key={pathname}>
            <Outlet />
          </div>
        </Suspense>
      </main>
      <AIBox />
    </div>
  );
}
