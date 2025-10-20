'use client';
import { signIn } from 'next-auth/react';
import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      console.log('Attempting login for:', email);
      
      const res = await signIn('credentials', {
        email: email.trim(),
        password,
        redirect: false, // Don't redirect automatically
        callbackUrl: '/',
      });
      
      console.log('Login response:', res);
      
      if (res?.error) {
        console.error('Login error:', res.error);
        setError(res.error === 'CredentialsSignin' ? 'Invalid email or password' : res.error);
        setLoading(false);
      } else if (res?.ok) {
        console.log('Login successful, redirecting...');
        // Redirect manually on success
        window.location.href = res.url || '/';
      } else {
        console.error('Unexpected login response:', res);
        setError('Login failed. Please try again.');
        setLoading(false);
      }
    } catch (error) {
      console.error('Login exception:', error);
      setError('Login failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="Your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Signing in...' : 'Sign In'}
      </Button>

      <div className="text-center text-sm text-muted-foreground">
        <span>Don’t have an account? </span>
        <Link href="/sign-up" className="text-indigo-600">Sign Up</Link>
      </div>
    </form>
  );
}
