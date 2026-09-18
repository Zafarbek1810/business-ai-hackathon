# Biznes Radar AI

**See the market before you invest.**  
O‘zbekcha: *Biznesga pul tikishdan oldin bozorni ko‘ring.*

Biznes Radar AI — kichik va o‘rta biznes (KOB) tadbirkorlari uchun bozor tahlili va moliyaviy rejalashtirish MVP platformasi. Bu umumiy chatbot emas: AI tuzilgan ma’lumot, formula va foydalanuvchi taxminlari ustida izoh beradi.

Muhim: platforma muvaffaqiyatni kafolatlamaydi. U sarmoyadan oldingi noaniqlikni kamaytirishga yordam beradi.

## 1. Mahsulot sharhi

Tadbirkor biznes g‘oyasini kiritadi. Platforma quyidagilarni birlashtiradi:

- Market Intelligence (demo/prototip ma’lumot aniq belgilanadi)
- Raqobatchilar, narx va talab signallari
- Deterministik moliyaviy model va zararsizlik nuqtasi
- Pessimistik / baza / optimistik ssenariylar
- Xavf ballari
- AI izohi va tekshiruv savollari
- Chop etishga tayyor hisobot

## 2. Arxitektura

```
frontend/   Next.js App Router (TypeScript, Tailwind)
backend/    NestJS REST API + Prisma + PostgreSQL
```

AI: `AIProvider` → `OpenAIProvider` | `MockAIProvider`  
Bozor: `MarketDataProvider` → `MockMarketDataProvider` (kelajakda tashqi manbalar)

Ma’lumot turlari har doim ajratiladi: foydalanuvchi kiritgan, hisoblangan, demo, AI izohi.

## 3. Texnologiyalar

**Frontend:** Next.js, TypeScript, Tailwind CSS, TanStack Query, React Hook Form, Zod, Recharts, Leaflet, next-themes, Lucide.

**Backend:** NestJS, Prisma, PostgreSQL, JWT, bcrypt, class-validator, Swagger, Helmet, Throttler.

## 4. Talablar

- Node.js 22+
- PostgreSQL 14+
- npm 11+

## 5. O‘rnatish

```bash
git clone <repo>
cd hakaton2
cp .env.example .env
```

## 6. Muhit o‘zgaruvchilari

`.env.example` ichida:

```
DATABASE_URL=
JWT_SECRET=
AI_API_KEY=
AI_MODEL=
AI_BASE_URL=
USE_MOCK_AI=true
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

Lokal Homebrew PostgreSQL (parolsiz foydalanuvchi) uchun misol:

```
DATABASE_URL=postgresql://YOUR_USER@localhost:5432/business_radar?schema=public
```

Docker Postgres uchun:

```
DATABASE_URL=postgresql://radar:radar_dev_password@localhost:5432/business_radar?schema=public
```

## 7. PostgreSQL

Docker orqali:

```bash
docker compose up -d postgres
```

Yoki lokal Postgresda baza yarating:

```bash
createdb business_radar
```

## 8–9. Prisma migratsiya va seed

```bash
cd backend
npm install
npx prisma generate
npx prisma db push
# yoki: npx prisma migrate dev
npm run prisma:seed
```

## 10. Frontendni ishga tushirish

```bash
cd frontend
npm install
cp ../.env.example .env.local   # NEXT_PUBLIC_API_URL ni belgilang
npm run dev
```

http://localhost:3000

## 11. Backendni ishga tushirish

```bash
cd backend
npm run start:dev
```

http://localhost:4000/api/health

## 12. API hujjatlari

Swagger: http://localhost:4000/api/docs

Asosiy yo‘llar: `/auth/*`, `/businesses`, `/market/*`, `/finance/calculate`, `/ai/*`, `/reports`, `/admin`.

## 13. Demo hisob

| Rol   | Email                    | Parol       |
|-------|--------------------------|-------------|
| User  | demo@biznesradar.uz      | Demo1234!   |
| Admin | admin@biznesradar.uz     | Admin1234!  |

## 14. Demo rejim

Dashboardda **Load Demo Business** tugmasi Xorazm sport kiyimlari do‘konini yuklaydi:

- Kapital: 100 000 000 so‘m
- Mahsulot: erkaklar krossovkalari, 150 000 → 190 000
- Savdo: 120 dona/oy
- Doimiy xarajat: 20 000 000 so‘m/oy
- Hisoblangan zararsizlik: **500 dona/oy**

Barcha bozor raqamlari **DEMO DATA — prototip** deb belgilanadi.

## 15. AI sozlamasi

Standart: `USE_MOCK_AI=true` — tashqi kalitsiz to‘liq ishlaydi.

Haqiqiy model:

```
USE_MOCK_AI=false
AI_API_KEY=...
AI_MODEL=gpt-4o-mini
AI_BASE_URL=https://api.openai.com/v1
```

Noto‘g‘ri AI JSON bo‘lsa, tizim qayta urinadi, so‘ng deterministik mock javobga o‘tadi.

## 16. Production eslatmalari

- `JWT_SECRET` ni uzun tasodifiy qiymatga almashtiring
- CORS ni aniq originga cheklang
- Haqiqiy bozor ma’lumotlari ulanmaguncha DEMO nishonini olib tashlamang
- To‘lov shlyuzi MVP da yo‘q; FREE/PRO/BUSINESS UI tayyor
- `docker compose up --build` frontend + backend + postgres ni ko‘taradi

## Moliyaviy formula

Zararsizlik (dona) = Doimiy xarajat / (Sotish narxi − O‘zgaruvchan tannarx)

Misol: 20 000 000 / (190 000 − 150 000) = **500 dona**

AI bu formulani hisoblamaydi, faqat izohlaydi.
