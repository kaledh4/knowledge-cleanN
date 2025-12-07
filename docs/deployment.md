# Deployment Guide

This guide covers deploying KnowledgeVerse to various platforms, with a focus on GitHub Pages for the documentation site.

## 🚀 Quick Deploy Options

### Vercel (Recommended for Full App)

Vercel is the easiest way to deploy Next.js applications with full SSR support.

**One-Click Deploy:**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/kaledh4/knowledge-cleanN)

**Manual Deployment:**

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Deploy:
   ```bash
   vercel
   ```

4. Add environment variables in Vercel dashboard:
   - Go to Project Settings → Environment Variables
   - Add:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `OPENROUTER_API_KEY` (optional)
     - `SUPABASE_SERVICE_ROLE_KEY` (optional)

5. Redeploy to apply variables

### Netlify

Deploy with Netlify for easy continuous deployment:

1. **Via Netlify UI:**
   - Go to [netlify.com](https://netlify.com)
   - Click "New site from Git"
   - Connect your GitHub repository
   - Build settings:
     - Build command: `npm run build`
     - Publish directory: `.next`
   - Add environment variables
   - Deploy!

2. **Via Netlify CLI:**
   ```bash
   npm install -g netlify-cli
   netlify login
   netlify init
   netlify deploy --prod
   ```

### Railway

Deploy to Railway with automatic HTTPS:

1. Visit [railway.app](https://railway.app)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Add environment variables
5. Railway will auto-detect Next.js and deploy

## 📄 GitHub Pages Deployment

GitHub Pages is perfect for hosting the **documentation site**, but has limitations for the full Next.js app.

### Option 1: Documentation Site Only (Recommended)

Use GitHub Pages to host beautiful documentation while keeping the app elsewhere.

**Setup:**

1. **Create a docs site** using a static site generator:
   ```bash
   # In a new branch or folder
   npx create-docusaurus@latest docs-site classic
   cd docs-site
   ```

2. **Configure for GitHub Pages:**

   Edit `docusaurus.config.js`:
   ```javascript
   module.exports = {
     title: 'KnowledgeVerse Docs',
     url: 'https://kaledh4.github.io',
     baseUrl: '/knowledge-cleanN/',
     organizationName: 'kaledh4',
     projectName: 'knowledge-cleanN',
     deploymentBranch: 'gh-pages',
   };
   ```

3. **Deploy:**
   ```bash
   GIT_USER=kaledh4 npm run deploy
   ```

This creates a `gh-pages` branch with your documentation.

4. **Configure GitHub Pages:**
   - Go to repository Settings → Pages
   - Source: Deploy from branch
   - Branch: `gh-pages` / `root`
   - Save

Your docs will be at: `https://kaledh4.github.io/knowledge-cleanN/`

### Option 2: Static Export (Limited Features)

Export Next.js as a static site (some features won't work):

**Important Limitations:**
- ❌ No API routes
- ❌ No server-side rendering
- ❌ No revalidation
- ⚠️ Limited authentication features
- ✅ Static pages only

**Setup:**

1. **Update `next.config.ts`:**
   ```typescript
   const nextConfig: NextConfig = {
     output: 'export',
     images: {
       unoptimized: true,
     },
     basePath: '/knowledge-cleanN',
     assetPrefix: '/knowledge-cleanN/',
   };
   ```

2. **Build:**
   ```bash
   npm run build
   ```

3. **Deploy the `out` folder:**

   **Using GitHub Actions:**

   Create `.github/workflows/deploy.yml`:
   ```yaml
   name: Deploy to GitHub Pages

   on:
     push:
       branches: [ main ]
     workflow_dispatch:

   permissions:
     contents: read
     pages: write
     id-token: write

   jobs:
     build:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4
         
         - name: Setup Node.js
           uses: actions/setup-node@v4
           with:
             node-version: '20'
             cache: 'npm'
         
         - name: Install dependencies
           run: npm ci
         
         - name: Build
           run: npm run build
         
         - name: Upload artifact
           uses: actions/upload-pages-artifact@v3
           with:
             path: ./out

     deploy:
       environment:
         name: github-pages
         url: ${{ steps.deployment.outputs.page_url }}
       runs-on: ubuntu-latest
       needs: build
       steps:
         - name: Deploy to GitHub Pages
           id: deployment
           uses: actions/deploy-pages@v4
   ```

4. **Enable GitHub Pages:**
   - Go to Settings → Pages
   - Source: GitHub Actions
   - Save

## 🐳 Docker Deployment

Deploy using Docker for maximum flexibility:

### Build Docker Image

```bash
# Build
docker build -t knowledgeverse .

# Run
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL=your_url \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key \
  knowledgeverse
```

### Docker Compose

Create `docker-compose.yml`:

```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
      - OPENROUTER_API_KEY=${OPENROUTER_API_KEY}
    restart: unless-stopped
```

Run with:
```bash
docker-compose up -d
```

## ⚙️ Environment Variables

### Required Variables

These must be set in your deployment platform:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Optional Variables

For AI features:

```env
OPENROUTER_API_KEY=sk-or-v1-xxxxx
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Setting Variables by Platform

**Vercel:**
- Dashboard → Project → Settings → Environment Variables

**Netlify:**
- Site settings → Build & deploy → Environment

**Railway:**
- Project → Variables tab

**GitHub Actions:**
- Repository → Settings → Secrets and variables → Actions

## 🔒 Security Checklist

Before deploying to production:

- [ ] All environment variables use secrets/env vars (not hardcoded)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is NOT exposed to client
- [ ] HTTPS is enabled (automatic on most platforms)
- [ ] Row-Level Security (RLS) is enabled in Supabase
- [ ] CORS is properly configured
- [ ] Rate limiting is considered (via Supabase or CDN)
- [ ] Error messages don't expose sensitive info
- [ ] Database backups are enabled (Supabase does this automatically)

## 🌐 Custom Domain Setup

### Vercel

1. Go to Project Settings → Domains
2. Add your domain (e.g., `knowledgeverse.com`)
3. Configure DNS:
   - Type: `CNAME`
   - Name: `@` or `www`
   - Value: `cname.vercel-dns.com`
4. Wait for DNS propagation (~24 hours)

### Netlify

1. Go to Site settings → Domain management
2. Add custom domain
3. Configure DNS:
   - Type: `CNAME`
   - Name: `www`
   - Value: `your-site.netlify.app`
   - Type: `A` (for apex domain)
   - Value: Netlify's IP

### GitHub Pages

1. Go to Settings → Pages
2. Custom domain: enter your domain
3. Configure DNS:
   - Type: `CNAME`
   - Name: `www`
   - Value: `kaledh4.github.io`
   - Type: `A` (for apex)
   - Values: GitHub's IPs:
     ```
     185.199.108.153
     185.199.109.153
     185.199.110.153
     185.199.111.153
     ```

## 📊 Monitoring & Analytics

### Add Analytics

**Vercel Analytics:**
```bash
npm install @vercel/analytics
```

In `src/app/layout.tsx`:
```typescript
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

### Error Tracking

Consider adding:
- [Sentry](https://sentry.io/) for error tracking
- [LogRocket](https://logrocket.com/) for session replay
- [Datadog](https://www.datadoghq.com/) for comprehensive monitoring

## 🔄 CI/CD Pipeline

### GitHub Actions Example

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

## 🚨 Troubleshooting

### Build Failures

**Problem:** Build fails with TypeScript errors

**Solution:**
```typescript
// next.config.ts
typescript: {
  ignoreBuildErrors: true, // Only for debugging!
}
```

**Problem:** Module not found errors

**Solution:**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Runtime Errors

**Problem:** "Failed to fetch" in production

**Solution:**
- Check environment variables are set correctly
- Verify Supabase URL is accessible from deployment region
- Check CORS settings in Supabase

**Problem:** 404 on page refresh (SPA routing)

**Solution:**
- Ensure your platform supports client-side routing
- For Netlify: Add `_redirects` file:
  ```
  /*    /index.html   200
  ```



## 📚 Additional Resources

- [Next.js Deployment Docs](https://nextjs.org/docs/deployment)
- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Production Checklist](https://supabase.com/docs/guides/platform/going-into-prod)
- [GitHub Pages Documentation](https://docs.github.com/en/pages)

---

Need help? [Open an issue](https://github.com/kaledh4/knowledge-cleanN/issues) on GitHub!
