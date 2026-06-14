import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { GlobalBackground } from './components/layout/GlobalBackground';
import { TopNav } from './components/layout/TopNav';
import { BottomBar } from './components/layout/BottomBar';
import { PageTransition } from './components/layout/PageTransition';
import { ShareFAB } from './components/layout/ShareFAB';
import { AuthModal } from './components/auth/AuthModal';
import { AdminSetupModal } from './components/auth/AdminSetupModal';
import { Home } from './pages/Home';
import { Loading } from './components/ui/Loading';
import { lazy, Suspense } from 'react';

const Qifu = lazy(() => import('./pages/Qifu').then(m => ({ default: m.Qifu })));
const Almanac = lazy(() => import('./pages/Almanac').then(m => ({ default: m.Almanac })));
const Lottery = lazy(() => import('./pages/Lottery').then(m => ({ default: m.Lottery })));
const Bazi = lazy(() => import('./pages/Bazi').then(m => ({ default: m.Bazi })));
const Dream = lazy(() => import('./pages/Dream').then(m => ({ default: m.Dream })));
const Palmistry = lazy(() => import('./pages/Palmistry').then(m => ({ default: m.Palmistry })));
const Naming = lazy(() => import('./pages/Naming').then(m => ({ default: m.Naming })));
const Divination = lazy(() => import('./pages/Divination').then(m => ({ default: m.Divination })));
const Meditation = lazy(() => import('./pages/Meditation').then(m => ({ default: m.Meditation })));
const Profile = lazy(() => import('./pages/Profile').then(m => ({ default: m.Profile })));
const More = lazy(() => import('./pages/More').then(m => ({ default: m.More })));
const Admin = lazy(() => import('./pages/admin/Admin').then(m => ({ default: m.Admin })));
const Temple = lazy(() => import('./pages/Temple').then(m => ({ default: m.Temple })));

function PageLoader() {
  return <Loading className="min-h-screen" />;
}

export default function App() {
  return (
    <AuthProvider>
      <GlobalBackground />
      <TopNav />
      <PageTransition>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/qifu" element={<Qifu />} />
            <Route path="/almanac" element={<Almanac />} />
            <Route path="/lottery" element={<Lottery />} />
            <Route path="/bazi" element={<Bazi />} />
            <Route path="/dream" element={<Dream />} />
            <Route path="/palmistry" element={<Palmistry />} />
            <Route path="/naming" element={<Naming />} />
            <Route path="/divination" element={<Divination />} />
            <Route path="/meditation" element={<Meditation />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/more" element={<More />} />
            <Route path="/incense" element={<Temple />} />
            <Route path="/admin/*" element={<Admin />} />
          </Routes>
        </Suspense>
      </PageTransition>
      <ShareFAB />
      <BottomBar />
      <AuthModal />
      <AdminSetupModal />
    </AuthProvider>
  );
}
