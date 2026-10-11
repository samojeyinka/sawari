/* ------------------------------------------------------------------ */
/*  Simulated goal extraction for the setup flow.                      */
/*                                                                     */
/*  The real version will send the profile or the build idea to the    */
/*  AI provider and read back a niche plus its skills. Until the        */
/*  provider is funded we match keywords locally so the flow can be    */
/*  demonstrated end to end. Swap `extractGoal` for the API call later.*/
/* ------------------------------------------------------------------ */

export type GoalMode = 'topic' | 'admire' | 'build'

export interface GoalExtraction {
  /** Subject the path is built around (feeds sectionsForSubject). */
  subject: string
  /** One-line goal written into the path. */
  outcome: string
  /** Skills the person's niche or the build draws on. */
  skills: string[]
  /** The person's name, or a short label for the thing to build. */
  label: string
  note: string
}

interface Archetype {
  keys: string[]
  subject: string
  role: string
  skills: string[]
}

const ARCHETYPES: Archetype[] = [
  {
    keys: ['product design', 'product manager', 'product manag', 'product owner', 'product lead', 'roadmap', 'product '],
    subject: 'Product Management',
    role: 'product manager',
    skills: ['Product discovery', 'Roadmapping', 'User research', 'Prioritisation', 'Metrics', 'Stakeholder management', 'Delivery'],
  },
  {
    keys: ['design', 'designer', 'ux', 'ui/', 'ui ', 'figma', 'visual', 'typography', 'illustrat'],
    subject: 'Graphic Design',
    role: 'designer',
    skills: ['Composition', 'Typography', 'Colour', 'Layout systems', 'Design for screens', 'Prototyping', 'Portfolio'],
  },
  {
    keys: ['marketing', 'growth', 'seo', 'brand', 'content strategy', 'social media', 'paid ads', 'campaign', 'youtube', 'podcast'],
    subject: 'Digital Marketing',
    role: 'marketer',
    skills: ['Audience research', 'Positioning', 'Content strategy', 'SEO', 'Paid channels', 'Analytics', 'Campaign planning'],
  },
  {
    keys: ['copywrit', 'copywriter', 'writing', 'writer', 'journalis', 'author', 'novel', 'newsletter'],
    subject: 'Copywriting',
    role: 'writer',
    skills: ['Reader research', 'Hooks & headlines', 'Structure', 'Voice', 'Editing', 'Storytelling', 'Publishing rhythm'],
  },
  {
    keys: ['data', 'analytics', 'analyst', 'sql', 'machine learning', 'statistic', 'business intelligence', 'dashboard'],
    subject: 'Data Analysis',
    role: 'data analyst',
    skills: ['Framing questions', 'Data cleaning', 'Spreadsheets & SQL', 'Statistics', 'Visualisation', 'Storytelling', 'Experimentation'],
  },
  {
    keys: ['app dev', 'mobile', 'ios', 'android', 'flutter', 'react native', 'app '],
    subject: 'App Development',
    role: 'app developer',
    skills: ['UI foundations', 'State & navigation', 'APIs', 'Local storage', 'Testing', 'Performance', 'Store release'],
  },
  {
    keys: ['web dev', 'web develop', 'frontend', 'front-end', 'backend', 'back-end', 'full stack', 'fullstack', 'software', 'engineer', 'developer', 'programming', 'coding', 'javascript', 'react', 'saas', 'api'],
    subject: 'Web Development',
    role: 'software engineer',
    skills: ['HTML & CSS', 'JavaScript', 'A frontend framework', 'APIs & backends', 'Databases', 'Testing', 'Deployment'],
  },
  {
    keys: ['game dev', 'gamedev', 'game', 'unity', 'unreal'],
    subject: 'Game Development',
    role: 'game developer',
    skills: ['Game loops', 'A game engine', 'Level design', 'Assets & audio', 'Playtesting', 'Performance', 'Shipping'],
  },
  {
    keys: ['finance', 'financial', 'account', 'cfo', 'invest', 'budget', 'bookkeeping', 'trading', 'economics'],
    subject: 'Finance',
    role: 'finance lead',
    skills: ['Reading statements', 'Budgeting', 'Cash flow', 'Forecasting', 'Investing basics', 'Risk', 'Financial planning'],
  },
  {
    keys: ['public speaking', 'speaker', 'keynote', 'presentation', 'presenter', 'toastmaster'],
    subject: 'Public Speaking',
    role: 'speaker',
    skills: ['Message', 'Structure', 'Delivery', 'Voice & pacing', 'Handling nerves', 'Storytelling', 'Audience reading'],
  },
  {
    keys: ['project manag', 'project manager', 'pmo', 'operations', 'ops ', 'agile', 'scrum', 'coordination'],
    subject: 'Project Management',
    role: 'project manager',
    skills: ['Scoping', 'Planning & scheduling', 'Stakeholder mapping', 'Risk', 'Budgeting', 'Agile delivery', 'Reviews'],
  },
  {
    keys: ['photo', 'camera', 'videograph', 'filmmaking'],
    subject: 'Photography',
    role: 'photographer',
    skills: ['Exposure', 'Composition', 'Lighting', 'Lenses', 'Editing', 'Storytelling', 'A portfolio'],
  },
  {
    keys: ['startup', 'founder', 'entrepreneur', 'business', 'ecommerce', 'company', 'venture', 'monetis', 'monetiz'],
    subject: 'Entrepreneurship',
    role: 'founder',
    skills: ['Idea validation', 'Customer discovery', 'Building an MVP', 'Positioning', 'Pricing', 'Go-to-market', 'Unit economics'],
  },
  {
    keys: ['sales', 'account executive', 'selling', 'business development', 'negotiation', 'cold outreach'],
    subject: 'Sales',
    role: 'sales lead',
    skills: ['Prospecting', 'Discovery calls', 'Pitching', 'Objection handling', 'Negotiation', 'Pipeline management', 'Closing'],
  },
  {
    keys: ['teach', 'teacher', 'educat', 'tutor', 'curriculum', 'instructional'],
    subject: 'Teaching',
    role: 'teacher',
    skills: ['Learning design', 'Explaining clearly', 'Sequencing', 'Assessment', 'Feedback', 'Classroom craft', 'Materials'],
  },
]

const GENERIC: Archetype = {
  keys: [],
  subject: 'Professional Skills',
  role: 'practitioner',
  skills: ['Fundamentals', 'Deliberate practice', 'Feedback loops', 'Real projects', 'Review & reflection', 'Consistent rhythm', 'Focus'],
}

function titleCase(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
}

function matchArchetype(text: string): Archetype {
  const hay = text.toLowerCase()
  let best = GENERIC
  let bestScore = 0
  for (const archetype of ARCHETYPES) {
    let score = 0
    for (const key of archetype.keys) if (hay.includes(key)) score += key.length
    if (score > bestScore) {
      bestScore = score
      best = archetype
    }
  }
  return best
}

/** Pull a readable name out of a LinkedIn URL, or accept a plain name. */
function personName(raw: string): string {
  const text = raw.trim()
  const match = text.match(/linkedin\.com\/in\/([^/?#]+)/i)
  let base = match ? decodeURIComponent(match[1]) : text
  if (match) {
    base = base.replace(/-[0-9a-f]{6,}$/i, '').replace(/-?\d+$/g, '').replace(/[-_]+/g, ' ')
  } else {
    base = base.replace(/https?:\/\/\S+/i, '').replace(/[|,].*$/, '').trim()
  }
  const words = base.split(/\s+/).filter(Boolean).slice(0, 3)
  if (words.length === 0) return 'this person'
  return words.map(titleCase).join(' ')
}

/** Reduce "I want to build a booking site" to "a booking site". */
function thingLabel(raw: string): string {
  let text = raw.trim().replace(/\s+/g, ' ').split(/[.;\n]/)[0]
  text = text.replace(/^(i\s+want\s+to|i\s+would\s+like\s+to|i'?d\s+like\s+to|i\s+want|i\s+need\s+to|my\s+goal\s+is\s+to)\s+/i, '')
  text = text.replace(/^(build|make|create|design|develop|write|start|launch|ship)\s+/i, '')
  if (text.length > 70) text = `${text.slice(0, 67).trimEnd()}…`
  return text || 'this idea'
}

function derivedSubject(label: string): string {
  const stop = new Set(['a', 'an', 'the', 'my', 'our', 'for', 'of', 'to', 'and', 'with', 'app', 'site'])
  const words = label.split(/\s+/).filter((w) => w && !stop.has(w.toLowerCase()))
  if (words.length === 0) return 'Your Project'
  return words.slice(0, 3).map(titleCase).join(' ')
}

/** Simulated extraction. Real build will call the AI provider instead. */
export function extractGoal(mode: 'admire' | 'build', input: string): GoalExtraction {
  const archetype = matchArchetype(input)

  if (mode === 'admire') {
    const name = personName(input)
    return {
      subject: archetype.subject,
      outcome: `Reach ${name}'s level by building the same core skills.`,
      skills: archetype.skills,
      label: name,
      note: `Niche read from ${name}'s profile`,
    }
  }

  const thing = thingLabel(input)
  return {
    subject: archetype === GENERIC ? derivedSubject(thing) : archetype.subject,
    outcome: `Build ${thing} end to end and ship it.`,
    skills: archetype.skills,
    label: thing,
    note: 'Skills this build needs',
  }
}
