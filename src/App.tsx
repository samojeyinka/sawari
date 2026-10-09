import { lazy, Suspense, type ReactNode } from 'react'
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom'
import { useApp } from './state/store'
import { AppProvider } from './state/AppProvider'
import { Toasts } from './components/ui/Toasts'
import { AppShell } from './components/layout/AppShell'
import { LandingPage } from './pages/Landing'
import { RouteFallback } from './components/ui/RouteFallback'

/* Landing stays eager so the entry paint is instant; every other screen
   loads as its own chunk. */
const LoginPage = lazy(() => import('./pages/Login').then((m) => ({ default: m.LoginPage })))
const SetupPage = lazy(() => import('./pages/Setup').then((m) => ({ default: m.SetupPage })))
const GeneratePage = lazy(() => import('./pages/Generate').then((m) => ({ default: m.GeneratePage })))
const TodayPage = lazy(() => import('./pages/Today').then((m) => ({ default: m.TodayPage })))
const PathPage = lazy(() => import('./pages/Path').then((m) => ({ default: m.PathPage })))
const SessionPage = lazy(() => import('./pages/Session').then((m) => ({ default: m.SessionPage })))
const AssessmentPage = lazy(() => import('./pages/Assessment').then((m) => ({ default: m.AssessmentPage })))
const ProjectsPage = lazy(() => import('./pages/Projects').then((m) => ({ default: m.ProjectsPage })))
const ProjectWorkspacePage = lazy(() =>
  import('./pages/ProjectWorkspace').then((m) => ({ default: m.ProjectWorkspacePage })),
)
const ProgressPage = lazy(() => import('./pages/Progress').then((m) => ({ default: m.ProgressPage })))
const SettingsPage = lazy(() => import('./pages/Settings').then((m) => ({ default: m.SettingsPage })))

function RequireAuth({ children }: { children: ReactNode }) {
  const { state } = useApp()
  if (!state.user) return <Navigate to="/login" replace />
  return children
}

function App() {
  return (
    <AppProvider>
      <Router>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/setup" element={<SetupPage />} />
            <Route path="/generate" element={<GeneratePage />} />

            <Route
              path="/app"
              element={
                <RequireAuth>
                  <AppShell />
                </RequireAuth>
              }
            >
              <Route index element={<Navigate to="/app/today" replace />} />
              <Route path="today" element={<TodayPage />} />
              <Route path="path" element={<PathPage />} />
              <Route path="session/:sectionId" element={<SessionPage />} />
              <Route path="assessment/:sectionId" element={<AssessmentPage />} />
              <Route path="projects" element={<ProjectsPage />} />
              <Route path="projects/:projectId" element={<ProjectWorkspacePage />} />
              <Route path="progress" element={<ProgressPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
        <Toasts />
      </Router>
    </AppProvider>
  )
}

export default App
