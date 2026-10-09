import type { LearningFormat, SessionContent, SetupAnswers } from '../types'

/* --------------------------------------------------------------- */
/*  Subject templates used when the setup flow creates a new path.  */
/*  If the subject matches an existing path we clone that path      */
/*  instead, so Project Management keeps its full content.          */
/* --------------------------------------------------------------- */

interface SectionTemplate {
  title: string
  description: string
  minutes: number
}

export const subjectTemplates: Record<string, SectionTemplate[]> = {
  'digital marketing': [
    { title: 'Audiences and channels', description: 'Who you are talking to and where they already pay attention.', minutes: 180 },
    { title: 'Content that earns attention', description: 'Formats, hooks and a publishing rhythm you can keep up.', minutes: 240 },
    { title: 'Paid basics', description: 'Budgets, bidding and the three numbers that decide if ads work.', minutes: 200 },
    { title: 'Measuring what works', description: 'Attribution without self deception, and reports people read.', minutes: 180 },
    { title: 'Launch a mini campaign', description: 'Plan, run and review a real campaign on a small budget.', minutes: 480 },
  ],
  finance: [
    { title: 'How money moves', description: 'Income, costs, and the difference between profit and cash.', minutes: 150 },
    { title: 'Reading a statement', description: 'Balance sheet, income statement, and what each one is for.', minutes: 210 },
    { title: 'Budgeting and cash flow', description: 'Plan the next twelve months and spot trouble early.', minutes: 220 },
    { title: 'Investing basics', description: 'Risk, diversification and costs, explained without jargon.', minutes: 200 },
    { title: 'Your personal plan', description: 'Put it together into one plan you will actually follow.', minutes: 420 },
  ],
  'data analysis': [
    { title: 'Questions and data', description: 'Start from the decision, then find the data that informs it.', minutes: 150 },
    { title: 'Cleaning and shaping', description: 'Missing values, duplicates, and formats that break things.', minutes: 240 },
    { title: 'Analysis with spreadsheets', description: 'Lookups, pivots and the small set of stats that matter.', minutes: 260 },
    { title: 'Telling the story in charts', description: 'Choose the chart, remove the noise, write the headline.', minutes: 200 },
    { title: 'Real world project', description: 'Take a messy dataset from question to recommendation.', minutes: 540 },
  ],
  'c++': [
    { title: 'Types, variables and functions', description: 'The building blocks and how memory sees them.', minutes: 240 },
    { title: 'Control flow and loops', description: 'Decisions, repetition and the bugs hiding inside both.', minutes: 220 },
    { title: 'Pointers and memory', description: 'References, ownership and what actually happens on the stack.', minutes: 300 },
    { title: 'Objects and classes', description: 'Encapsulation, constructors and writing types that hold up.', minutes: 280 },
    { title: 'Build a small program', description: 'A command line tool that reads, processes and writes data.', minutes: 560 },
  ],
  'public speaking': [
    { title: 'Finding your message', description: 'One idea worth remembering, stated in one sentence.', minutes: 150 },
    { title: 'Structure and openings', description: 'The first thirty seconds, and what comes after them.', minutes: 200 },
    { title: 'Delivery and voice', description: 'Pace, pauses and the body language that supports your words.', minutes: 220 },
    { title: 'Handling nerves', description: 'Turn adrenaline into energy instead of static.', minutes: 150 },
    { title: 'Talk to a real audience', description: 'Deliver it somewhere live, then review the recording.', minutes: 480 },
  ],
  'product management': [
    { title: 'Product sense', description: 'What makes a product worth building, and how to argue it.', minutes: 180 },
    { title: 'Discovery and users', description: 'Interviews, signals and separating wants from needs.', minutes: 260 },
    { title: 'Prioritisation', description: 'Frameworks that help you decide, and when to ignore them.', minutes: 220 },
    { title: 'Delivery with engineers', description: 'Specs, trade offs and staying useful in the room.', minutes: 240 },
    { title: 'Launch and learn', description: 'Ship it, measure it, decide what happens next.', minutes: 520 },
  ],
  'graphic design': [
    { title: 'Composition and hierarchy', description: 'Guide the eye on purpose instead of by accident.', minutes: 180 },
    { title: 'Type and layout', description: 'Pairing type, spacing, and grids that carry the design.', minutes: 240 },
    { title: 'Colour with purpose', description: 'Palettes built from intent, not from a picker.', minutes: 180 },
    { title: 'Designing for screens', description: 'Responsive thinking, states and the details users notice.', minutes: 260 },
    { title: 'Portfolio piece', description: 'One project, presented the way a studio would present it.', minutes: 540 },
  ],
}

const genericSections: SectionTemplate[] = [
  { title: 'Getting started', description: 'The essentials you need before anything else makes sense.', minutes: 180 },
  { title: 'Core skills', description: 'The main techniques, practiced until they feel ordinary.', minutes: 260 },
  { title: 'Guided practice', description: 'Short exercises with feedback so mistakes surface early.', minutes: 240 },
  { title: 'Working on real tasks', description: 'Apply it to problems that look like the ones you actually face.', minutes: 300 },
  { title: 'Final project', description: 'Bring it together into one piece of work you can show.', minutes: 520 },
]

export function sectionsForSubject(subject: string): SectionTemplate[] {
  const key = subject.trim().toLowerCase()
  return subjectTemplates[key] ?? genericSections
}

export function findTemplateMatch(subject: string, paths: LearningPathLike[]): string | null {
  const key = subject.trim().toLowerCase()
  const hit = paths.find((p) => p.subject.toLowerCase() === key)
  return hit ? hit.id : null
}

interface LearningPathLike {
  id: string
  subject: string
}

/* ---------------------------------------------------------- */
/*  Session content for a freshly generated path.              */
/*  Written as real guidance for the learner rather than       */
/*  pretending to teach subject facts we do not have.          */
/* ---------------------------------------------------------- */

export function buildGeneratedSession(
  answers: SetupAnswers,
  sectionTitle: string,
  index: number,
): SessionContent {
  const subject = answers.subject.trim() || 'this subject'
  const outcome =
    answers.outcome.trim() ||
    `feel at home with ${subject}`
  const weekly = answers.weeklyHours === '15+' ? '15 or more' : (answers.weeklyHours ?? '5')

  return {
    lesson: {
      id: `gen-lsn-${index}`,
      title: `${sectionTitle}: how to approach it`,
      minutes: 15,
      intro: `This first session sets up ${sectionTitle} so that the sessions after it feel easier. The goal is not to cover everything today. It is to leave with one working piece of ${subject} and a clear idea of what to do next.`,
      blocks: [
        { type: 'h', text: 'What you are aiming for' },
        {
          type: 'p',
          text: `You said you want to: ${outcome}. Everything in this section should move you towards that sentence. If an activity does not, skip it without guilt and come back when it is useful.`,
        },
        { type: 'h', text: 'How to work through this section' },
        {
          type: 'steps',
          items: [
            'Read once without taking notes. First passes are for orientation, not capture.',
            'Do the practice the same day. Understanding fades fast, doing does not.',
            'Write down the one thing that confused you. That list is your next session.',
            `Keep sessions short and frequent. You planned around ${weekly} hours a week, and three fifty minute sessions beat one long evening.`,
          ],
        },
        {
          type: 'note',
          title: 'Key idea',
          text: `Progress in ${subject} comes from finished small things, not from finished chapters. Aim to end today with something you could show someone.`,
        },
      ],
    },
    resource: {
      id: `gen-res-${index}`,
      title: `A simple weekly rhythm for ${subject}`,
      kind: 'article',
      source: 'Sawari Reader',
      minutes: 10,
      summary:
        'How to structure your week so the time you planned actually gets used, and the sessions stack up instead of slipping.',
      body: [
        `Decide the two or three fixed slots for ${subject} before the week starts. Put them in your calendar as real appointments. Time that is not scheduled is time that gets spent on whatever is louddest.`,
        'Start each session by reopening what you did last time, five minutes maximum. Memory is cheaper to refresh than to rebuild, and the restart eliminates the "where was I" ten minutes that kills momentum.',
        'End each session by writing the next action in one line. "Try the same exercise with different inputs" is enough. Future you should not have to think to continue.',
        `Protect the sessions from the inside too. When you miss one, do not double the next to compensate. It turns ${subject} into a debt, and people quietly stop paying debts.`,
        'Once a week, look back over what you finished. Keeping evidence of finished work is the cheapest motivation there is, and it shows you whether your plan matched reality.',
      ],
    },
    practice: {
      id: `gen-prc-${index}`,
      title: 'Plan one finished piece of work',
      minutes: 10,
      brief: 'Short exercises beat broad intentions. Define one thing you will finish this week.',
      kind: 'written',
      prompt: `Describe one small piece of ${subject} work you can finish in the next seven days. Make it specific enough that "done" is obvious, and tied to: "${outcome}".`,
      modelAnswer:
        'Example of specific: "Finish one page of X that does Y, and show it to one person." Example of vague: "Get better at X." If a friend could not tell whether you had finished, it is not specific yet.',
    },
    assessment: {
      id: `gen-asm-${index}`,
      title: 'Check your understanding',
      intro: 'Three questions to make sure this session stuck.',
      minutes: 10,
      questions: [
        {
          id: 'q1',
          prompt: `Which plan is most likely to survive a busy week?`,
          choices: [
            'Two long sessions on the weekend, made up when you miss them',
            'Three short fixed slots during the week, kept even when short',
            'Whatever time happens to be free each day',
            'One very long session every two weeks',
          ],
          correctIndex: 1,
          explanation:
            'Fixed and short wins. Frequent contact beats volume, and there is nothing to make up later.',
        },
        {
          id: 'q2',
          prompt: 'You finish a session still confused about one thing. What is the best next move?',
          choices: [
            'Reread the whole section immediately until it clicks',
            'Write it down as the first task of your next session, and use it now if you have time',
            'Skip ahead, the confusion will resolve itself',
            'Restart the section from the beginning',
          ],
          correctIndex: 1,
          explanation:
            'A named confusion is a plan, not a failure. Fresh eyes next session solve most of them faster than repetition does.',
        },
        {
          id: 'q3',
          prompt: 'What makes a practice task worth doing?',
          choices: [
            'It covers as much material as possible',
            'It has a clear definition of done you could show someone',
            'It feels comfortable while you do it',
            'It comes from the first chapter of the book',
          ],
          correctIndex: 1,
          explanation:
            'Finished, showable work is what compounds. Broad coverage without a finish line is how weeks disappear.',
        },
      ],
    },
  }
}

export const preferredFormats = (formats: LearningFormat[]): string => {
  if (formats.length === 0) return 'a mix of formats'
  if (formats.length <= 2) return formats.join(' and ')
  return `${formats.slice(0, -1).join(', ')} and ${formats[formats.length - 1]}`
}
