# Knowledge Clean - Personal Knowledge Vault ()

A modern Next.js application for managing personal knowledge entries with authentication and search capabilities.

## 🚀 Deployment Status Test

**Latest Update**: October 8, 2025 - All users cleared, fresh authentication system ready
- ✅ Database schema migrations fixed
- ✅ Sign-up page working
- ✅ Data persistence configured for CapRover
- 🔄 **Test Sign-up**: Create new account at `/sign-up` to verify deployment

## Features

- 🔐 Secure authentication with NextAuth.js
- 📝 Create, read, update, and delete knowledge entries
- 🔍 Search and filter knowledge entries
- 💾 SQLite database with better-sqlite3
- 🌐 PWA support for offline usage
- 🐳 Docker ready for easy deployment

## Tech Stack

- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: Tailwind CSS, Radix UI components
- **Database**: SQLite with better-sqlite3
- **Authentication**: NextAuth.js
- **Deployment**: Docker, CapRover compatible

## Quick Start

### Development

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env.local
```

3. Initialize the database:
```bash
npm run setup-db
```

4. Start the development server:
```bash
npm run dev
```

### Production Deployment with CapRover

1. **Prerequisites**:
   - CapRover instance running
   - Domain/subdomain configured

2. **Environment Variables** (set in CapRover):
   ```
   NEXTAUTH_SECRET=your-super-secret-key-here
   NEXTAUTH_URL=https://your-app-domain.com
   DB_PATH=/usr/src/app/data/knowledge.db
   NODE_ENV=production
   ```

3. **Persistent Storage & Data Safety**:
   - ⚠️ **IMPORTANT**: Configure persistent directory in CapRover to prevent data loss:
     - Path in App: `/usr/src/app/data`
     - Label: `database_storage`
   - ✅ **Data Persistence**: Your database will survive deployments and container restarts
   - 💾 **Backup Recommended**: Regular backups of `/usr/src/app/data/knowledge.db`

4. **Deploy**:
   - Upload project as TAR file, or
   - Connect Git repository with webhook
   - The `captain-definition` file is already configured

5. **Port Configuration**:
   - Container HTTP Port: `3000`
   - The app will be available on your configured domain

## Database

The application uses SQLite with better-sqlite3 for optimal performance:
- Database file: `knowledge.db`
- Production location: `/usr/src/app/data/knowledge.db`
- Automatically created on first run
- Migrations run automatically

## Authentication

- Email/password authentication
- Optional GitHub OAuth (configure `GITHUB_ID` and `GITHUB_SECRET`)
- Session management with JWT tokens

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run setup-db` - Initialize database
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript checks

## Production Notes

- Uses Node.js 20 Alpine in Docker for minimal image size
- Better-sqlite3 compiled with native support
- Health checks configured for container monitoring
- Persistent volume required for database storage
- PWA enabled for offline capability

## License

MIT License
