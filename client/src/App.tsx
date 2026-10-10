import { lazy, Suspense, useEffect, useRef, type ReactNode } from 'react'
import {
  BrowserRouter as Router,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from 'react-router-dom'
import { useApp } from './state/store'
import { useAlert } from './state/alertContext'
import { AppProvider } from './state/AppProvider'
import { AlertProvider } from './state/AlertProvider'
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
  if (state.authStatus === 'checking') return <RouteFallback />
  if (!state.user) return <Navigate to="/login" replace />
  return children
}

const providerName = (provider: string | null) =>
  provider === 'google' ? 'Google' : provider === 'github' ? 'GitHub' : 'That'

/** Handles the ?oauth=… query the backend adds when bouncing back from a provider. */
function OAuthResultHandler() {
  const { refreshSession } = useApp()
  const alert = useAlert()
  const navigate = useNavigate()
  const { search } = useLocation()
  const handled = useRef(false)

  useEffect(() => {
    const params = new URLSearchParams(search)
    const result = params.get('oauth')
    if (!result || handled.current) return
    handled.current = true

    if (result === 'success') {
      refreshSession()
        .then(() => {
          alert.success('Signed in. Welcome to Sawari.')
          navigate('/app/today', { replace: true })
        })
        .catch(() => {
          alert.error('We could not finish signing you in. Please try again.')
          navigate('/login', { replace: true })
        })
      return
    }

    if (result === 'unavailable') {
      alert.warning(`${providerName(params.get('provider'))} sign in is not available right now.`)
    } else {
      alert.error('That sign in did not complete. Please try again.')
    }
    navigate('/login', { replace: true })
  }, [search, navigate, refreshSession, alert])

  return null
}

function App() {
  return (
    <AlertProvider>
      <AppProvider>
        <Router>
          <OAuthResultHandler />
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
        </Router>
      </AppProvider>
    </AlertProvider>
  )
}

export default App
