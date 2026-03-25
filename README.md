# EcoSpark Hub Backend

REST API for EcoSpark Hub (sustainability idea community portal).

## Tech Stack

- Node.js + Express
- TypeScript
- Prisma ORM
- PostgreSQL
- JWT auth
- Stripe payment integration

## Core Features

- Auth:
	- register/login/me
	- bcrypt password hashing
	- JWT-based authorization
- Ideas:
	- create draft idea
	- update/delete own unpublished idea
	- submit draft/rejected idea for review
	- public list includes approved ideas only
- Admin:
	- approve/reject ideas with feedback
	- view dashboard stats
	- manage users
	- view moderation/payment data
- Voting:
	- upvote/downvote/remove vote (single vote per member per idea)
- Comments:
	- nested comments/replies
	- admin/member-author delete support
- Reviews:
	- member experiences with rating
- Payments:
	- paid/free idea access checks
	- creator bypass for own paid idea
	- Stripe checkout + webhook + verification
	- purchased ideas retrieval for member dashboard

## Environment Variables

Create `.env` in this folder:

```env
PORT=5000
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DB_NAME
JWT_SECRET=your_jwt_secret

CLIENT_URL=http://localhost:3000

STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

## Local Setup

```bash
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
```

API base URL: `http://localhost:5000/api`

## API Modules

- `/api/auth`
- `/api/ideas`
- `/api/categories`
- `/api/votes`
- `/api/comments`
- `/api/reviews`
- `/api/watchlist`
- `/api/payments`
- `/api/admin`

## Notes

- Use Stripe CLI/webhook forwarding in local environment for payment event testing.
- Ensure frontend `NEXT_PUBLIC_API_URL` matches this server URL.
