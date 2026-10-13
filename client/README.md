# Sawari

Learn anything. Make it yours.

A complete frontend for a personalized learning platform. React + TypeScript + Tailwind CSS,
backed by the Sawari API in `../server`: screens load paths, projects and settings from the
server through `src/lib/api.ts`, with local state only as a cache.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
```

Other scripts:

```bash
npm run build      # typecheck + production build
npm run lint       # oxlint
npm run smoke      # drives the whole product flow in Chrome (dev server must be running)
```

## The flow

Landing → Build my learning path → 7 step setup → plan generation → learning path → Today →
learning session (learn, read, practice, check) → assessment with results → path adaptation →
project workspace → progress → settings.

Everything is clickable: sessions complete, checks update progress, tasks toggle, projects get
submitted and reviewed, paths switch, settings persist in state.

## Structure

```
src/
  types/        domain types
  data/         mock data: paths, session content, projects, progress, notifications, templates
  state/        reducer store (AppProvider) + useApp hook
  components/
    ui/         Button, Modal, Drawer, ProgressBar, Chip, Toggle, Tabs, Toasts, Logo
    layout/     AppShell, Sidebar, PathSwitcher, PageHeader, nav config
    learn/      lesson, resource, practice and check activity views
    modals/     resource preview, edit preferences, confirm, submit project
    settings/   AI provider section with pricing modal
    landing/    product visuals used on the landing page
  pages/        Landing, Setup, Generate, Path, Today, Session, Assessment,
                Projects, ProjectWorkspace, Progress, Settings, Login
scripts/        smoke test (puppeteer-core)
```

## Notes

- Backend lives in `../server`; auth, AI key storage and email run server-side.
- The AI provider screen stores keys via the API: saved keys are shown masked and never in full.
- Paths are AI-built per learner; there is no bundled starter catalogue or guest example path.
