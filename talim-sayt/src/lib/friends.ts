import type { SubjectId } from './types';

export interface Friend {
  id: string;
  name: string;
  username: string;
  avatarColor: string;
  xp: number;
  level: number;
  streak: number;
  online: boolean;
}

export interface PendingRequest {
  id: string;
  from: Friend;
  createdAt: string;
}

export interface Challenge {
  id: string;
  challenger: Friend;
  opponent: Friend;
  subject: SubjectId | string;
  grade: number;
  status: 'open' | 'done';
  challengerScore?: number;
  opponentScore?: number;
  winner?: Friend;
  createdAt: string;
}

export const MOCK_FRIENDS: Friend[] = [
  {
    id: 'f1',
    name: 'Sardor Aliyev',
    username: 'sardor',
    avatarColor: '#a5b4fc',
    xp: 9450,
    level: 14,
    streak: 41,
    online: true,
  },
  {
    id: 'f2',
    name: 'Malika Yusupova',
    username: 'malika',
    avatarColor: '#fda4af',
    xp: 8720,
    level: 13,
    streak: 33,
    online: true,
  },
  {
    id: 'f3',
    name: 'Asadbek Tursunov',
    username: 'asadbek',
    avatarColor: '#86efac',
    xp: 7980,
    level: 12,
    streak: 28,
    online: false,
  },
  {
    id: 'f4',
    name: 'Sevinch Mahmudova',
    username: 'sevinch',
    avatarColor: '#fcd34d',
    xp: 7410,
    level: 12,
    streak: 22,
    online: false,
  },
  {
    id: 'f5',
    name: 'Jasur Qodirov',
    username: 'jasur',
    avatarColor: '#7dd3fc',
    xp: 6850,
    level: 11,
    streak: 15,
    online: true,
  },
  {
    id: 'f6',
    name: 'Dilnoza Islom',
    username: 'dilnoza',
    avatarColor: '#c4b5fd',
    xp: 6210,
    level: 10,
    streak: 9,
    online: false,
  },
];

export const MOCK_PENDING: PendingRequest[] = [
  {
    id: 'p1',
    from: {
      id: 'r1',
      name: 'Behruz O.',
      username: 'behruz',
      avatarColor: '#fdba74',
      xp: 5400,
      level: 9,
      streak: 7,
      online: true,
    },
    createdAt: new Date(Date.now() - 3600_000).toISOString(),
  },
];

export const MOCK_CHALLENGES: Challenge[] = [
  {
    id: 'c1',
    challenger: MOCK_FRIENDS[0],
    opponent: MOCK_FRIENDS[1],
    subject: 'matematika',
    grade: 9,
    status: 'done',
    challengerScore: 8,
    opponentScore: 7,
    winner: MOCK_FRIENDS[0],
    createdAt: new Date(Date.now() - 86400_000).toISOString(),
  },
  {
    id: 'c2',
    challenger: MOCK_FRIENDS[2],
    opponent: MOCK_FRIENDS[0],
    subject: 'tarix',
    grade: 10,
    status: 'open',
    createdAt: new Date(Date.now() - 3600_000).toISOString(),
  },
];

export function searchFriends(query: string): Friend[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  return MOCK_FRIENDS.filter(
    (f) =>
      f.username.toLowerCase().includes(q) ||
      f.name.toLowerCase().includes(q),
  );
}

export function xpMultiplier(winStreak: number): number {
  if (winStreak >= 5) return 1.5;
  if (winStreak >= 3) return 1.2;
  return 1;
}
