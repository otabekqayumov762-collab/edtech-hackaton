import { Suspense, lazy, useEffect } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AppProvider } from './store/AppContext';
import { useApp } from './store/useApp';
import { XpToasts } from './components/XpToasts';
import { CoinFly, LevelUpOverlay } from './components/fx';
import { Confetti } from './components/Confetti';
import { MarketingLayout } from './layout/MarketingLayout';
import { AppLayout } from './layout/AppLayout';
// High-priority routes — eager import to avoid blank screen during navigation
import { Landing } from './pages/marketing/Landing';
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
const Dashboard = lazy(() =>
  import('./pages/app/Dashboard').then((m) => ({ default: m.Dashboard }))
);
const Tests = lazy(() =>
  import('./pages/app/Tests').then((m) => ({ default: m.Tests }))
);
const TestRunner = lazy(() =>
  import('./pages/app/TestRunner').then((m) => ({ default: m.TestRunner }))
);
const Practice = lazy(() =>
  import('./pages/app/Practice').then((m) => ({ default: m.Practice }))
);
const Leaderboard = lazy(() =>
  import('./pages/app/Leaderboard').then((m) => ({ default: m.Leaderboard }))
);
const Statistics = lazy(() =>
  import('./pages/app/Statistics').then((m) => ({ default: m.Statistics }))
);
const Achievements = lazy(() =>
  import('./pages/app/Achievements').then((m) => ({ default: m.Achievements }))
);
const AIAssistant = lazy(() =>
  import('./pages/app/AIAssistant').then((m) => ({ default: m.AIAssistant }))
);
const Profile = lazy(() =>
  import('./pages/app/Profile').then((m) => ({ default: m.Profile }))
);
const Pricing = lazy(() =>
  import('./pages/app/Pricing').then((m) => ({ default: m.Pricing }))
);
const FlashCards = lazy(() =>
  import('./pages/app/FlashCards').then((m) => ({ default: m.FlashCards }))
);
const Tournaments = lazy(() =>
  import('./pages/app/Tournaments').then((m) => ({ default: m.Tournaments }))
);
const DuelArena = lazy(() =>
  import('./pages/app/DuelArena').then((m) => ({ default: m.DuelArena }))
);
const Teams = lazy(() =>
  import('./pages/app/Teams').then((m) => ({ default: m.Teams }))
);
const Friends = lazy(() =>
  import('./pages/app/Friends').then((m) => ({ default: m.Friends }))
);
const Shop = lazy(() =>
  import('./pages/app/Shop').then((m) => ({ default: m.Shop }))
);
const StepTime = lazy(() =>
  import('./pages/onboarding/StepTime').then((m) => ({ default: m.StepTime }))
);
const StepSubjects = lazy(() =>
  import('./pages/onboarding/StepSubjects').then((m) => ({
    default: m.StepSubjects,
  }))
);
const StepTest = lazy(() =>
  import('./pages/onboarding/StepTest').then((m) => ({ default: m.StepTest }))
);
const StepResult = lazy(() =>
  import('./pages/onboarding/StepResult').then((m) => ({
    default: m.StepResult,
  }))
);
const CourseSubjects = lazy(() =>
  import('./pages/app/courses/CourseSubjects').then((m) => ({
    default: m.CourseSubjects,
  }))
);
const CourseGrades = lazy(() =>
  import('./pages/app/courses/CourseGrades').then((m) => ({
    default: m.CourseGrades,
  }))
);
const CourseSections = lazy(() =>
  import('./pages/app/courses/CourseSections').then((m) => ({
    default: m.CourseSections,
  }))
);
const CourseAudio = lazy(() =>
  import('./pages/app/courses/CourseAudio').then((m) => ({
    default: m.CourseAudio,
  }))
);
const CoursePractice = lazy(() =>
  import('./pages/app/courses/CoursePractice').then((m) => ({
    default: m.CoursePractice,
  }))
);
const CourseTest = lazy(() =>
  import('./pages/app/courses/CourseTest').then((m) => ({
    default: m.CourseTest,
  }))
);

function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (!hash) window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}

function FxLayer() {
  const { fxCoinFly, clearCoinFly, levelUp, clearLevelUp } = useApp();
  return (
    <>
      <AnimatePresence>
        {levelUp !== null && (
          <>
            <Confetti count={36} />
            <LevelUpOverlay
              key={`lvl-overlay-${levelUp}`}
              level={levelUp}
              onDismiss={clearLevelUp}
            />
          </>
        )}
      </AnimatePresence>
      {fxCoinFly && (
        <CoinFly
          key={fxCoinFly.ts}
          count={fxCoinFly.count}
          onDone={clearCoinFly}
        />
      )}
    </>
  );
}

function PageFallback() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent opacity-60" />
    </div>
  );
}

function AppRoutes() {
  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        <Route element={<MarketingLayout />}>
            <Route path="/" element={<Landing />} />
          </Route>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/onboarding">
            <Route index element={<Navigate to="vaqt" replace />} />
            <Route path="vaqt" element={<StepTime />} />
            <Route path="fanlar" element={<StepSubjects />} />
            <Route path="test" element={<StepTest />} />
            <Route path="natija" element={<StepResult />} />
          </Route>
          <Route path="/app" element={<AppLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="testlar" element={<Tests />} />
            <Route path="testlar/:id" element={<TestRunner />} />
            <Route path="mashqlar" element={<Practice />} />
            <Route path="reyting" element={<Leaderboard />} />
            <Route path="statistika" element={<Statistics />} />
            <Route path="yutuqlar" element={<Achievements />} />
            <Route path="ai" element={<AIAssistant />} />
            <Route path="profil" element={<Profile />} />
            <Route path="tarif" element={<Pricing />} />
            <Route path="flash" element={<FlashCards />} />
            <Route path="turnir" element={<Tournaments />} />
            <Route path="duel" element={<DuelArena />} />
            <Route path="jamoa" element={<Teams />} />
            <Route path="dostlar" element={<Friends />} />
            <Route path="dokon" element={<Shop />} />
            <Route path="fan" element={<CourseSubjects />} />
            <Route path="fan/:subject/sinf" element={<CourseGrades />} />
            <Route path="fan/:subject/sinf/:grade" element={<CourseSections />} />
            <Route path="fan/:subject/sinf/:grade/audio" element={<CourseAudio />} />
            <Route path="fan/:subject/sinf/:grade/mashq" element={<CoursePractice />} />
            <Route path="fan/:subject/sinf/:grade/test" element={<CourseTest />} />
          </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <ScrollToTop />
        <XpToasts />
        <FxLayer />
        <AppRoutes />
      </AppProvider>
    </BrowserRouter>
  );
}
