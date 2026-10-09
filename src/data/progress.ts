import type { Milestone, RecentlyDone } from '../types'

export const mockMilestones: Milestone[] = [
  {
    id: 'm1',
    title: 'Foundations complete',
    detail: 'Projects, roles and the language of delivery',
    date: 'Sep 6',
    state: 'done',
  },
  {
    id: 'm2',
    title: 'Project Planning complete',
    detail: 'Scope, milestones and a timeline you can defend',
    date: 'Sep 14',
    state: 'done',
  },
  {
    id: 'm3',
    title: 'First project reviewed',
    detail: 'Office Move Plan came back with feedback',
    date: 'Sep 20',
    state: 'done',
  },
  {
    id: 'm4',
    title: 'Agile and Scrum complete',
    detail: 'Sprints, backlog and the three ceremonies that matter',
    date: 'Sep 27',
    state: 'done',
  },
  {
    id: 'm5',
    title: 'Risk Management complete',
    detail: 'A living register instead of a hopeful plan',
    date: 'Oct 3',
    state: 'done',
  },
  {
    id: 'm6',
    title: 'Stakeholder Management in progress',
    detail: 'Section 06 of 07. Two sessions done, six to go.',
    date: 'Now',
    state: 'current',
  },
  {
    id: 'm7',
    title: 'Real world project',
    detail: 'Plan a product launch from brief to presentation',
    date: 'Next',
    state: 'next',
  },
]

export const mockRecent: RecentlyDone[] = [
  { id: 'r1', title: 'Reading: building a risk register', kind: 'read', when: 'Yesterday' },
  { id: 'r2', title: 'Practice: match each risk to a response', kind: 'practice', when: 'Oct 4' },
  { id: 'r3', title: 'Section 05 Risk Management', kind: 'section', when: 'Oct 3' },
  { id: 'r4', title: 'Lesson: find problems before they find you', kind: 'learn', when: 'Oct 3' },
]
