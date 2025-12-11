'use client';

import { signIn } from 'next-auth/react';
import Link from 'next/link';

import { Container, Box, Network, Zap, Shield, Activity } from 'lucide-react';

export default function SignInPage() {
  return (
    <div className="min-h-screen flex relative overflow-hidden bg-background">
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-primary/10" />
      
      {/* Animated grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
      
      {/* Floating orbs */}
      <div className="absolute top-16 left-16 w-48 h-48 bg-primary/20 rounded-full blur-2xl animate-pulse" />
      <div className="absolute bottom-16 right-16 w-64 h-64 bg-blue-500/10 rounded-full blur-2xl animate-pulse delay-1000" />
      
      {/* Left side - Branding & Features */}
      <div className="hidden lg:flex lg:w-1/2 relative z-10 flex-col justify-center px-8 xl:px-12">
        <div className="space-y-6">
          {/* Logo and title */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-lg rounded-full" />
                <div className="relative w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center transition-transform hover:scale-110 shadow-xl">
                  <Container className="w-7 h-7 text-primary" />
                </div>
              </div>
              <h1 className="text-4xl font-bold text-foreground">
                Dock<span className="text-primary">Sphere</span>
              </h1>
            </div>
            <p className="text-lg text-muted-foreground max-w-md">
              Modern Docker container management with real-time monitoring and intelligent orchestration
            </p>
          </div>

          {/* Feature highlights */}
          <div className="grid grid-cols-2 gap-3 pt-6">
            <div className="group p-3 rounded-lg bg-card border border-border hover:border-primary/50 transition-all hover:shadow-md hover:shadow-primary/5">
              <div className="flex items-center gap-2 mb-1">
                <div className="p-1.5 rounded-md bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <Zap className="h-4 w-4 text-primary" />
                </div>
                <h3 className="font-medium text-sm">Real-time</h3>
              </div>
              <p className="text-xs text-muted-foreground">Live container monitoring and updates</p>
            </div>

            <div className="group p-3 rounded-lg bg-card border border-border hover:border-primary/50 transition-all hover:shadow-md hover:shadow-primary/5">
              <div className="flex items-center gap-2 mb-1">
                <div className="p-1.5 rounded-md bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <Shield className="h-4 w-4 text-primary" />
                </div>
                <h3 className="font-medium text-sm">Secure</h3>
              </div>
              <p className="text-xs text-muted-foreground">Enterprise-grade authentication</p>
            </div>

            <div className="group p-3 rounded-lg bg-card border border-border hover:border-primary/50 transition-all hover:shadow-md hover:shadow-primary/5">
              <div className="flex items-center gap-2 mb-1">
                <div className="p-1.5 rounded-md bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <Network className="h-4 w-4 text-primary" />
                </div>
                <h3 className="font-medium text-sm">Networks</h3>
              </div>
              <p className="text-xs text-muted-foreground">Advanced network management</p>
            </div>

            <div className="group p-3 rounded-lg bg-card border border-border hover:border-primary/50 transition-all hover:shadow-md hover:shadow-primary/5">
              <div className="flex items-center gap-2 mb-1">
                <div className="p-1.5 rounded-md bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <Activity className="h-4 w-4 text-primary" />
                </div>
                <h3 className="font-medium text-sm">Analytics</h3>
              </div>
              <p className="text-xs text-muted-foreground">Resource usage insights</p>
            </div>
          </div>


        </div>
      </div>

      {/* Right side - Sign in form */}
      <div className="flex-1 flex items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-2 mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-lg rounded-full" />
              <div className="relative w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center transition-transform hover:scale-110 shadow-xl">
                <Container className="w-5 h-5 text-primary" />
              </div>
            </div>
            <h1 className="text-2xl font-bold">Dock<span className="text-primary">Sphere</span></h1>
          </div>

          {/* Sign in card */}
          <div className="relative">
            {/* Glow effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-blue-500/20 rounded-xl blur-lg opacity-75" />
            
            <div className="relative bg-card border border-border rounded-xl shadow-xl p-6 space-y-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Sign in to access your Docker environment
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => signIn('google', { callbackUrl: '/' })}
                  className="w-full h-10 bg-white hover:bg-gray-50 text-gray-700 font-medium rounded-lg border border-gray-300 shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 group"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  <span className="text-xs font-medium">Sign in with Google</span>
                </button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border/50" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">Secure Authentication</span>
                  </div>
                </div>
              </div>

              {/* Features list */}
              <div className="space-y-2 pt-3">
                <div className="flex items-center gap-2 text-xs">
                  <div className="p-1 rounded-sm bg-primary/10">
                    <Box className="h-3 w-3 text-primary" />
                  </div>
                  <span className="text-muted-foreground">Manage containers, images & volumes</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="p-1 rounded-sm bg-primary/10">
                    <Network className="h-3 w-3 text-primary" />
                  </div>
                  <span className="text-muted-foreground">Configure networks & orchestration</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="p-1 rounded-sm bg-primary/10">
                    <Activity className="h-3 w-3 text-primary" />
                  </div>
                  <span className="text-muted-foreground">Monitor resources in real-time</span>
                </div>
              </div>

              <p className="text-xs text-center text-muted-foreground pt-3 border-t border-border/50">
                By signing in, you agree to our{' '}
                <Link href="/terms" className="text-primary hover:underline">Terms</Link>
                {' '}and{' '}
                <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
              </p>
            </div>
          </div>

          {/* Additional info */}
          <div className="mt-6 text-center">
            <p className="text-xs text-muted-foreground">
              Need help?{' '}
              <a href="#" className="text-primary hover:underline font-medium">
                Contact support
              </a>
            </p>
          </div>

          {/* Open Source info */}
          <div className="mt-4 p-4 rounded-lg bg-card border border-border space-y-3">
            <div className="text-center space-y-1">
              <p className="text-xs font-semibold text-foreground flex items-center justify-center gap-1">
                <span>🚀</span>
                <span>Open Source Project</span>
              </p>
              <p className="text-xs text-muted-foreground">
                Install via Docker or contribute on GitHub
              </p>
            </div>
              
            {/* Docker command */}
            <div className="p-2 bg-background/80 rounded border border-border/30 space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Quick Install:</p>
              <code className="text-xs text-primary font-mono block bg-muted/50 px-2 py-1 rounded select-all">
                docker run -d -p 3000:3000 docksphere/app:latest
              </code>
            </div>

            <div className="flex justify-center">
              <a
                href="https://github.com/YOUR_USERNAME/container-hub-plus"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-foreground bg-background hover:bg-accent rounded border border-border/50 hover:border-primary/50 transition-all"
              >
                <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
                View on GitHub
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
