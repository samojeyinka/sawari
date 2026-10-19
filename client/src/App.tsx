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
import { saveLastAuth } from './lib/lastAuth'
import { AppProvider } from './state/AppProvider'
import { AlertProvider } from './state/AlertProvider'
import { AppShell } from './components/layout/AppShell'
import { LandingPage } from './pages/Landing'
import { RouteFallback } from './components/ui/RouteFallback'

/* Landing stays eager so the entry paint is instant; every other screen
   loads as its own chunk. */
const LoginPage = lazy(() => import('./pages/Login').then((m) => ({ default: m.LoginPage })))
const DeleteAccountPage = lazy(() =>
  import('./pages/DeleteAccount').then((m) => ({ default: m.DeleteAccountPage })),
)
const RestoreAccountPage = lazy(() =>
  import('./pages/RestoreAccount').then((m) => ({ default: m.RestoreAccountPage })),
)
const ResetPasswordPage = lazy(() =>
  import('./pages/ResetPassword').then((m) => ({ default: m.ResetPasswordPage })),
)
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
const SavedCoursesPage = lazy(() =>
  import('./pages/SavedCourses').then((m) => ({ default: m.SavedCoursesPage })),
)
const StartCoursePage = lazy(() =>
  import('./pages/StartCourse').then((m) => ({ default: m.StartCoursePage })),
)
const SaveCoursePage = lazy(() =>
  import('./pages/SaveCourse').then((m) => ({ default: m.SaveCoursePage })),
)
const ReviewCoursePage = lazy(() =>
  import('./pages/ReviewCourse').then((m) => ({ default: m.ReviewCoursePage })),
)
const AdminCatalogPage = lazy(() =>
  import('./pages/AdminCatalog').then((m) => ({ default: m.AdminCatalogPage })),
)
const AdminCatalogEditPage = lazy(() =>
  import('./pages/AdminCatalogEdit').then((m) => ({ default: m.AdminCatalogEditPage })),
)
const PrivacyPage = lazy(() => import('./pages/Privacy').then((m) => ({ default: m.PrivacyPage })))
const TermsPage = lazy(() => import('./pages/Terms').then((m) => ({ default: m.TermsPage })))
const CertificatePage = lazy(() =>
  import('./pages/Certificate').then((m) => ({ default: m.CertificatePage })),
)
const VerifyCertificatePage = lazy(() =>
  import('./pages/VerifyCertificate').then((m) => ({ default: m.VerifyCertificatePage })),
)

function RequireAuth({ children }: { children: ReactNode }) {
  const { state } = useApp()
  const location = useLocation()
  if (state.authStatus === 'checking') return <RouteFallback />
  if (!state.user) {
    const returnTo = `${location.pathname}${location.search}`
    return <Navigate to={`/login?returnTo=${encodeURIComponent(returnTo)}`} replace />
  }
  if (state.dataStatus !== 'ready') return <RouteFallback />
  return children
}

/** Admin-only screens (catalog curation). Non-admins bounce to Today. */
function RequireAdmin({ children }: { children: ReactNode }) {
  const { state } = useApp()
  if (state.user?.role !== 'admin') return <Navigate to="/app/today" replace />
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
      const provider = params.get('provider')
      if (provider === 'github' || provider === 'google') {
        saveLastAuth({ method: provider })
      }
      const stored = sessionStorage.getItem('sawari:returnTo')
      sessionStorage.removeItem('sawari:returnTo')
      const resume = stored && stored.startsWith('/') ? stored : '/app/today'
      refreshSession()
        .then((user) => {
          alert.success('Signed in. Welcome to Sawari.')
          navigate(user.role === 'admin' ? '/app/admin' : resume, { replace: true })
        })
        .catch(() => {
          alert.error('We could not finish signing you in. Please try again.')
          navigate('/login', { replace: true })
        })
      return
    }

    if (result === 'unavailable') {
      alert.warning(`${providerName(params.get('provider'))} sign in is not available right now.`)
    } else if (result === 'deleted') {
      alert.error('That account was deleted. Restore it within 30 days from your email link.')
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
              <Route path="/delete-account" element={<DeleteAccountPage />} />
              <Route path="/restore-account" element={<RestoreAccountPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/setup" element={<SetupPage />} />
              <Route path="/generate" element={<GeneratePage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route
                path="/start/:slug"
                element={
                  <RequireAuth>
                    <StartCoursePage />
                  </RequireAuth>
                }
              />
              <Route
                path="/save/:slug"
                element={
                  <RequireAuth>
                    <SaveCoursePage />
                  </RequireAuth>
                }
              />
              <Route
                path="/review/:slug"
                element={
                  <RequireAuth>
                    <ReviewCoursePage />
                  </RequireAuth>
                }
              />
              <Route
                path="/certificate/:slug"
                element={
                  <RequireAuth>
                    <CertificatePage />
                  </RequireAuth>
                }
              />
              <Route path="/verify/:credentialId" element={<VerifyCertificatePage />} />

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
                <Route path="saved" element={<SavedCoursesPage />} />
                <Route path="certificate/:slug" element={<CertificatePage />} />
                <Route path="session/:sectionId" element={<SessionPage />} />
                <Route path="assessment/:sectionId" element={<AssessmentPage />} />
                <Route path="projects" element={<ProjectsPage />} />
                <Route path="projects/:projectId" element={<ProjectWorkspacePage />} />
                <Route path="progress" element={<ProgressPage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route
                  path="admin"
                  element={
                    <RequireAdmin>
                      <AdminCatalogPage />
                    </RequireAdmin>
                  }
                />
                <Route
                  path="admin/new"
                  element={
                    <RequireAdmin>
                      <AdminCatalogEditPage />
                    </RequireAdmin>
                  }
                />
                <Route
                  path="admin/:id"
                  element={
                    <RequireAdmin>
                      <AdminCatalogEditPage />
                    </RequireAdmin>
                  }
                />
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
