import { type ReactNode } from "react";
import { useLocation } from "wouter";
import Navigation from "./Navigation";
import Footer from "./Footer";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  
  // Don't show header/footer on auth pages
  const isAuthPage = location === "/login" || location === "/signup";
  
  if (isAuthPage) {
    return (
      <div className="min-h-screen" data-testid="auth-layout">
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" data-testid="main-layout">
      <Navigation />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}