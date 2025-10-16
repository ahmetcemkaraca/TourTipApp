'use client';

import { Header } from './header';
import { Footer } from './footer';
import { AuthProvider } from '@/lib/auth';
import { ThemeProvider } from '@/components/ui/theme-provider';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <AuthProvider>
        <div className="min-h-screen flex flex-col">
          <Header />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
        </div>
      </AuthProvider>
    </ThemeProvider>
  );
}

// Alternative layout without footer (for auth pages, etc.)
export function SimpleLayout({ children }: LayoutProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <AuthProvider>
        <div className="min-h-screen flex flex-col">
          <Header />
          <main className="flex-1">
            {children}
          </main>
        </div>
      </AuthProvider>
    </ThemeProvider>
  );
}

// Admin layout (different header/sidebar)
export function AdminLayout({ children }: LayoutProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <AuthProvider>
        <div className="min-h-screen flex">
          {/* Admin Sidebar */}
          <aside className="w-64 bg-muted/30 border-r">
            <div className="p-6">
              <h2 className="text-lg font-semibold">Admin Panel</h2>
            </div>
            {/* Admin navigation will be added later */}
          </aside>
          
          <div className="flex-1 flex flex-col">
            {/* Admin Header */}
            <header className="h-16 border-b bg-background flex items-center px-6">
              <h1 className="text-xl font-semibold">Admin Dashboard</h1>
            </header>
            
            <main className="flex-1 p-6">
              {children}
            </main>
          </div>
        </div>
      </AuthProvider>
    </ThemeProvider>
  );
}
