# Career Counselor Chat Application

This repository contains a full-stack career counseling chat application built with Next.js, TypeScript, tRPC, TanStack Query (React Query), Prisma ORM, and a Neon PostgreSQL database. The app integrates AI APIs to provide career guidance through conversational chat sessions.

screensort:
![Chat interface screenshot](public/careerpage.png)


---

## Technology Stack

- **Next.js** (React framework)
- **TypeScript** for static typing
- **tRPC** for type-safe API routes
- **TanStack Query (React Query)** for data fetching and caching
- **Prisma ORM** for database access and schema management
- **Neon** PostgreSQL database (cloud-hosted PostgreSQL)
- **OpenAI API** (or any chosen AI API) for AI career counseling responses

---

## Getting Started

### Prerequisites

- Node.js (version 18 or higher recommended)
- npm or yarn package manager
- A Neon PostgreSQL database account and connection string
- AI API key (e.g., OpenAI API key) for career counseling feature

---

### Setup Instructions

1. **Clone the Repository**

git clone https://github.com/Mtank10/career-counselling-chat-app
cd career-counselling-chat-app

2. **Install Dependencies**

npm install

or
yarn install

text

3. **Configure Environment Variables**

Create a `.env` file in the root of the project with the following variables:

Database connection string to Neon PostgreSQL
DATABASE_URL="postgresql://username:password@host:port/dbname"

Gemini API Key (or other AI API key)
GEMINI_API_KEY="your-api-key"

Optional: NextAuth or authentication secret if using auth
NEXTAUTH_SECRET="your-auth-secret"

Any other environment variables your app requires
text

> **Important:** Never commit `.env` files to version control. Use `.env.example` to share required variables without sensitive values.

4. **Database Setup and Migration**

Run Prisma migrations to create the database schema:

npx prisma migrate dev --name init

text

Generate Prisma client:

npx prisma generate

text

5. **Run the Development Server**

npm run dev
