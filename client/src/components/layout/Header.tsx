import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Wrench, Menu, X } from "lucide-react";
import { useState } from "react";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navigationItems = [
    { label: "Services", href: "https://vectorwiz.com/#services" },
    { label: "How It Works", href: "https://vectorwiz.com/#how-it-works" },
    { label: "Portfolio", href: "https://vectorwiz.com/#portfolio" },
    { label: "Pricing", href: "https://vectorwiz.com/#pricing" },
    { label: "About", href: "https://vectorwiz.com/about" },
    { label: "Contact", href: "https://vectorwiz.com/contact" },
  ];

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3" data-testid="header-logo">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Wrench className="h-5 w-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold text-gray-900">VectorWiz</span>
              <span className="text-xs text-blue-600 font-medium">Portal</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navigationItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200"
                data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <a
              href="https://vectorwiz.com/#order-now"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button 
                variant="outline" 
                className="border-blue-600 text-blue-600 hover:bg-blue-50"
                data-testid="get-quote-button"
              >
                Get Quote
              </Button>
            </a>
            <a
              href="https://vectorwiz.com/#order-now"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button 
                className="bg-blue-600 hover:bg-blue-700 text-white"
                data-testid="order-now-button"
              >
                Order Now
              </Button>
            </a>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            data-testid="mobile-menu-button"
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4" data-testid="mobile-menu">
            <nav className="flex flex-col space-y-4">
              {navigationItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200 px-4 py-2"
                  onClick={() => setIsMenuOpen(false)}
                  data-testid={`mobile-nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  {item.label}
                </a>
              ))}
              <div className="flex flex-col space-y-2 px-4 pt-4 border-t border-gray-200">
                <a
                  href="https://vectorwiz.com/#order-now"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Button 
                    variant="outline" 
                    className="w-full border-blue-600 text-blue-600 hover:bg-blue-50"
                    data-testid="mobile-get-quote-button"
                  >
                    Get Quote
                  </Button>
                </a>
                <a
                  href="https://vectorwiz.com/#order-now"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Button 
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    data-testid="mobile-order-now-button"
                  >
                    Order Now
                  </Button>
                </a>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}