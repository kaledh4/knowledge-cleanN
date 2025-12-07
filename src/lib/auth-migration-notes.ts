/**
 * AUTHENTICATION MIGRATION SUMMARY
 * 
 * Migrated from NextAuth to native Supabase authentication
 * 
 * CHANGES MADE:
 * 
 * 1. Created AuthContext (src/contexts/AuthContext.tsx)
 *    - Provides useAuth() hook with: user, loading, signIn, signUp, signOut, resetPassword
 *    - Manages auth state globally
 * 
 * 2. Updated Providers (src/components/providers/Providers.tsx)
 *    - Replaced SessionProvider with AuthProvider
 * 
 * 3. Removed NextAuth
 *    - Uninstalled next-auth package
 *    - Removed all next-auth imports
 * 
 * 4. Removed SettingsDialog
 *    - No more localStorage config UI
 *    - Credentials are injected via GitHub Secrets during build
 * 
 * 5. Updated KnowledgeVault
 *    - Uses useAuth() hook instead of useSession()
 *    - Shows AuthDialog when user is not logged in
 *    - Removed Settings button from Header
 * 
 * 6. AuthDialog (src/components/auth/AuthDialog.tsx)
 *    - Simple email/password authentication
 *    - Toggle between Sign In and Sign Up
 *    - Uses Supabase auth directly
 * 
 * GITHUB SECRETS REQUIRED:
 * - NEXT_PUBLIC_SUPABASE_URL
 * - NEXT_PUBLIC_SUPABASE_ANON_KEY
 * 
 * These are injected during build by .github/workflows/deploy-pages.yml
 */

export { };
