export interface TeamMember {
  userId: string;
  name: string;
  avatarColor: string;
  weeklyXp: number;
}

export interface Team {
  id: string;
  name: string;
  color: string;
  description: string;
  members: TeamMember[];
  weeklyXp: number;
  totalXp: number;
  rank: number;
  isOpen: boolean;
  captainId: string;
}

/** Brend palitrasi — 6 swatch (form rang tanlash uchun ham ishlatiladi). */
export const TEAM_COLOR_PALETTE: { value: string; label: string }[] = [
  { value: '#4f3cc9', label: 'Binafsha' },
  { value: '#0284c7', label: 'Moviy' },
  { value: '#16a34a', label: "Yashil" },
  { value: '#f59e0b', label: 'Olov' },
  { value: '#e11d48', label: 'Qizil' },
  { value: '#a855f7', label: 'Siyohrang' },
];

function sumWeekly(members: TeamMember[]): number {
  return members.reduce((acc, m) => acc + m.weeklyXp, 0);
}

const ALPHA_MEMBERS: TeamMember[] = [
  { userId: 'u-a1', name: 'Aziz Islomov', avatarColor: '#4f3cc9', weeklyXp: 820 },
  { userId: 'u-a2', name: 'Madina Yusupova', avatarColor: '#0284c7', weeklyXp: 690 },
  { userId: 'u-a3', name: 'Bekzod Tursunov', avatarColor: '#16a34a', weeklyXp: 540 },
  { userId: 'u-a4', name: 'Sevara Otabekova', avatarColor: '#f59e0b', weeklyXp: 470 },
  { userId: 'u-a5', name: 'Jasur Rahimov', avatarColor: '#e11d48', weeklyXp: 410 },
  { userId: 'u-a6', name: 'Nilufar Saidova', avatarColor: '#a855f7', weeklyXp: 380 },
  { userId: 'u-a7', name: 'Otabek Mirzayev', avatarColor: '#22c55e', weeklyXp: 330 },
];

const PHOENIX_MEMBERS: TeamMember[] = [
  { userId: 'u-p1', name: 'Diyora Ergasheva', avatarColor: '#e11d48', weeklyXp: 760 },
  { userId: 'u-p2', name: 'Sherzod Aliyev', avatarColor: '#f59e0b', weeklyXp: 690 },
  { userId: 'u-p3', name: 'Munisa Qodirova', avatarColor: '#a855f7', weeklyXp: 520 },
  { userId: 'u-p4', name: 'Akmal Bekmurodov', avatarColor: '#0284c7', weeklyXp: 460 },
  { userId: 'u-p5', name: 'Iroda Komilova', avatarColor: '#16a34a', weeklyXp: 420 },
];

const QUANTUM_MEMBERS: TeamMember[] = [
  { userId: 'u-q1', name: 'Rustam Soliyev', avatarColor: '#0284c7', weeklyXp: 910 },
  { userId: 'u-q2', name: 'Lola Ismoilova', avatarColor: '#4f3cc9', weeklyXp: 720 },
  { userId: 'u-q3', name: 'Sardor Nazarov', avatarColor: '#22c55e', weeklyXp: 610 },
  { userId: 'u-q4', name: 'Zilola Rashidova', avatarColor: '#a855f7', weeklyXp: 480 },
  { userId: 'u-q5', name: 'Davron Olimov', avatarColor: '#f59e0b', weeklyXp: 360 },
  { userId: 'u-q6', name: 'Aysha Tolibova', avatarColor: '#e11d48', weeklyXp: 320 },
  { userId: 'u-q7', name: 'Komron Sodiqov', avatarColor: '#16a34a', weeklyXp: 290 },
  { userId: 'u-q8', name: 'Dilnoza Islomova', avatarColor: '#0284c7', weeklyXp: 240 },
];

const NOVA_MEMBERS: TeamMember[] = [
  { userId: 'u-n1', name: 'Bobur Mansurov', avatarColor: '#a855f7', weeklyXp: 580 },
  { userId: 'u-n2', name: 'Gulnoza Hasanova', avatarColor: '#16a34a', weeklyXp: 440 },
  { userId: 'u-n3', name: 'Saydalixon Ergashev', avatarColor: '#0284c7', weeklyXp: 390 },
  { userId: 'u-n4', name: 'Shahnoza Yo‘ldosheva', avatarColor: '#e11d48', weeklyXp: 350 },
];

const TITANS_MEMBERS: TeamMember[] = [
  { userId: 'u-t1', name: 'Farrux Egamberdiyev', avatarColor: '#f59e0b', weeklyXp: 1020 },
  { userId: 'u-t2', name: 'Malika Nuriddinova', avatarColor: '#e11d48', weeklyXp: 880 },
  { userId: 'u-t3', name: 'Asror Qosimov', avatarColor: '#4f3cc9', weeklyXp: 760 },
  { userId: 'u-t4', name: 'Sitora Po‘latova', avatarColor: '#0284c7', weeklyXp: 690 },
  { userId: 'u-t5', name: 'Jamshid Abdullayev', avatarColor: '#22c55e', weeklyXp: 610 },
  { userId: 'u-t6', name: 'Charos Sobirova', avatarColor: '#a855f7', weeklyXp: 540 },
];

const SPARK_MEMBERS: TeamMember[] = [
  { userId: 'u-s1', name: 'Temur Yusupov', avatarColor: '#22c55e', weeklyXp: 320 },
  { userId: 'u-s2', name: 'Oydina Kamolova', avatarColor: '#a855f7', weeklyXp: 260 },
  { userId: 'u-s3', name: 'Rustamjon Olimov', avatarColor: '#0284c7', weeklyXp: 180 },
];

export const TEAMS: Team[] = [
  {
    id: 'team-titans',
    name: 'Olimp Titanlari',
    color: '#f59e0b',
    description: "Eng kuchli olimpiadachilar — har hafta zarbdor natija ko'rsatuvchilar uchun.",
    members: TITANS_MEMBERS,
    weeklyXp: sumWeekly(TITANS_MEMBERS),
    totalXp: 184_500,
    rank: 1,
    isOpen: false,
    captainId: 'u-t1',
  },
  {
    id: 'team-quantum',
    name: 'Kvant Kashshoflari',
    color: '#0284c7',
    description: "Fizika va matematika oshig'i bo'lganlar uchun jamoa.",
    members: QUANTUM_MEMBERS,
    weeklyXp: sumWeekly(QUANTUM_MEMBERS),
    totalXp: 162_300,
    rank: 2,
    isOpen: true,
    captainId: 'u-q1',
  },
  {
    id: 'team-alpha',
    name: 'Alfa O‘quvchilar',
    color: '#4f3cc9',
    description: "Har kuni darslar va testlarni birgalikda yopadigan jamoa.",
    members: ALPHA_MEMBERS,
    weeklyXp: sumWeekly(ALPHA_MEMBERS),
    totalXp: 148_700,
    rank: 3,
    isOpen: true,
    captainId: 'u-a1',
  },
  {
    id: 'team-phoenix',
    name: 'Feniks',
    color: '#e11d48',
    description: "Yiqilsang ham, qaytib parvoz qil. Motivatsiyaga muhtoj bo'lganlar uchun.",
    members: PHOENIX_MEMBERS,
    weeklyXp: sumWeekly(PHOENIX_MEMBERS),
    totalXp: 121_400,
    rank: 4,
    isOpen: true,
    captainId: 'u-p1',
  },
  {
    id: 'team-nova',
    name: 'Nova',
    color: '#a855f7',
    description: "Yangi boshlovchilarga do'stona jamoa. Birga o'sib boramiz.",
    members: NOVA_MEMBERS,
    weeklyXp: sumWeekly(NOVA_MEMBERS),
    totalXp: 78_200,
    rank: 5,
    isOpen: true,
    captainId: 'u-n1',
  },
  {
    id: 'team-spark',
    name: 'Spark',
    color: '#16a34a',
    description: "Kichik, kompakt jamoa — bir-birini yaqindan qo'llab quvvatlash uchun.",
    members: SPARK_MEMBERS,
    weeklyXp: sumWeekly(SPARK_MEMBERS),
    totalXp: 42_800,
    rank: 6,
    isOpen: false,
    captainId: 'u-s1',
  },
];
