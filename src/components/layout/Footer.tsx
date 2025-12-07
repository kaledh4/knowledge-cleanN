'use client';

import { Brain, LogOut, Tag } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function Footer() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut();
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <footer className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto max-w-7xl px-4 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Brain className="h-6 w-6 text-primary" />
              <span className="font-headline text-xl font-bold">KnowledgeVerse</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Your personal knowledge management system. Capture, organize, and discover insights from anywhere.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="font-semibold">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
                  Knowledge Vault
                </Link>
              </li>
              <li>
                <Link href="/how-to" className="text-muted-foreground hover:text-foreground transition-colors">
                  How to Use
                </Link>
              </li>
              <li>
                <Link href="/customize-tags" className="text-muted-foreground hover:text-foreground transition-colors">
                  Customize Tags
                </Link>
              </li>
              <li>
                <Link href="/export" className="text-muted-foreground hover:text-foreground transition-colors">
                  Export
                </Link>
              </li>
            </ul>
          </div>

          {/* Features */}
          <div className="space-y-4">
            <h3 className="font-semibold">Features</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Smart Tagging System</li>
              <li>Semantic Search</li>
              <li>Multi-format Support</li>
              <li>AI-Powered Organization</li>
              <li>Mobile Share Integration</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold">Account</h3>
            <div className="space-y-2">
              {user && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleLogout}
                  className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-8 pt-8 border-t flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
          <p className="text-sm text-muted-foreground">
            © 2026 KnowledgeVerse. Built for knowledge seekers.
          </p>
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Brain className="h-4 w-4" />
            <span>Made by AI</span>
          </div>
        </div>
      </div>
    </footer>
  );
}