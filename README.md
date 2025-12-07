# 🧠 KnowledgeVerse

A modern personal knowledge management system built with Next.js and Supabase.

[![Live Demo](https://img.shields.io/badge/demo-live-success?style=flat-square)](https://kaledh4.github.io/knowledge-cleanN/)
[![Next.js](https://img.shields.io/badge/Next.js-15.3-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-2.39-green?style=flat-square&logo=supabase)](https://supabase.com/)

## ✨ Features

- 🔐 **Secure Authentication** - Email/password auth with Supabase
- � **Knowledge Management** - Create, edit, and organize your knowledge
- 🏷️ **Tag System** - Organize with customizable colored tags
- � **Search & Filter** - Find what you need quickly
- 📱 **PWA Support** - Install as an app, works offline
- � **Export** - Download your knowledge base as JSON
- 🤖 **AI Insights** - Optional daily knowledge analysis

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- A Supabase account ([sign up free](https://supabase.com))

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/kaledh4/knowledge-cleanN.git
   cd knowledge-cleanN
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   - Create a new project at [supabase.com](https://supabase.com)
   - Run the SQL migrations from `/migrations` folder in order
   - Copy your project URL and anon key

4. **Configure environment**
   
   Create `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   ```

5. **Run locally**
   ```bash
   npm run dev
   ```
   
   Open [http://localhost:3000](http://localhost:3000)

## 📦 Tech Stack

- **Frontend:** Next.js 15, React 18, TypeScript, Tailwind CSS
- **Backend:** Supabase (PostgreSQL, Auth, Real-time)
- **UI Components:** Radix UI
- **Deployment:** GitHub Pages (static export)

## 🌐 Deployment

This app is configured for GitHub Pages deployment via GitHub Actions.

### Deploy to GitHub Pages

1. Fork this repository
2. Go to Settings → Pages → Source: "GitHub Actions"
3. Add secrets: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Push to main branch - automatic deployment!

Your app will be at: `https://[username].github.io/knowledge-cleanN/`

### Deploy to Other Platforms

**Vercel** (Recommended for full features):
```bash
vercel
```

**Netlify, Railway, or any Node.js host**:
```bash
npm run build
npm start
```

## 📝 Database Setup

Execute these SQL files in your Supabase SQL Editor (in order):

1. `migrations/001-initial-schema-version.sql`
2. `migrations/002-create-initial-tables.sql`
3. `migrations/003-fix-users-table-schema.sql`
4. `migrations/006-create-tags-table.sql`
5. `supabase_schema.sql` (optional, for AI features)

## 🔒 Security

- Row-Level Security (RLS) enabled on all tables
- JWT-based authentication
- Secure password hashing
- Environment variables for sensitive data

## 🤝 Contributing

Contributions welcome! Feel free to open issues or submit pull requests.

## 📄 License

MIT License - see LICENSE file for details.

---

**Built with ❤️ using Next.js and Supabase**
