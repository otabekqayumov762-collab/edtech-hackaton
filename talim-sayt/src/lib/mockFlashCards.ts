import type { SubjectId } from './types';

export interface FlashCard {
  id: string;
  front: string;
  back: string;
}

export interface FlashTopic {
  id: string;
  subject: SubjectId;
  title: string;
  desc: string;
  cards: FlashCard[];
}

export const FLASH_TOPICS: FlashTopic[] = [
  {
    id: 'eng-top12',
    subject: 'ingliz-tili',
    title: 'Ingliz tili — eng ko‘p uchraydigan 12 ta so‘z',
    desc: 'Kundalik nutqda eng ko‘p ishlatiladigan so‘zlar tarjimasi',
    cards: [
      { id: 'eng-1', front: 'Dad', back: 'Dada' },
      { id: 'eng-2', front: 'Mother', back: 'Ona' },
      { id: 'eng-3', front: 'Book', back: 'Kitob' },
      { id: 'eng-4', front: 'House', back: 'Uy' },
      { id: 'eng-5', front: 'Water', back: 'Suv' },
      { id: 'eng-6', front: 'Sun', back: 'Quyosh' },
      { id: 'eng-7', front: 'Friend', back: 'Do‘st' },
      { id: 'eng-8', front: 'School', back: 'Maktab' },
      { id: 'eng-9', front: 'Teacher', back: 'O‘qituvchi' },
      { id: 'eng-10', front: 'Time', back: 'Vaqt' },
      { id: 'eng-11', front: 'Road', back: 'Yo‘l' },
      { id: 'eng-12', front: 'City', back: 'Shahar' },
    ],
  },
  {
    id: 'kim-elementlar',
    subject: 'kimyo',
    title: 'Kimyo — elementlar',
    desc: 'Kimyoviy belgilar va ularning nomlari',
    cards: [
      { id: 'kim-1', front: 'H', back: 'Vodorod' },
      { id: 'kim-2', front: 'O', back: 'Kislorod' },
      { id: 'kim-3', front: 'N', back: 'Azot' },
      { id: 'kim-4', front: 'C', back: 'Uglerod' },
      { id: 'kim-5', front: 'Na', back: 'Natriy' },
      { id: 'kim-6', front: 'K', back: 'Kaliy' },
      { id: 'kim-7', front: 'Fe', back: 'Temir' },
      { id: 'kim-8', front: 'Cu', back: 'Mis' },
      { id: 'kim-9', front: 'Au', back: 'Oltin' },
      { id: 'kim-10', front: 'Ag', back: 'Kumush' },
      { id: 'kim-11', front: 'Cl', back: 'Xlor' },
      { id: 'kim-12', front: 'Ca', back: 'Kalsiy' },
    ],
  },
  {
    id: 'mat-formulalar',
    subject: 'matematika',
    title: 'Matematika — formulalar',
    desc: 'Asosiy matematik formulalar va ularning ko‘rinishi',
    cards: [
      { id: 'mat-1', front: 'Diskriminant', back: 'D = b² − 4ac' },
      { id: 'mat-2', front: 'Kvadrat tenglama yechimi', back: 'x = (−b ± √D) / 2a' },
      { id: 'mat-3', front: 'Viyet teoremasi', back: 'x₁ + x₂ = −b/a, x₁·x₂ = c/a' },
      { id: 'mat-4', front: 'Doiraning yuzi', back: 'S = πr²' },
      { id: 'mat-5', front: 'Doiraning aylanasi', back: 'L = 2πr' },
      { id: 'mat-6', front: 'Uchburchak yuzi', back: 'S = ½·a·h' },
      { id: 'mat-7', front: 'Pifagor teoremasi', back: 'a² + b² = c²' },
      { id: 'mat-8', front: 'Arifmetik progressiya', back: 'aₙ = a₁ + (n−1)d' },
      { id: 'mat-9', front: 'Geometrik progressiya', back: 'bₙ = b₁·qⁿ⁻¹' },
      { id: 'mat-10', front: 'Kub yuzi', back: 'S = 6a²' },
      { id: 'mat-11', front: 'Shar hajmi', back: 'V = (4/3)πr³' },
      { id: 'mat-12', front: 'Sinuslar teoremasi', back: 'a/sinA = b/sinB = c/sinC' },
    ],
  },
  {
    id: 'bio-hujayra',
    subject: 'biologiya',
    title: 'Biologiya — hujayra qismlari',
    desc: 'Hujayra organoidlari va ularning vazifalari',
    cards: [
      { id: 'bio-1', front: 'Mitoxondriya', back: 'Hujayraning energiya stansiyasi (ATF)' },
      { id: 'bio-2', front: 'Yadro', back: 'Genetik ma’lumotni saqlaydi (DNK)' },
      { id: 'bio-3', front: 'Ribosoma', back: 'Oqsil sintezi joyi' },
      { id: 'bio-4', front: 'Xloroplast', back: 'Fotosintez amalga oshadigan organoid' },
      { id: 'bio-5', front: 'Golji apparati', back: 'Moddalarni qadoqlash va tashish' },
      { id: 'bio-6', front: 'Lizosoma', back: 'Hujayra ichidagi hazm qiluvchi pufakcha' },
      { id: 'bio-7', front: 'Sitoplazma', back: 'Hujayra ichidagi suyuq muhit' },
      { id: 'bio-8', front: 'Hujayra membranasi', back: 'Hujayrani o‘rab turuvchi qobiq' },
      { id: 'bio-9', front: 'Endoplazmatik to‘r', back: 'Moddalarni tashuvchi tarmoq' },
      { id: 'bio-10', front: 'Vakuola', back: 'Suv va moddalarni saqlovchi pufakcha' },
      { id: 'bio-11', front: 'Sentriol', back: 'Hujayra bo‘linishida ishtirok etadi' },
      { id: 'bio-12', front: 'Sitoskelet', back: 'Hujayra shaklini saqlovchi tuzilma' },
    ],
  },
  {
    id: 'tarix-sanalar',
    subject: 'ona-tili',
    title: 'Tarix — sanalar',
    desc: 'O‘zbekiston va jahon tarixining muhim sanalari',
    cards: [
      { id: 'his-1', front: '1991-yil 1-sentyabr', back: 'O‘zbekiston Mustaqilligi e’lon qilindi' },
      { id: 'his-2', front: '1992-yil 8-dekabr', back: 'O‘zbekiston Konstitutsiyasi qabul qilindi' },
      { id: 'his-3', front: '1370-yil', back: 'Amir Temur taxtga o‘tirdi' },
      { id: 'his-4', front: '1865-yil', back: 'Toshkent Rossiya imperiyasi tomonidan zabt etildi' },
      { id: 'his-5', front: '1924-yil', back: 'O‘zbekiston SSR tashkil topdi' },
      { id: 'his-6', front: '1941–1945', back: 'Ikkinchi jahon urushi' },
      { id: 'his-7', front: '1969-yil 21-iyul', back: 'Inson Oyga qadam qo‘ydi' },
      { id: 'his-8', front: '1453-yil', back: 'Konstantinopol qulashi' },
      { id: 'his-9', front: '1492-yil', back: 'Kolumb Amerikani kashf etdi' },
      { id: 'his-10', front: '1917-yil', back: 'Rossiyada Oktyabr inqilobi' },
      { id: 'his-11', front: '1989-yil', back: 'Berlin devori qulashi' },
      { id: 'his-12', front: '2017-yil', back: 'O‘zbekistonda Yangi O‘zbekiston davri boshlandi' },
    ],
  },
];
