/* ------------------------------------------------------------------ */
/*  Offline goal extraction for the setup flow.                          */
/*                                                                     */
/*  Primary path is the server AI endpoint (`aiApi.extractGoal`). This  */
/*  keyword matcher is the fallback when the API is unreachable or AI   */
/*  is down, so the flow still works end to end with results flagged    */
/*  `offline` in the UI.                                                */
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
  /** True when this came from the offline fallback instead of the AI. */
  offline?: boolean
}

/** A person the AI suggests when the learner wants to copy someone's skills. */
export interface AdmireCandidate {
  name: string
  role: string
  /** What they do and why they match the learner's description. */
  blurb: string
  subject: string
  skills: string[]
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

/** Reduce a typed name or description to a short, readable display name. */
function cleanQuery(raw: string): string {
  const text = raw
    .trim()
    .replace(/https?:\/\/\S+/i, '')
    .replace(/[|,].*$/, '')
    .replace(/\s+/g, ' ')
    .trim()
  const words = text.split(/\s+/).filter(Boolean).slice(0, 4)
  if (words.length === 0) return 'this person'
  return words.map(titleCase).join(' ')
}

/**
 * Offline fallback when the AI people-search is unreachable: a single
 * candidate inferred from the typed query via the archetype keyword match.
 */
export function offlineAdmireCandidates(query: string): AdmireCandidate[] {
  const archetype = matchArchetype(query)
  const name = cleanQuery(query)
  return [
    {
      name,
      role: archetype.role,
      blurb: `Closest offline match for “${name}”. Fine-tune the path to your own goals.`,
      subject: archetype.subject,
      skills: archetype.skills,
    },
  ]
}

/** Turn a chosen candidate into the goal extraction the setup flow stores. */
export function candidateToExtraction(candidate: AdmireCandidate, offline = false): GoalExtraction {
  return {
    subject: candidate.subject,
    outcome: `Reach ${candidate.name}'s level by building the same core skills.`,
    skills: candidate.skills,
    label: candidate.name,
    note: `Skills behind ${candidate.name}'s niche`,
    offline,
  }
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

/** Offline fallback extraction (keyword match). Results are flagged `offline`. */
export function extractGoal(mode: 'admire' | 'build', input: string): GoalExtraction {
  const archetype = matchArchetype(input)

  if (mode === 'admire') {
    return candidateToExtraction(offlineAdmireCandidates(input)[0])
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
