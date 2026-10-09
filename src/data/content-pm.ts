import type { SessionContent } from '../types'

/* Session content for every reachable Project Management section.        */
/* Keyed by section id, looked up through src/data/index.ts.             */

export const pmSessions: Record<string, SessionContent> = {
  /* ---------------------------------------------------------------- 01 */
  'pm-1': {
    lesson: {
      id: 'lsn-pm-1',
      title: 'What a project really is',
      minutes: 15,
      intro:
        'Before tools and templates, it helps to be precise about what you are running. Most project failures start as confusion about what this thing is and who owns it.',
      blocks: [
        {
          type: 'p',
          text: 'A project is work with an end. It has a finish line, a definition of done, and a moment where everyone stops and moves on. Payroll runs every month forever. The office move happens once. That difference changes every decision you make as the person responsible.',
        },
        { type: 'h', text: 'Three things that make a project a project' },
        {
          type: 'list',
          items: [
            'A clear outcome. Not activity, an outcome. The team is in the new office, the report is published, the feature is live.',
            'A constraint. Usually time and money, sometimes scope. Without a constraint you are simply improving something slowly.',
            'People who care. Somebody benefits and somebody decides. Your job includes knowing which is which.',
          ],
        },
        {
          type: 'h',
          text: 'What the project manager actually owns',
        },
        {
          type: 'steps',
          items: [
            'Clarity. Everyone can say what we are doing and what we are not doing.',
            'Sequence. The right things happen in the right order, and people know what is next.',
            'Signals. Problems surface early, while they are still cheap to solve.',
            'Decisions. The people who own the call get it when they need it, with context.',
          ],
        },
        {
          type: 'note',
          title: 'Key idea',
          text: 'You are not the most skilled person on the team. You are the person who keeps the outcome, the sequence and the signals in one piece.',
        },
      ],
    },
    resource: {
      id: 'res-pm-1',
      title: 'What a project manager actually does all day',
      kind: 'article',
      source: 'Sawari Reader',
      minutes: 10,
      summary:
        'A honest look at the daily work behind the title, far from the textbook breakdown of process groups.',
      body: [
        'Ask someone what a project manager does and you will hear "plans and tracks". Ask a project manager and you get a different answer: most of the day is spent removing ambiguity. Who owns this. What does done mean. Which of these two risks matters more.',
        'The calendar is rarely blocks of planning. It is a standup, then a conversation with the person who is stuck, then a message to the sponsor who wants to know if the date holds, then twenty minutes rewriting an agenda so the next meeting ends with decisions instead of notes.',
        'The useful skill is not software. It is writing things down clearly enough that other people can act on them. A status update that says "on track" is noise. One that says "the vendor confirmed Friday, which puts testing a day behind, and I need a decision on whether we cut the optional screen" is the whole job.',
        'If you are new to this, start there. In your next message about work, name the decision you need. Watch how much faster things move.',
      ],
    },
    practice: {
      id: 'prc-pm-1',
      title: 'Sort your own work',
      minutes: 10,
      brief:
        'Pick real work from your job or studies. If you cannot find a project, use something you would like to run.',
      kind: 'written',
      prompt:
        'Name one project and one ongoing task from your own work. In a sentence each, explain what makes the first one a project.',
      modelAnswer:
        'Project: set up the team wiki before the new hires start in three weeks. It has an end date, a definition of done (three sections live and linked), and stops when it ships. Ongoing task: answering support inbox questions. It repeats every week with no finish line, so it is operations, not a project.',
    },
    assessment: {
      id: 'asm-pm-1',
      title: 'Check your understanding',
      intro: 'Three quick questions on what makes a project a project.',
      minutes: 10,
      questions: [
        {
          id: 'q1',
          prompt: 'Which of these is most likely a project?',
          choices: [
            'Answering the customer support inbox every day',
            'Launching a new pricing page by the end of the month',
            'Sending the weekly newsletter',
            'Reconciling accounts every month',
          ],
          correctIndex: 1,
          explanation:
            'It has a defined outcome, a finish line and a date. The others repeat forever, so they are operations.',
        },
        {
          id: 'q2',
          prompt: 'A team is busy, deadlines slip, and nobody can say what "done" means. What is missing?',
          choices: [
            'A better tool for tracking tasks',
            'A clear outcome and definition of done',
            'More people on the team',
            'A longer timeline',
          ],
          correctIndex: 1,
          explanation:
            'Activity without a definition of done is how work expands. Clarity comes before capacity.',
        },
        {
          id: 'q3',
          prompt: 'What does a project manager primarily own?',
          choices: [
            'The technical solution to every problem',
            'All communication from the team',
            'Clarity, sequence, signals and decisions',
            'The final approval on scope changes',
          ],
          correctIndex: 2,
          explanation:
            'You keep the outcome, order and early warnings in one piece. Approvals belong to whoever owns the decision.',
        },
      ],
    },
  },

  /* ---------------------------------------------------------------- 02 */
  'pm-2': {
    lesson: {
      id: 'lsn-pm-2',
      title: 'Scope, milestones and a timeline you can defend',
      minutes: 15,
      intro:
        'A plan people trust is not detailed. It is honest. It says what is in, what is out, and where the risk of slippage actually sits.',
      blocks: [
        { type: 'h', text: 'Start with the sentence, not the spreadsheet' },
        {
          type: 'p',
          text: 'Write the scope in one sentence: who gets what, by when. If two people read it and describe different work, the sentence is not finished. Everything else in the plan hangs off that line.',
        },
        {
          type: 'h',
          text: 'The four parts of a defensible plan',
        },
        {
          type: 'list',
          items: [
            'Scope. What is in, and just as importantly, what you are not doing this time.',
            'Milestones. Five to eight moments where someone outside the team can see progress. Dates, not durations.',
            'Owners. Every milestone has one name. Shared ownership is no ownership.',
            'Assumptions. The things you believe but have not checked, written where stakeholders can challenge them.',
          ],
        },
        {
          type: 'h',
          text: 'Milestones beat task lists',
        },
        {
          type: 'p',
          text: 'A task list tells you what happened. Milestones tell you whether the project is still on course. "Design signed off" is a milestone. "Work on design" is a task. When someone asks for status, milestones are the answer that takes ten seconds and still means something.',
        },
        {
          type: 'note',
          title: 'Watch out',
          text: 'Plans that estimate every task to the hour become fiction the first week. Estimate the milestones, leave the tasks loose, and revisit weekly.',
        },
      ],
    },
    resource: {
      id: 'res-pm-2',
      title: 'The one page project plan',
      kind: 'template',
      source: 'Sawari Templates',
      minutes: 10,
      summary: 'A single page structure that fits most small to medium projects. Fill it in, share it, keep it updated.',
      body: [
        'Header: the outcome in one sentence, the date it is needed, and the name of the person who decides when something is done. If you fill in nothing else, fill in these three.',
        'Scope block: two columns, in and out. The out column is the one that saves you. "No custom integrations this round" prevents a conversation in week three that would have cost you two weeks.',
        'Milestones: five to eight rows. Date, milestone, owner, what you need from others. Keep it to one page so people actually read it.',
        'Risks and assumptions: three to five entries each, tops. If you have fourteen risks, you have a worry list, not a plan. Pick the ones that would genuinely change the date.',
        'Update rule: change the plan the day something real changes, not the Friday before the review. A plan that is always current is worth more than a plan that is always beautiful.',
      ],
    },
    practice: {
      id: 'prc-pm-2',
      title: 'Write a scope sentence',
      minutes: 10,
      brief: 'Practice the single most useful line in any plan.',
      kind: 'written',
      prompt:
        'Take a project you know. Write its scope in one sentence, then write one line for what you are explicitly not doing.',
      modelAnswer:
        'In scope: a five page marketing site with contact form, live by 14 November, owned by me. Not doing: a blog, multiple languages, or a CMS training session for the team this round.',
    },
    assessment: {
      id: 'asm-pm-2',
      title: 'Check your understanding',
      intro: 'Three questions on scoping and planning.',
      minutes: 10,
      questions: [
        {
          id: 'q1',
          prompt: 'A stakeholder keeps adding small requests. What handles this best?',
          choices: [
            'Accept them, they are all small',
            'A written scope with an explicit out list and a change conversation',
            'Tell the team to work faster',
            'Remove the stakeholder from the meetings',
          ],
          correctIndex: 1,
          explanation:
            'Small requests are how scope grows. A visible scope turns a vague drift into a real trade off you can decide on.',
        },
        {
          id: 'q2',
          prompt: 'Which of these is a milestone?',
          choices: [
            'Work on the homepage design',
            'Daily design standup',
            'Design signed off by the client',
            'Update the design file',
          ],
          correctIndex: 2,
          explanation:
            'A milestone is a moment of verified progress with a date. The others are activity.',
        },
        {
          id: 'q3',
          prompt: 'Why should assumptions be written into the plan?',
          choices: [
            'To show how much thinking you did',
            'So they can be checked and challenged before they become surprises',
            'Because templates require them',
            'They should not be, plans should look certain',
          ],
          correctIndex: 1,
          explanation:
            'Every surprise is an assumption that turned out wrong. Written down, someone else can correct it early.',
        },
      ],
    },
  },

  /* ---------------------------------------------------------------- 03 */
  'pm-3': {
    lesson: {
      id: 'lsn-pm-3',
      title: 'The week to week rhythm',
      minutes: 15,
      intro:
        'Execution is not one big push. It is a small number of habits, repeated at the same time every week, that keep reality visible.',
      blocks: [
        { type: 'h', text: 'The weekly loop' },
        {
          type: 'steps',
          items: [
            'Monday, ten minutes. What are the two outcomes this week? Not fifteen tasks, two outcomes.',
            'Midweek. Where is someone blocked? Ask directly, people rarely volunteer it.',
            'Friday. What moved, what did not, what changes next week. Send it in five lines.',
            'Same time every week. The rhythm matters more than the content. Predictability builds trust.',
          ],
        },
        {
          type: 'h',
          text: 'Decisions have an address',
        },
        {
          type: 'p',
          text: 'Most delays are not caused by slow work. They are caused by a decision sitting in nobody\'s inbox. When a decision appears, name the person, the options and the date you need it. Then let it be uncomfortable in writing rather than invisible in your head.',
        },
        {
          type: 'note',
          title: 'Practical tip',
          text: 'End every meeting with who does what by when, and send it in one short message. Teams that write decisions down move roughly twice as fast as teams that remember them.',
        },
      ],
    },
    resource: {
      id: 'res-pm-3',
      title: 'The status report people actually read',
      kind: 'article',
      source: 'Sawari Reader',
      minutes: 10,
      summary: 'Five lines, one decision, no colour coded tables. A format that survives contact with busy stakeholders.',
      body: [
        'Open with the one thing they care about: is the date safe. If yes, say so in the first line. If no, say what you need and from whom. Everything else is supporting detail.',
        'Line two: what moved since last time. Progress is relative to the previous update, not to the start of the project. "Design signed off Tuesday, two days early" tells a story. "Design 80 percent done" tells nothing.',
        'Line three: what did not move, and why. This is the line people trust you for. Teams that only report good news get scrutinised on every update, which costs more time than the bad news would have.',
        'Line four: risks and changes, in plain words. "Vendor lead time moved from two weeks to four, so testing starts October 20 unless we find a second supplier." Numbers and consequences together.',
        'Line five: the decision or help you need, with a date. If you need nothing, say "no decisions needed this week" so the reader knows they can safely skim.',
      ],
    },
    practice: {
      id: 'prc-pm-3',
      title: 'Draft a Friday update',
      minutes: 10,
      brief: 'Write the update you would actually send. Short enough that people read it.',
      kind: 'written',
      prompt:
        'Your launch slipped by one week because a vendor is late. Write the five line Friday update: status, movement, stall, risk, what you need.',
      modelAnswer:
        'Date moved to 21 Nov, everything else holds. Milestones 1 to 3 signed off. Vendor delivery late by a week, confirmed Thursday. Risk: testing window is now four days instead of six, buffer covers it. Need: nothing to decide, just flagging the new date.',
    },
    assessment: {
      id: 'asm-pm-3',
      title: 'Check your understanding',
      intro: 'Three questions on running the work.',
      minutes: 10,
      questions: [
        {
          id: 'q1',
          prompt: 'A task has been in progress for two weeks with no movement. What do you do first?',
          choices: [
            'Add more tasks to the same owner so the work balances out',
            'Ask directly what is blocking it and who can unblock it',
            'Extend the deadline quietly',
            'Assign someone else without telling them',
          ],
          correctIndex: 1,
          explanation:
            'Stall almost always means blockage. Ask early, and find out whether the blocker is a person, a decision or information.',
        },
        {
          id: 'q2',
          prompt: 'What makes a status update trustworthy?',
          choices: [
            'It only contains good news so people stay confident',
            'It has detailed tables for every task',
            'It covers movement since last time, including what did not move',
            'It is sent only when something is wrong',
          ],
          correctIndex: 2,
          explanation:
            'Relative progress and honest stalls are what people act on. Full colour tables get skimmed and forgotten.',
        },
        {
          id: 'q3',
          prompt: 'Which ending to a meeting is most useful?',
          choices: [
            'Everyone agreed to keep communicating',
            'We will reconvene next week',
            'A short note of who does what by when',
            'The full transcript of the discussion',
          ],
          correctIndex: 2,
          explanation:
            'Written ownership and dates are what survive the meeting. Everything else fades within a day.',
        },
      ],
    },
  },

  /* ---------------------------------------------------------------- 04 */
  'pm-4': {
    lesson: {
      id: 'lsn-pm-4',
      title: 'Sprints without the ceremony',
      minutes: 15,
      intro:
        'Agile is often taught as a set of meetings. It is really a way of shortening the distance between doing work and finding out whether it was the right work.',
      blocks: [
        { type: 'h', text: 'The idea underneath' },
        {
          type: 'p',
          text: 'Long plans hide problems. A six month plan reports green right up to the month where it falls apart. Short cycles invert that: you deliver something small every couple of weeks, get a real reaction, and adjust while changing direction is still cheap.',
        },
        { type: 'h', text: 'The three ceremonies worth keeping' },
        {
          type: 'list',
          items: [
            'Daily standup, ten minutes. Yesterday, today, blocked. It is a coordination tool, not a status report to you.',
            'Review at the end of the sprint. Show the real thing to real people. Reaction beats opinion.',
            'Retrospective. One thing to start, one to stop, one to improve. Then actually change something, or people stop bothering.',
          ],
        },
        {
          type: 'h',
          text: 'The backlog is a decision list',
        },
        {
          type: 'p',
          text: 'A backlog sorted by value answers the question you will be asked anyway: if we run out of time, what gets cut? Keep the top five items sharp and let the rest be rough notes. Nobody needs a perfectly estimated backlog; they need a clear order.',
        },
        {
          type: 'note',
          title: 'When not to sprint',
          text: 'If the work is mostly one unknown research problem, a two week cycle adds overhead. Timebox it instead: three days, then show what you learned.',
        },
      ],
    },
    resource: {
      id: 'res-pm-4',
      title: 'When sprints stop helping',
      kind: 'article',
      source: 'Sawari Reader',
      minutes: 10,
      summary: 'The common failure modes of agile rituals, and what to change before you abandon the approach.',
      body: [
        'The sprint becomes a deadline container. Work is announced as done on Friday because the review is Monday, and the increment carries three weeks of unfinished edges. Fix the definition of done before you fix the calendar.',
        'The standup turns into a report for the manager. If the team speaks to you rather than to each other, move one seat back and let them talk. Your update can arrive in writing.',
        'The backlog is 400 items deep and nobody trusts the order. Cut it to the top twenty and refine those well. The rest will still be there when they matter.',
        'The retrospective produces the same action every sprint. That is not a discipline problem, it is a permission problem. Something outside the team is blocking the fix, and nobody has named it. Name it upward, once, with a cost attached.',
      ],
    },
    practice: {
      id: 'prc-pm-4',
      title: 'Match the ceremony to its job',
      minutes: 10,
      brief: 'Each ritual exists for one reason. Get the pairing right and the meeting gets shorter.',
      kind: 'classify',
      items: [
        {
          id: 'i1',
          label: 'Daily standup',
          detail: 'Ten minutes, standing if you can',
          options: ['Unblock the day', 'Inspect the increment', 'Clarify upcoming work'],
          correctIndex: 0,
          feedback: 'Standup exists to surface blockers while they are still today\'s problem.',
        },
        {
          id: 'i2',
          label: 'Sprint review',
          detail: 'Show the work to people who matter',
          options: ['Unblock the day', 'Inspect the increment', 'Clarify upcoming work'],
          correctIndex: 1,
          feedback: 'The review puts the real thing in front of others and invites honest reaction.',
        },
        {
          id: 'i3',
          label: 'Backlog refinement',
          detail: 'The session nobody wants to attend',
          options: ['Unblock the day', 'Inspect the increment', 'Clarify upcoming work'],
          correctIndex: 2,
          feedback: 'Refinement makes upcoming work clear enough that the team can pick it up without you.',
        },
      ],
      prompt: '',
    },
    assessment: {
      id: 'asm-pm-4',
      title: 'Check your understanding',
      intro: 'Three questions on agile and scrum.',
      minutes: 10,
      questions: [
        {
          id: 'q1',
          prompt: 'What is the main point of short iterations?',
          choices: [
            'To give the team more meetings',
            'To find out early whether you are building the right thing',
            'To make estimates more accurate',
            'To let managers check progress more often',
          ],
          correctIndex: 1,
          explanation:
            'Short cycles shorten feedback. Cheap course corrections are the whole benefit; everything else is side effect.',
        },
        {
          id: 'q2',
          prompt: 'A sprint ends and the increment is 90 percent complete every time. What is wrong?',
          choices: [
            'The sprint is too long',
            'The definition of done is not being met, or work is being pulled in too large',
            'The team needs more people',
            'Scrum does not work for this team',
          ],
          correctIndex: 1,
          explanation:
            'Consistently incomplete increments is a slicing and definition problem. Cut work smaller and hold the done bar.',
        },
        {
          id: 'q3',
          prompt: 'Why keep the backlog ordered by value?',
          choices: [
            'So tools look tidy',
            'So you know what to cut when time runs out',
            'Because the estimate is easier at the top',
            'It makes demos faster',
          ],
          correctIndex: 1,
          explanation:
            'A clear order turns "we are running out of time" into a decision instead of an argument.',
        },
      ],
    },
  },

  /* ---------------------------------------------------------------- 05 */
  'pm-5': {
    lesson: {
      id: 'lsn-pm-5',
      title: 'Find problems before they find you',
      minutes: 15,
      intro:
        'Risk management has a reputation for paperwork because people confuse it with prediction. It is not prediction. It is deciding, calmly, what you would do if a thing went wrong.',
      blocks: [
        { type: 'h', text: 'A risk is not a problem yet' },
        {
          type: 'p',
          text: 'A problem is the server already down. A risk is the supplier whose delivery has slipped twice before, so yours might too. Problems demand action today. Risks demand a decision about whether to act now, later, or not at all.',
        },
        { type: 'h', text: 'Four honest responses' },
        {
          type: 'list',
          items: [
            'Avoid. Change the plan so the risk cannot happen. Cutting a new market from launch scope removes the legal risk entirely.',
            'Mitigate. Reduce likelihood or impact. A second supplier halves the impact of one being late.',
            'Transfer. Someone else carries it. Insurance, fixed price contracts, warranties.',
            'Accept. Say out loud that you will live with it, and keep a small buffer. Accepting deliberately is a decision; ignoring is not.',
          ],
        },
        { type: 'h', text: 'Keep the register alive' },
        {
          type: 'steps',
          items: [
            'Five to ten entries. Beyond that nobody reads it.',
            'One owner per risk. The person who will actually do the thing if it fires.',
            'A trigger. The specific sign that tells you to start the response, not a vague worry.',
            'Review weekly for five minutes. Remove dead risks, add new ones, update the ones that moved.',
          ],
        },
        {
          type: 'note',
          title: 'Key idea',
          text: 'The register is a decision log disguised as a list. Every line should end in something you would actually do.',
        },
      ],
    },
    resource: {
      id: 'res-pm-5',
      title: 'Risk register template',
      kind: 'template',
      source: 'Sawari Templates',
      minutes: 10,
      summary: 'Six columns that cover almost every project. Copy it, then delete whatever you do not use.',
      body: [
        'Risk: one plain sentence starting with "If" or "The chance that". Vague entries like "resource risk" are not risks, they are categories.',
        'Likelihood and impact: low, medium, high. Do not bother with a number scale for a small project, you will argue about decimals instead of the risk.',
        'Response: avoid, mitigate, transfer or accept, plus the specific next action. "Monitor" is rarely a response, it is a delay.',
        'Owner: one name. If you cannot name someone, the risk is not yet understood.',
        'Trigger: what you will see or hear that means the response starts. "Weekly vendor update misses two in a row" beats "if things get worse".',
        'Status: open, firing, closed. Review weekly, delete anything that has not been true in a month.',
      ],
    },
    practice: {
      id: 'prc-pm-5',
      title: 'Choose a response',
      minutes: 10,
      brief: 'Four real risks. Decide what you would actually do about each one.',
      kind: 'classify',
      items: [
        {
          id: 'i1',
          label: 'Your only designer hands in notice in week two',
          detail: 'Impact high, timing terrible',
          options: ['Avoid', 'Mitigate', 'Transfer', 'Accept'],
          correctIndex: 1,
          feedback:
            'You cannot remove the chance of someone leaving, so you reduce the impact: document work, cross train, pre agree a freelancer.',
        },
        {
          id: 'i2',
          label: 'Cloud costs could rise 30 percent next quarter',
          detail: 'Budget risk, not urgent',
          options: ['Avoid', 'Mitigate', 'Transfer', 'Accept'],
          correctIndex: 3,
          feedback:
            'With no realistic control over pricing, accepting with a small buffer is honest. Spending effort here takes it from somewhere useful.',
        },
        {
          id: 'i3',
          label: 'A new regulation may delay the launch in this region',
          detail: 'Unclear rules, high impact',
          options: ['Avoid', 'Mitigate', 'Transfer', 'Accept'],
          correctIndex: 0,
          feedback:
            'If you can scope the region out of the first launch, the risk disappears. Avoiding beats managing a risk you cannot control.',
        },
        {
          id: 'i4',
          label: 'Venue for the outdoor event has weak insurance',
          detail: 'Third party, contract stage',
          options: ['Avoid', 'Mitigate', 'Transfer', 'Accept'],
          correctIndex: 2,
          feedback:
            'Push the exposure into the contract: require their insurance or carry your own event cover. That is transferring.',
        },
      ],
      prompt: '',
    },
    assessment: {
      id: 'asm-pm-5',
      title: 'Check your understanding',
      intro: 'Three questions on risk.',
      minutes: 10,
      questions: [
        {
          id: 'q1',
          prompt: 'Which of these is a risk rather than a problem?',
          choices: [
            'The server went down last night',
            'The supplier has missed two deadlines before, yours may be next',
            'The team is two people short today',
            'The budget is already spent',
          ],
          correctIndex: 1,
          explanation:
            'A risk is a future possibility you can still act on. The others have already happened, so they are problems.',
        },
        {
          id: 'q2',
          prompt: 'A risk is "the vendor may be late". What is missing?',
          choices: [
            'A probability percentage',
            'A trigger and a response with an owner',
            'A longer description',
            'Approval from the sponsor',
          ],
          correctIndex: 1,
          explanation:
            'Without a trigger and an owned response, the entry is a worry. It cannot produce action.',
        },
        {
          id: 'q3',
          prompt: 'Your register has 40 risks. What is the best first move?',
          choices: [
            'Review all 40 in detail every week',
            'Cut to the few that could realistically change the outcome and own those',
            'Add likelihood scores to all of them',
            'Share the full list with stakeholders for transparency',
          ],
          correctIndex: 1,
          explanation:
            'A register nobody reads protects nobody. Prioritise ruthlessly and keep the rest as notes.',
        },
      ],
    },
  },

  /* ---------------------------------------------------------------- 06 */
  'pm-6': {
    lesson: {
      id: 'lsn-pm-6',
      title: 'Read the room before you brief it',
      minutes: 15,
      intro:
        'Most stakeholder trouble is not caused by bad news. It is caused by the wrong news reaching the wrong person at the wrong frequency. This lesson gives you a simple map and a way to use it.',
      blocks: [
        { type: 'h', text: 'Map them in two questions' },
        {
          type: 'p',
          text: 'For everyone involved, ask two things: how much can they change this project, and how much do they care about the outcome. The answers sort people into four groups, and each group deserves a different amount of your time.',
        },
        {
          type: 'list',
          items: [
            'High influence, high interest. These people can help or stop you. Work with them closely: involve them in decisions, brief them before anyone else, and be candid about problems.',
            'High influence, low interest. They hold the pen but do not want detail. Keep them satisfied with short, factual updates and never make them dig for the status.',
            'Low influence, high interest. Often the people living with the change. Keep them informed with regular, plain updates. They become your best early warning system.',
            'Low influence, low interest. Monitor. A light touch is enough, and you save your attention for where it changes outcomes.',
          ],
        },
        { type: 'h', text: 'Interest moves over time' },
        {
          type: 'p',
          text: 'The map is not static. The finance director usually becomes very interested two weeks before the budget review. Revisit it when you add scope, hit trouble, or a date changes. Ten minutes, once a fortnight, is enough.',
        },
        { type: 'h', text: 'Match the message, not just the person' },
        {
          type: 'p',
          text: 'The same project needs three different sentences. For the sponsor: the date and the one decision you need. For the engineering lead: the constraint behind the date. For the support team: what changes for them on Monday. Sending one broadcast to everyone is how you end up with three groups who each think you ignored them.',
        },
        {
          type: 'note',
          title: 'When someone is against it',
          text: 'Bring them in early, in private, with a real question. "What would have to be true for this to work for you?" Resistance that gets heard usually shrinks. Resistance that gets managed at arm\'s length usually grows.',
        },
      ],
    },
    resource: {
      id: 'res-pm-6',
      title: 'How to brief someone who does not want to be briefed',
      kind: 'article',
      source: 'Sawari Reader',
      minutes: 10,
      summary:
        'Short, practical guidance for the difficult conversation: the sceptical executive, the busy expert, the quietly opposed colleague.',
      body: [
        'Start with why they are in the room. If you open with your agenda, a sceptical listener spends the first two minutes building their counter argument. Open with theirs: "You flagged the timeline last time, so here is what changed."',
        'Lead with the decision, not the journey. Busy people decide whether to listen based on the first fifteen seconds. "I need a yes on hiring the contractor by Thursday, and here are the two reasons" earns attention that a project history does not.',
        'Give the bad news a shape. Not "there are some risks" but "testing is a week short, and I can either move the date by three days or drop the optional screen". Vague bad news is stored as incompetence; specific bad news is stored as control.',
        'Close with a next step that is theirs to take, or explicitly yours. Silence after a brief is where assumptions grow. "I will send the revised plan by five, tell me if the decision changes" ends the conversation with an owner.',
        'Afterwards, write two lines confirming what was agreed. The person who writes it down runs the project.',
      ],
    },
    practice: {
      id: 'prc-pm-6',
      title: 'Place each stakeholder',
      minutes: 10,
      brief: 'Read the situation, then choose the approach you would take. One of the four fits best.',
      kind: 'classify',
      items: [
        {
          id: 'i1',
          label: 'Maya, finance director',
          detail: 'Signs off the budget, rarely asks about progress, joins every third meeting',
          options: ['Keep informed', 'Manage closely', 'Keep satisfied', 'Monitor'],
          correctIndex: 2,
          feedback:
            'High influence, low interest. Short, factual updates before she has to ask. Never bury her in detail.',
        },
        {
          id: 'i2',
          label: 'Tom, engineering lead',
          detail: 'Builds the work, raises risks daily, can move the date on his own',
          options: ['Keep informed', 'Manage closely', 'Keep satisfied', 'Monitor'],
          correctIndex: 1,
          feedback:
            'High influence, high interest. Involve him in decisions and be straight about trade offs early.',
        },
        {
          id: 'i3',
          label: 'The support team',
          detail: 'Lives with the change after launch, no decision power',
          options: ['Keep informed', 'Manage closely', 'Keep satisfied', 'Monitor'],
          correctIndex: 0,
          feedback:
            'Low influence, high interest. Regular plain updates. They spot user problems before anyone else.',
        },
        {
          id: 'i4',
          label: 'A distant compliance group',
          detail: 'Only matters if the rules change during the project',
          options: ['Keep informed', 'Manage closely', 'Keep satisfied', 'Monitor'],
          correctIndex: 3,
          feedback:
            'Low influence, low interest. Monitor the rule change and otherwise spend your attention elsewhere.',
        },
      ],
      prompt: '',
    },
    assessment: {
      id: 'asm-pm-6',
      title: 'Check your understanding',
      intro: 'Five questions on stakeholder mapping and communication.',
      minutes: 10,
      topic: 'stakeholder mapping',
      reviewTopic: 'communication strategies',
      questions: [
        {
          id: 'q1',
          prompt:
            'A stakeholder has high influence but low interest. What is the most appropriate approach?',
          choices: [
            'Keep them informed with frequent detailed updates',
            'Manage them closely and involve them in every decision',
            'Keep them satisfied with short, factual updates',
            'Monitor them and take no action',
          ],
          correctIndex: 2,
          explanation:
            'They can change the project but do not want detail. Short, reliable updates keep their support without wasting their patience. Frequent detail from this group is how you lose their attention.',
        },
        {
          id: 'q2',
          prompt: 'What is the best first step when you take over a new project?',
          choices: [
            'Send a detailed plan to everyone involved',
            'Identify who is affected and who can decide, then analyse interest and influence',
            'Book weekly meetings with all stakeholders',
            'Escalate the highest risks to the sponsor immediately',
          ],
          correctIndex: 1,
          explanation:
            'The map comes first. It tells you who gets the detailed plan, who gets the meeting, and who gets a short note.',
        },
        {
          id: 'q3',
          prompt: 'What is a power and interest grid actually for?',
          choices: [
            'Ranking stakeholders by how much you like them',
            'Choosing how much engagement effort each group deserves',
            'Estimating the project budget by stakeholder',
            'Deciding who is allowed in the weekly meeting',
          ],
          correctIndex: 1,
          explanation:
            'It is a tool for spending attention. Each quadrant gets a different level of contact, which you cannot decide without the grid.',
        },
        {
          id: 'q4',
          prompt:
            'A high influence, high interest stakeholder is openly sceptical. What works best?',
          choices: [
            'Involve them early, in private, and address their concerns directly',
            'Send them the weekly report until they come around',
            'Limit their involvement so they cannot slow decisions',
            'Escalate to their manager so they are overruled',
          ],
          correctIndex: 0,
          explanation:
            'Sceptics involved early often become your strongest advocates. Managed at arm\'s length, they become your loudest opponent.',
        },
        {
          id: 'q5',
          prompt:
            'The support team has low influence but high interest. What do they need from you?',
          choices: [
            'Nothing until launch week',
            'Invitation to every decision meeting',
            'Regular, plain updates about what is coming',
            'A single email at the end of the project',
          ],
          correctIndex: 2,
          explanation:
            'Keep them informed. They absorb the change and warn you about real user problems long before dashboards do.',
        },
      ],
    },
  },
}
