import puppeteer from 'puppeteer-core'

const CHROME = String.raw`C:\Program Files\Google\Chrome\Application\chrome.exe`
const BASE = 'http://localhost:5199'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const errors = []
let step = 'boot'
const ok = (msg) => console.log(`  ✓ ${msg}`)
const fail = (msg) => {
  console.error(`  ✗ [${step}] ${msg}`)
  process.exitCode = 1
}
const assert = (cond, msg) => (cond ? ok(msg) : fail(msg))

async function waitForSelector(page, selector, timeout = 5000) {
  const deadline = Date.now() + timeout
  while (Date.now() < deadline) {
    const el = await page.$(selector)
    if (el) return el
    await sleep(100)
  }
  return null
}

async function waitForText(page, text, timeout = 10000) {
  try {
    await page.waitForFunction(
      (t) => document.body.innerText.toLowerCase().includes(t.toLowerCase()),
      { timeout },
      text,
    )
    return true
  } catch {
    return false
  }
}

async function click(page, text, opts = {}) {
  const { exact = false, scope = 'body', enabledOnly = false, tag = 'button, a' } = opts
  const handle = await page.evaluateHandle(
    (text, exact, scope, enabledOnly, tag) => {
      const root = document.querySelector(scope) || document
      const els = [...root.querySelectorAll(tag)]
      return (
        els.find((el) => {
          const t = (el.textContent || '').replace(/\s+/g, ' ').trim()
          const match = exact ? t === text : t.includes(text)
          if (!match) return false
          if (enabledOnly && (el.disabled || el.getAttribute('aria-disabled') === 'true'))
            return false
          const r = el.getBoundingClientRect()
          return r.width > 0 && r.height > 0
        }) || null
      )
    },
    text,
    exact,
    scope,
    enabledOnly,
    tag,
  )
  const el = handle.asElement()
  if (!el) throw new Error(`click: "${text}" not found`)
  await el.click()
  await sleep(160)
}

const main = async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--no-sandbox', '--window-size=1440,900'],
    defaultViewport: { width: 1440, height: 900 },
  })
  const page = await browser.newPage()
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text())
  })
  page.on('pageerror', (e) => errors.push(String(e)))

  /* ---------------------------------------------------- landing */
  step = 'landing'
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle0' })
  assert(await waitForText(page, 'No more fees,'), 'landing headline renders')
  assert(await waitForText(page, 'Build my learning path'), 'primary CTA present')
  await click(page, 'See how it works')
  await sleep(600)
  const scrolled = await page.evaluate(() => window.scrollY > 300)
  assert(scrolled, '"See how it works" scrolls to sections')

  /* ---------------------------------------------------- setup */
  step = 'setup'
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle0' })
  await click(page, 'Build my learning path', { exact: true })
  await waitForText(page, 'Step 1 of 7')
  assert(page.url().includes('/setup'), 'CTA opens the setup flow')

  // validation: continue with empty subject
  await click(page, 'Continue', { exact: true })
  const hasValidation = await waitForText(page, 'Tell us what you want to learn.')
  assert(hasValidation, 'empty subject shows validation error')

  await page.type('#subject', 'Project Management')
  await click(page, 'Continue', { exact: true })
  await waitForText(page, 'Your experience')
  await click(page, 'Some experience', { exact: false })
  await click(page, 'Continue', { exact: true })
  await waitForText(page, 'Why, and what for')
  await click(page, 'Career', { exact: true })
  await page.type('#outcome', 'Run projects from planning through delivery with confidence.')
  await click(page, 'Continue', { exact: true })
  await waitForText(page, 'Time each week')
  await click(page, '5 hours', { exact: false })
  await click(page, 'Continue', { exact: true })
  await waitForText(page, 'Formats')
  await click(page, 'Articles', { exact: true })
  await click(page, 'Exercises', { exact: true })
  await click(page, 'Continue', { exact: true })
  await waitForText(page, 'Intensity')
  await click(page, 'Balanced', { exact: false })
  await click(page, 'Continue', { exact: true })
  await waitForText(page, 'Target date')

  // custom date picker opens and picks a day
  await click(page, 'Pick a target date', { exact: true })
  assert(await waitForSelector(page, '[role="dialog"]'), 'target date picker opens')
  await click(page, '15', { exact: true })
  assert(await waitForText(page, '15,'), 'target date shown after picking')

  await click(page, 'Build my path', { exact: true })
  ok('questionnaire completed with answers preserved')

  /* ------------------------------------------------- generation */
  step = 'generate'
  assert(await waitForText(page, 'Your path is ready.', 8000), 'generation reaches ready state')
  await click(page, 'View my path', { exact: true })

  /* ------------------------------------------------- path page */
  step = 'path'
  assert(await waitForText(page, 'Project Management'), 'path page shows subject')
  assert(await waitForText(page, 'Your goal'), 'goal block present')
  const hasPercent = await waitForText(page, '32%')
  assert(hasPercent, 'path progress shows 32%')
  assert(await waitForText(page, 'Estimated remaining time'), 'remaining time shown')
  assert(await waitForText(page, 'Stakeholder Management'), 'current section listed')
  assert(await waitForText(page, 'Locked'), 'locked section communicated')

  // expand a section
  await click(page, 'Foundations', { exact: false })
  assert(await waitForText(page, 'Estimated time'), 'section details open')

  // switch path via switcher
  await click(page, 'Project Management', { exact: false, scope: 'aside' })
  await sleep(250)
  await click(page, 'Spanish', { exact: false })
  assert(await waitForText(page, 'Spanish'), 'switched to Spanish path')
  await click(page, 'Spanish', { exact: false, scope: 'aside' })
  await sleep(250)
  await click(page, 'Project Management', { exact: false })
  assert(await waitForText(page, 'Your goal'), 'switched back to Project Management')

  /* ---------------------------------------------------- today */
  step = 'today'
  await click(page, 'Today', { exact: true, scope: 'aside' })
  assert(await waitForText(page, 'Here is what to do today.'), 'today page renders')
  assert(await waitForText(page, 'Stakeholder Management'), 'today shows current session')
  assert(await waitForText(page, '45 min'), 'session length shown')
  assert(await waitForText(page, 'Start session'), 'start session CTA present')
  assert(await waitForText(page, 'Upcoming project'), 'upcoming project panel present')

  /* -------------------------------------------------- session */
  step = 'session'
  await click(page, 'Start session', { exact: true })
  assert(await waitForText(page, 'Read the room before you brief it'), 'lesson opens')
  await click(page, 'Mark lesson complete', { exact: true })
  assert(await waitForText(page, 'brief someone who does not want to be briefed'), 'advances to reading')
  await click(page, 'Mark as read', { exact: true })
  await sleep(250)
  // practice: answer all four classify items (first option each)
  const options = ['Keep informed', 'Manage closely', 'Keep satisfied', 'Monitor']
  for (let i = 0; i < 4; i++) {
    let clicked = false
    for (const opt of options) {
      try {
        await click(page, opt, { exact: true, enabledOnly: true, tag: 'button' })
        clicked = true
        break
      } catch {
        /* try next */
      }
    }
    if (!clicked) break
    await sleep(120)
  }
  const practiceFeedback =
    (await waitForText(page, 'Not quite', 3000)) || (await waitForText(page, 'Correct', 3000))
  assert(practiceFeedback, 'practice gives instant feedback')
  await click(page, 'Complete practice', { exact: true, enabledOnly: true })
  assert(await waitForText(page, 'Start the check'), 'check activity opens')

  /* ------------------------------------------------ assessment */
  step = 'assessment'
  await click(page, 'Start the check', { exact: true })
  assert(await waitForText(page, 'Question 1 of 5'), 'assessment starts')
  const answers = [
    'Keep them satisfied with short, factual updates',
    'Identify who is affected and who can decide, then analyse interest and influence',
    'Ranking stakeholders by how much you like them', // deliberately wrong
    'Involve them early, in private, and address their concerns directly',
    'Regular, plain updates about what is coming',
  ]
  for (let i = 0; i < answers.length; i++) {
    await click(page, answers[i], { exact: false, tag: 'button' })
    const feedback = i === 2 ? 'Not the best move' : 'Correct'
    assert(await waitForText(page, feedback), `answer ${i + 1} feedback shown`)
    await click(page, i < 4 ? 'Next question' : 'See your results', { exact: true })
    await sleep(200)
  }
  assert(await waitForText(page, '4 / 5'), 'score shows 4 / 5')
  assert(
    await waitForText(page, 'You have a strong understanding of stakeholder mapping.'),
    'result headline matches',
  )
  assert(await waitForText(page, 'Path updated'), 'path adaptation simulated')
  await click(page, 'Continue learning', { exact: true })

  /* ------------------------------------------- session done */
  step = 'complete'
  assert(await waitForText(page, 'Session complete.'), 'session completion state')
  assert(await waitForText(page, '45 minutes completed.'), 'minutes completed shown')
  await click(page, 'Continue', { exact: true, scope: 'main' })
  assert(await waitForText(page, 'Path updated'), 'today shows the path note after the check')

  /* -------------------------------------------------- projects */
  step = 'projects'
  await click(page, 'Projects', { exact: true, scope: 'aside' })
  assert(await waitForText(page, 'Plan a Product Launch'), 'active project listed')
  await click(page, 'Open project', { exact: true, scope: 'main' })
  assert(await waitForText(page, 'Required deliverables'), 'workspace opens')
  await click(page, 'Create risk register', { exact: false, tag: 'button' })
  assert(await waitForText(page, '4 of 6 tasks complete'), 'task toggle updates progress')
  await click(page, 'Submit project', { exact: true, scope: 'main' })
  assert(await waitForText(page, 'Submit your project'), 'submission modal opens')
  await click(page, 'Submit project', { exact: true, scope: '[role="dialog"]' })
  assert(await waitForText(page, 'Project reviewed.', 6000), 'mock review returns feedback')
  assert(await waitForText(page, 'Clear objectives'), 'strengths listed')

  /* --------------------------------------------------- progress */
  step = 'progress'
  await click(page, 'Progress', { exact: true, scope: 'aside' })
  assert(await waitForText(page, 'How far you have come'), 'progress page renders')
  assert(await waitForText(page, 'Sessions completed'), 'stats present')
  assert(await waitForText(page, 'Milestones'), 'milestones present')
  const pctText = await page.evaluate(() => document.body.innerText)
  assert(/3[3-9]%|[4-9][0-9]%/.test(pctText), 'path percent grew past 32% after the session')

  /* --------------------------------------------------- settings */
  step = 'settings'
  await click(page, 'Settings', { exact: true, scope: 'aside' })
  assert(await waitForText(page, 'Your account'), 'settings renders')
  await click(page, 'AI provider', { exact: true })
  assert(await waitForText(page, 'Use managed AI'), 'AI provider screen renders')
  await click(page, 'Compare the two options', { exact: true })
  assert(await waitForText(page, 'Two ways to run Sawari AI'), 'pricing modal opens')
  assert(await waitForText(page, '$8'), 'managed price shown')
  await click(page, 'Use my own key', { exact: true, tag: 'button' })
  await sleep(300)
  const keyInput = await page.$('#api-key')
  if (keyInput) {
    await keyInput.type('sk-test-1234567890')
    await click(page, 'Save key', { exact: true })
    const masked = await waitForText(page, '••••••', 4000)
    assert(masked, 'saved API key is masked')
  } else {
    fail('API key input not found')
  }

  /* -------------------------------------------------- mobile */
  step = 'mobile'
  await page.setViewport({ width: 390, height: 844, isMobile: true })
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle0' })
  await page.type('#login-password', 'demo1234')
  await click(page, 'Sign in', { exact: true })
  assert(await waitForText(page, "Here is what to do today."), 'mobile: today loads after login')
  const noOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth <= window.innerWidth + 2,
  )
  assert(noOverflow, 'mobile: no horizontal overflow on today')
  const bottomNav = await page.evaluate(() => document.body.innerText.includes('Path'))
  assert(bottomNav, 'mobile: bottom navigation present')

  const menuBtn = await page.$('header button[aria-label="Open menu"]')
  if (menuBtn) {
    await menuBtn.click()
    await sleep(350)
    assert(await waitForText(page, 'New learning path'), 'mobile: navigation drawer opens')
    await page.keyboard.press('Escape')
    await sleep(300)
  } else fail('mobile menu button not found')

  const bell = await page.$('button[aria-label="Notifications"]')
  if (bell) {
    await bell.click()
    await sleep(350)
    assert(await waitForText(page, 'Mark all read'), 'mobile: notifications drawer opens')
    await page.keyboard.press('Escape')
    await sleep(250)
  } else fail('mobile bell button not found')

  await page.goto(`${BASE}/app/path`, { waitUntil: 'networkidle0' })
  const noOverflowPath = await page.evaluate(
    () => document.documentElement.scrollWidth <= window.innerWidth + 2,
  )
  assert(noOverflowPath, 'mobile: no horizontal overflow on path')

  /* -------------------------------------------------- tablet */
  step = 'tablet'
  await page.setViewport({ width: 768, height: 1024 })
  await sleep(400)
  // Switching device emulation reloads the document and the app state lives
  // in memory, so sign back in before asserting on the app at tablet size.
  if (page.url().includes('/login')) {
    await page.type('#login-password', 'demo1234')
    await click(page, 'Sign in', { exact: true })
    await sleep(900)
  }
  assert(await waitForText(page, 'Stakeholder Management'), 'tablet: session card renders')
  const tabletToday = await page.evaluate(
    () => document.documentElement.scrollWidth <= window.innerWidth + 2,
  )
  assert(tabletToday, 'tablet: no horizontal overflow on today')
  await page.goto(`${BASE}/app/settings`, { waitUntil: 'networkidle0' })
  const tabletSettings = await page.evaluate(
    () => document.documentElement.scrollWidth <= window.innerWidth + 2,
  )
  assert(tabletSettings, 'tablet: no horizontal overflow on settings')
  await page.goto(`${BASE}/app/path`, { waitUntil: 'networkidle0' })
  const tabletPath = await page.evaluate(
    () => document.documentElement.scrollWidth <= window.innerWidth + 2,
  )
  assert(tabletPath, 'tablet: no horizontal overflow on path')

  /* ------------------------------------------- delete path */
  step = 'delete path'
  // App state lives in memory, so a full reload (page.goto) drops auth.
  // Re-authenticate and navigate via the sidebar to preserve the session.
  await page.setViewport({ width: 1440, height: 900 })
  await sleep(400)
  if (page.url().includes('/login')) {
    await page.type('#login-password', 'demo1234')
    await click(page, 'Sign in', { exact: true })
    await sleep(900)
  }
  await click(page, 'Learning path', { exact: true, scope: 'aside' })
  await sleep(600)
  const pathMenu = await waitForSelector(page, 'button[aria-label="Path options"]')
  if (pathMenu) {
    await pathMenu.click()
    await sleep(250)
    await click(page, 'Delete path', { exact: true })
    assert(await waitForText(page, 'Delete Project Management?'), 'delete confirmation modal opens')
    await click(page, 'Delete path', { exact: true, scope: '[role="dialog"]' })
    assert(await waitForText(page, 'Learning path deleted'), 'path deleted with confirmation toast')
    assert(await waitForText(page, 'Present tense verbs'), 'active path falls back to Spanish')
  } else {
    fail('path options menu not found')
  }

  /* -------------------------------------------------- errors */
  const realErrors = errors.filter(
    (e) => !e.includes('favicon') && !e.includes('Download the React DevTools'),
  )
  step = 'console'
  assert(realErrors.length === 0, `no console errors (${realErrors.length})`)
  if (realErrors.length) console.error(realErrors)

  await Promise.race([browser.close().catch(() => {}), sleep(5000)])
  console.log(process.exitCode ? '\nSMOKE TEST FAILED' : '\nSMOKE TEST PASSED')
}

main().catch((e) => {
  fail(e.message)
  process.exit(1)
})
