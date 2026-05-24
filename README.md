# MF Platform — edtech-hackaton

O'zbek abituriyentlari uchun gamifikatsiyalangan ta'lim platformasi.

## Maqsad

6–11-sinf o'quvchilariga majburiy fanlar (Matematika, Ona tili, Adabiyot, Tarix) bo'yicha:
- qisqa mavzular,
- flashkartalarda yodlash,
- testda baholash,
- AI yordamchidan shaxsiy maslahat olish.

Hammasi bitta ekosistemada — XP, level, kunlik seriya bilan o'rganishni o'yinga aylantiradi.

## Live

- **Frontend**: https://mfplatform.vercel.app
- **Backend admin**: cloudflared tunnel HTTPS orqali (`/admin/`)
- **Admin login**: `admin@mfplatform.uz` · `Admin2026!`
- **Demo user**: `saydalixon@demo.uz` · `Demo1234!` (jami 10 ta demo)

## Tuzilma

```
edtech-hackaton/
├── talim-sayt/              # Frontend (Vite + React 18 + TS + Tailwind v4)
│   ├── src/
│   │   ├── pages/           # Marketing + App pages
│   │   ├── components/      # UI komponentlar
│   │   ├── lib/api/         # Backend API client (axios + JWT)
│   │   ├── store/           # useApp context
│   │   └── layout/
│   ├── public/
│   └── vercel.json
└── mf-platform-backend/     # Backend (Django 5 + DRF + Postgres + Groq AI)
    ├── apps/
    │   ├── users/           # Auth + JWT (email login)
    │   ├── subjects/        # Fanlar
    │   ├── lessons/         # Darslar
    │   ├── tests/           # Test + Question + Option
    │   ├── flashcards/      # FlashTopic + FlashCard
    │   ├── ai_assistant/    # Groq integratsiya
    │   ├── gamification/    # XP, level, achievement
    │   ├── leaderboard/, tournaments/, duels/, teams/, friends/
    │   ├── cms/             # Site config + seed_demo_content
    │   ├── core_learning/   # Daily plan
    │   └── notifications/
    ├── config/              # settings.py, urls.py
    ├── Dockerfile
    └── docker-compose.yml   # web + db
```

## Tech stack

**Frontend**: Vite 6 · React 18 · TypeScript 5 · Tailwind CSS v4 · Framer Motion · React Router 7 · Axios

**Backend**: Django 5 · DRF · SimpleJWT · PostgreSQL 16 · Docker · django-unfold (admin) · drf-spectacular (OpenAPI) · Groq SDK (llama-3.3-70b)

**Deploy**: Vercel (frontend) · VPS + Docker + Cloudflared (backend)

## Lokal ishga tushirish

### Backend
```bash
cd mf-platform-backend
cp .env.example .env       # sozlab oling: SECRET_KEY, DB_*, GROQ_API_KEY
docker compose up -d
docker compose exec web python manage.py migrate
docker compose exec web python manage.py createsuperuser
docker compose exec web python manage.py seed_demo_content   # demo content
```
API: `http://localhost:8800/api/v1/` · Admin: `http://localhost:8800/admin/`

### Frontend
```bash
cd talim-sayt
npm install
echo "VITE_API_URL=http://localhost:8800/api/v1" > .env.local
npm run dev
```
http://localhost:5173

## Asosiy API endpointlar

| Endpoint | Maqsad |
|---|---|
| `POST /api/v1/auth/register/` | Ro'yxatdan o'tish (JWT qaytaradi) |
| `POST /api/v1/auth/login/` | Kirish |
| `GET /api/v1/auth/me/` | Joriy profil |
| `GET /api/v1/subjects/` | Fanlar |
| `GET /api/v1/lessons/?subject=` | Darslar |
| `GET /api/v1/flashcards/` | FlashTopic ro'yxati (kartalari bilan) |
| `POST /api/v1/flashcards/finish/` | Sessiya natijasini saqlash |
| `GET /api/v1/tests/` | Testlar |
| `GET /api/v1/tests/{id}/` | Test + savollar |
| `POST /api/v1/tests/answer/` | Variantni belgilash (instant feedback) |
| `POST /api/v1/ai/ask/` | Groq AI suhbat |
| `GET /api/v1/leaderboard/global/` | Reyting |

## Hozirgi backend ma'lumotlari

| | Soni |
|---|---|
| Subjects | 4 (Matematika · Ona tili · Adabiyot · Tarix) |
| Topics / Lessons | 14 |
| FlashTopics | 14 (jami 242 ta karta) |
| Tests | 10 (Mat 4 + OnaTili 4 + Tarix 2) |
| Questions | 150 |
| Options | 600 |

## Original repos

- Frontend: https://github.com/otabekqayumov762-collab/ta-lim-sayt
- Backend: https://github.com/otabekqayumov762-collab/ta-limsayt-back

Bu monorepo har ikkalasidan ko'chirilgan snapshot; manba kodi yangilanganda `rsync` orqali sinxronlanadi.
