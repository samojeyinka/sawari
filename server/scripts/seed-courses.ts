import 'dotenv/config'
import mongoose from 'mongoose'

/* ------------------------------------------------------------------ */
/*  Seed a couple of published catalog courses so /courses has real    */
/*  content to render. Idempotent: re-running replaces the two by slug. */
/*                                                                     */
/*  Run from server/:  npx tsx scripts/seed-courses.ts                 */
/*  Uses MONGODB_URI from server/.env.                                 */
/* ------------------------------------------------------------------ */

import { env } from '../src/config/env.js'
import { CatalogPath } from '../src/models/CatalogPath.js'
import { buildCatalogSections } from '../src/services/catalog.js'
import { createCatalogPathSchema } from '../src/validators/catalogValidators.js'

const courses = [
  {
    slug: 'sql-fundamentals',
    subject: 'SQL Fundamentals',
    summary: 'Read and write SQL queries that answer real questions from real tables.',
    goal: 'Pull, filter, group and join data on your own without looking up every clause.',
    level: 'beginner' as const,
    tags: ['sql', 'databases', 'data'],
    weeklyHours: '5' as const,
    intensity: 'balanced' as const,
    formats: ['articles', 'exercises', 'quizzes'],
    expectedWeeks: 3,
    expectedHours: 15,
    published: true,
    sections: [
      {
        id: 's1',
        title: 'Reading a table',
        description: 'Learn what a table is, how columns and rows relate, and how to read one without guessing.',
        minutes: 40,
        content: {
          lesson: {
            title: 'Tables, columns and rows',
            minutes: 18,
            intro:
              'A table is a grid. Every column holds one kind of value and every row is one record. Learning to read that grid is the whole foundation of SQL.',
            blocks: [
              { type: 'h' as const, text: 'What a table actually is' },
              {
                type: 'p' as const,
                text: 'Think of a table like a spreadsheet that the database controls. The column names tell you what each value means. Each row is one complete record, such as one customer or one order.',
              },
              {
                type: 'list' as const,
                items: [
                  'A column has a name and a single type, like text or a number.',
                  'A row is one record that fills every column.',
                  'A primary key is a column that uniquely identifies each row.',
                ],
              },
              { type: 'h' as const, text: 'Selecting columns' },
              {
                type: 'p' as const,
                text: 'The SELECT statement chooses which columns you want to see. Writing an asterisk returns every column, which is handy while exploring but wasteful in real queries.',
              },
              {
                type: 'note' as const,
                title: 'Read before you write',
                text: 'Spend your first minutes just looking at the data. Run a SELECT with a small limit and read the rows before you try to change anything.',
              },
              {
                type: 'steps' as const,
                items: [
                  'Start with SELECT and name the columns you need.',
                  'Add FROM and the table name.',
                  'Run the query and read the rows that come back.',
                  'Narrow the columns until the result is exactly what you wanted.',
                ],
              },
            ],
          },
          resources: [
            {
              title: 'The SELECT statement explained',
              kind: 'article' as const,
              source: 'SQLBolt',
              minutes: 15,
              summary: 'A gentle walkthrough of selecting columns and rows from a single table.',
              body: [
                'SELECT tells the database which columns to return.',
                'FROM tells it which table to read from.',
                'Together they form the most common query you will ever write.',
              ],
              url: 'https://sqlbolt.com/lesson/select_queries_introduction',
            },
          ],
          practice: {
            kind: 'classify' as const,
            title: 'Spot the column, row and key',
            minutes: 10,
            brief: 'Read each description and decide which part of the table it refers to.',
            items: [
              {
                label: 'The name of one customer, such as Ada.',
                options: ['Column', 'Row value', 'Primary key'],
                correctIndex: 1,
                feedback: 'A single stored value is a row value. It lives in a column but belongs to one specific row.',
              },
              {
                label: 'The unique id that identifies this customer and no other.',
                options: ['Column', 'Row value', 'Primary key'],
                correctIndex: 2,
                feedback: 'A primary key is the column that uniquely identifies each row.',
              },
              {
                label: 'The heading "email" that applies to every record.',
                options: ['Column', 'Row value', 'Primary key'],
                correctIndex: 0,
                feedback: 'The heading names a column. Every row supplies its own value for it.',
              },
            ],
          },
          assessment: {
            title: 'Reading a table',
            intro: 'Three quick checks on how tables, columns and rows fit together.',
            minutes: 8,
            topic: 'Table structure',
            questions: [
              {
                prompt: 'What does a single row in a table represent?',
                choices: ['One column of data', 'One complete record', 'The table name', 'A data type'],
                correctIndex: 1,
                explanation: 'Each row is one complete record that fills every column.',
              },
              {
                prompt: 'Which clause chooses the columns you want to see?',
                choices: ['FROM', 'WHERE', 'SELECT', 'ORDER BY'],
                correctIndex: 2,
                explanation: 'SELECT lists the columns to return. FROM only names the table.',
              },
              {
                prompt: 'Why is a primary key useful?',
                choices: [
                  'It sorts the table automatically',
                  'It uniquely identifies each row',
                  'It stores every value as text',
                  'It hides sensitive columns',
                ],
                correctIndex: 1,
                explanation: 'A primary key uniquely identifies each row so you can refer to it precisely.',
              },
            ],
          },
        },
      },
      {
        id: 's2',
        title: 'Filtering and sorting',
        description: 'Cut a big table down to the rows you care about and put them in a useful order.',
        minutes: 45,
        content: {
          lesson: {
            title: 'WHERE and ORDER BY',
            minutes: 20,
            intro:
              'Once you can read a table you want to narrow it. Filtering keeps only the rows that match a condition and sorting puts the result in a readable order.',
            blocks: [
              { type: 'h' as const, text: 'Keeping only matching rows' },
              {
                type: 'p' as const,
                text: 'The WHERE clause runs a test against every row. A row survives only when the test is true. This is how you find the customers in one city or the orders above a certain total.',
              },
              {
                type: 'list' as const,
                items: [
                  'Use equals to match an exact value.',
                  'Use AND and OR to combine several conditions.',
                  'Use LIKE to match a pattern such as names starting with a letter.',
                ],
              },
              { type: 'h' as const, text: 'Putting rows in order' },
              {
                type: 'p' as const,
                text: 'ORDER BY sorts the result. You choose a column and a direction, either ascending or descending. Without it, the database is free to return rows in any order it likes.',
              },
              {
                type: 'note' as const,
                title: 'Order is not guaranteed',
                text: 'If the order matters to a human reading the result, say so with ORDER BY. Never rely on the order the rows happen to come back in.',
              },
            ],
          },
          resources: [
            {
              title: 'Filtering rows with WHERE',
              kind: 'article' as const,
              source: 'SQLBolt',
              minutes: 15,
              summary: 'How to constrain a query with conditions and combine them.',
              body: [
                'WHERE keeps rows where a condition is true.',
                'AND requires every condition to hold.',
                'OR is satisfied when any one condition holds.',
              ],
              url: 'https://sqlbolt.com/lesson/filtering_sorting_query_results',
            },
          ],
          practice: {
            kind: 'written' as const,
            title: 'Write a filtered query',
            minutes: 12,
            brief: 'Practise turning a plain question into a query with a filter and an order.',
            prompt: 'Write a query that returns the name and signup date of every customer who joined after January 2024, newest first.',
            modelAnswer:
              'SELECT name, signup_date FROM customers WHERE signup_date > \'2024-01-01\' ORDER BY signup_date DESC',
          },
          assessment: {
            title: 'Filtering and sorting',
            intro: 'Confirm that you can narrow a result and control its order.',
            minutes: 8,
            topic: 'Filtering and sorting',
            questions: [
              {
                prompt: 'When does a row survive a WHERE clause?',
                choices: ['When the test is true for it', 'When it is the first row', 'Always', 'Only when sorted'],
                correctIndex: 0,
                explanation: 'WHERE keeps a row only when its condition evaluates to true.',
              },
              {
                prompt: 'What is true about the order of rows without ORDER BY?',
                choices: ['It is always alphabetical', 'It is always insertion order', 'It is not guaranteed', 'It is random every time'],
                correctIndex: 2,
                explanation: 'Without ORDER BY the database may return rows in any order.',
              },
              {
                prompt: 'Which keyword requires every listed condition to be true?',
                choices: ['OR', 'AND', 'LIKE', 'DESC'],
                correctIndex: 1,
                explanation: 'AND keeps a row only when all its conditions hold.',
              },
            ],
          },
        },
      },
    ],
  },
  {
    slug: 'public-speaking',
    subject: 'Public Speaking',
    summary: 'Plan and deliver a short talk that people actually follow and remember.',
    goal: 'Stand up and give a clear five minute talk without reading from a script.',
    level: 'some' as const,
    tags: ['communication', 'speaking', 'career'],
    weeklyHours: '5' as const,
    intensity: 'relaxed' as const,
    formats: ['videos', 'exercises', 'projects'],
    expectedWeeks: 3,
    expectedHours: 12,
    published: true,
    sections: [
      {
        id: 's1',
        title: 'Shaping your message',
        description: 'Decide what your talk is really about and organise it so a listener can follow.',
        minutes: 40,
        content: {
          lesson: {
            title: 'One idea, three parts',
            minutes: 18,
            intro:
              'Most talks fail because they try to say too much. A talk that lands carries one clear idea and supports it with a handful of points.',
            blocks: [
              { type: 'h' as const, text: 'Find the one idea' },
              {
                type: 'p' as const,
                text: 'Before you plan anything, finish this sentence in one line. By the end of this talk my listener will believe or do a specific thing. That single line is your spine and everything else must serve it.',
              },
              {
                type: 'list' as const,
                items: [
                  'Write your one line and keep it visible while you plan.',
                  'Choose no more than three supporting points.',
                  'Cut anything that does not clearly serve the one line.',
                ],
              },
              { type: 'h' as const, text: 'Open and close with care' },
              {
                type: 'p' as const,
                text: 'Listeners remember the start and the end most clearly. Open with a concrete moment rather than a general statement, and close by returning to your one line so the talk feels finished.',
              },
              {
                type: 'note' as const,
                title: 'Structure beats polish',
                text: 'A rough talk with a clear structure lands better than a polished talk with no shape.',
              },
              {
                type: 'steps' as const,
                items: [
                  'Write your one line.',
                  'List three points that support it.',
                  'Draft a concrete opening and a closing that repeats the line.',
                  'Cut every sentence that serves none of the three points.',
                ],
              },
            ],
          },
          resources: [
            {
              title: 'How to speak so people want to listen',
              kind: 'video' as const,
              source: 'TED, Julian Treasure',
              minutes: 10,
              summary: 'A short talk on the habits that make a voice worth listening to.',
              body: [
                'Speaking well is a set of learnable habits.',
                'Clarity and honesty matter more than a polished voice.',
                'Small changes in how you speak change how you are heard.',
              ],
              url: 'https://www.ted.com/talks/julian_treasure_how_to_speak_so_that_people_want_to_listen',
            },
          ],
          practice: {
            kind: 'classify' as const,
            title: 'Does it serve the one line?',
            minutes: 10,
            brief: 'For each sentence from a draft talk, decide whether it supports the core idea.',
            items: [
              {
                label: 'A funny story that has nothing to do with the topic.',
                options: ['Keep it', 'Cut it'],
                correctIndex: 1,
                feedback: 'If it does not serve the one line, it costs you the listener attention. Cut it.',
              },
              {
                label: 'A number that proves your main point.',
                options: ['Keep it', 'Cut it'],
                correctIndex: 0,
                feedback: 'Concrete evidence that supports the core idea strengthens the talk. Keep it.',
              },
              {
                label: 'A second closing that repeats the ending you just gave.',
                options: ['Keep it', 'Cut it'],
                correctIndex: 1,
                feedback: 'Two endings weaken a talk. Say it once, clearly, and stop.',
              },
            ],
          },
          assessment: {
            title: 'Shaping your message',
            intro: 'Check your grasp of structure before you start drafting.',
            minutes: 8,
            topic: 'Talk structure',
            questions: [
              {
                prompt: 'How many supporting points should most short talks have?',
                choices: ['As many as possible', 'No more than three', 'Exactly ten', 'None'],
                correctIndex: 1,
                explanation: 'Three or fewer points are easier for a listener to hold and follow.',
              },
              {
                prompt: 'What belongs at the very centre of your planning?',
                choices: ['Your slides', 'Your one clear idea', 'A long word list', 'The venue'],
                correctIndex: 1,
                explanation: 'One clear idea is the spine that every other choice must serve.',
              },
              {
                prompt: 'Why does the opening matter so much?',
                choices: ['It must list your credentials', 'Listeners remember the start most clearly', 'It replaces the ending', 'It sets the slide count'],
                correctIndex: 1,
                explanation: 'The start and end of a talk are what listeners recall most clearly.',
              },
            ],
          },
        },
      },
      {
        id: 's2',
        title: 'Delivering with calm',
        description: 'Handle nerves, pace and pauses so you are understood from the back of the room.',
        minutes: 40,
        content: {
          lesson: {
            title: 'Nerves, pace and pauses',
            minutes: 18,
            intro:
              'Delivery is mostly calm and pace. Once you accept that nerves are normal you can plan around them instead of fighting them.',
            blocks: [
              { type: 'h' as const, text: 'Working with nerves' },
              {
                type: 'p' as const,
                text: 'Nerves are your body preparing to perform and they fade with repetition. Rehearsing out loud, standing up, teaches your body the shape of the talk so the real moment feels familiar.',
              },
              { type: 'h' as const, text: 'Pace and the power of the pause' },
              {
                type: 'p' as const,
                text: 'Speeding up is what nervous speakers do first. A short pause after an important point gives the listener time to absorb it and gives you time to breathe. Silence is not failure, it is punctuation.',
              },
              {
                type: 'list' as const,
                items: [
                  'Rehearse standing and out loud, never only in your head.',
                  'Pause after each key point instead of filling silence.',
                  'Speak a little slower than feels natural.',
                ],
              },
              {
                type: 'note' as const,
                title: 'The pause is your friend',
                text: 'A two second pause feels enormous to you and perfectly normal to the room.',
              },
            ],
          },
          resources: [
            {
              title: 'Rehearsal tips for a live talk',
              kind: 'article' as const,
              source: 'Toastmasters',
              minutes: 12,
              summary: 'Practical ways to rehearse so the real talk feels rehearsed and relaxed.',
              body: [
                'Rehearse out loud and on your feet.',
                'Practise the transitions between sections.',
                'Time the talk so you know where to trim.',
              ],
              url: 'https://www.toastmasters.org/',
            },
          ],
          practice: {
            kind: 'written' as const,
            title: 'Plan your pauses',
            minutes: 12,
            brief: 'Decide in advance where you will deliberately slow down or pause.',
            prompt: 'Take your opening paragraph and mark two places where you will pause for two seconds. Describe the moment before each pause and why it earns the pause.',
            modelAnswer:
              'I would pause right after the opening story lands, so the listener can feel it before I explain it, and again right before I state my one line, so the line arrives into silence.',
          },
          assessment: {
            title: 'Delivering with calm',
            intro: 'Check that you can plan your delivery, not just your words.',
            minutes: 8,
            topic: 'Delivery',
            questions: [
              {
                prompt: 'What is the best way to rehearse a talk?',
                choices: ['Silently in your head', 'Out loud and standing', 'Reading the slides', 'Not at all'],
                correctIndex: 1,
                explanation: 'Rehearsing out loud and standing teaches your body the real talk.',
              },
              {
                prompt: 'What does a short pause after a key point do?',
                choices: ['Wastes time', 'Gives the listener time to absorb it', 'Proves you forgot', 'Speeds up the talk'],
                correctIndex: 1,
                explanation: 'A pause lets the important point land before you move on.',
              },
              {
                prompt: 'Most nervous speakers tend to do what?',
                choices: ['Speak too slowly', 'Speak too quickly', 'Pause too often', 'Whisper'],
                correctIndex: 1,
                explanation: 'Speeding up is the most common nervous habit, so slow down on purpose.',
              },
            ],
          },
        },
      },
    ],
  },
]

async function main() {
  await mongoose.connect(env.MONGODB_URI)

  const host = mongoose.connection.host
  const db = mongoose.connection.name
  console.log(`[seed] connected to ${host}/${db}`)

  const written: string[] = []

  for (const raw of courses) {
    const input = createCatalogPathSchema.parse(raw)
    const slug = input.slug
    if (!slug) throw new Error('Every seed course needs an explicit slug.')

    const sections = buildCatalogSections(input.sections, slug)

    await CatalogPath.findOneAndUpdate(
      { slug },
      {
        $set: {
          slug,
          subject: input.subject,
          summary: input.summary,
          goal: input.goal,
          level: input.level,
          tags: input.tags,
          weeklyHours: input.weeklyHours,
          intensity: input.intensity,
          formats: input.formats,
          expectedWeeks: input.expectedWeeks,
          expectedHours: input.expectedHours,
          ogImage: input.ogImage,
          sections,
          published: true,
          publishedAt: new Date(),
          createdBy: null,
        },
        $setOnInsert: { enrollments: 0, reviewsCount: 0, reviewsAvg: 0 },
      },
      { upsert: true, runValidators: true, setDefaultsOnInsert: true },
    )

    written.push(`/courses/${slug}  (${sections.length} sections)`)
  }

  const published = await CatalogPath.countDocuments({ published: true })

  console.log(`[seed] wrote ${written.length} courses:`)
  for (const line of written) console.log(`  - ${line}`)
  console.log(`[seed] published courses now in the database: ${published}`)

  await mongoose.disconnect()
}

main().catch(async (error) => {
  console.error('[seed] failed:', error)
  await mongoose.disconnect().catch(() => {})
  process.exit(1)
})
