import type { AppNotification, Settings, User } from '../types'

export const mockUser: User = {
  id: 'usr_sam',
  name: 'Sam Carter',
  firstName: 'Sam',
  email: 'sam@sawari.app',
  emailVerified: true,
  joined: 'Joined March 2026',
  timezone: '(GMT+01:00) Lagos',
}

export const mockNotifications: AppNotification[] = [
  {
    id: 'n1',
    title: 'Your session is ready',
    body: 'Stakeholder Management, 45 minutes. Start whenever you are.',
    time: '18:40',
    read: false,
    kind: 'session',
  },
  {
    id: 'n2',
    title: 'Project feedback is in',
    body: 'Office Move Plan was reviewed. Two things to improve next time.',
    time: 'Yesterday',
    read: false,
    kind: 'project',
  },
  {
    id: 'n3',
    title: 'Risk Management complete',
    body: 'That was section 05 of 07. Stakeholder Management is next.',
    time: 'Oct 3',
    read: true,
    kind: 'path',
  },
  {
    id: 'n4',
    title: 'New project available',
    body: 'Sprint Improvement Plan is now open for your level.',
    time: 'Oct 1',
    read: true,
    kind: 'path',
  },
]

export const mockSettings: Settings = {
  preferences: {
    weeklyHours: '5',
    intensity: 'balanced',
    formats: ['articles', 'exercises', 'projects', 'quizzes'],
    sessionLength: 45,
  },
  schedule: {
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    time: '19:00',
    restDay: true,
  },
  notifications: {
    dailyReminder: true,
    weeklySummary: true,
    projectFeedback: true,
    pathUpdates: true,
    productNews: false,
  },
  ai: {
    provider: 'openai',
    mode: 'managed',
    keyMasked: null,
    connected: true,
  },
}
