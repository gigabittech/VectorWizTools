import { Link, useLocation } from "wouter";
import { FileText, Menu as MenuIcon, X } from "lucide-react";
import { useState } from "react";
import QuoteRequestForm from "../QuoteRequestForm";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

export default function Navigation() {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [quoteDialogOpen, setQuoteDialogOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/") {
      return location === "/";
    }
    return location === href || location.startsWith(href);
  };

  return (
    <>
      <nav
        className="sticky top-0 z-50 backdrop-blur-lg bg-[#06183C]/95 border-b border-white/10 shadow-lg"
        data-testid="main-navigation"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <Link href="/" className="flex items-center" data-testid="logo-link">
                <img
                  src="https://vectorwiz.com/wp-content/uploads/2023/02/VectorWiz-New-Logo-04.svg"
                  alt="VectorWiz"
                  className="h-10"
                />
              </Link>

              {/* Desktop Navigation */}
              <div className="hidden md:flex space-x-6">
                <a
                  href="https://vectorwiz.com/"
                  className="text-white/90 hover:text-white transition-colors text-sm font-medium"
                  data-testid="nav-home"
                >
                  Home
                </a>
                <a
                  href="https://vectorwiz.com/services"
                  className="text-white/90 hover:text-white transition-colors text-sm font-medium"
                  data-testid="nav-services"
                >
                  Services
                </a>
                <Link
                  href="/"
                  className={`transition-colors text-sm font-medium ${
                    isActive("/")
                      ? "text-[#0B9F47]"
                      : "text-white/90 hover:text-white"
                  }`}
                  data-testid="nav-tools"
                >
                  Tools
                </Link>
                <a
                  href="https://vectorwiz.com/contact/"
                  className="text-white/90 hover:text-white transition-colors text-sm font-medium"
                  data-testid="nav-contact"
                >
                  Contact
                </a>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Request Quote Button with Glassmorphism */}
              <button
                onClick={() => setQuoteDialogOpen(true)}
                className="hidden md:flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#0B9F47] hover:bg-[#0B9F47]/90 text-white font-medium transition-all shadow-lg hover:shadow-xl backdrop-blur-sm"
                data-testid="request-quote-button"
              >
                <FileText className="h-4 w-4" />
                Request Quote
              </button>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="md:hidden p-2 text-white hover:text-white/80 transition-colors"
                data-testid="mobile-menu-button"
              >
                <MenuIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation Sheet with Glassmorphism */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent 
          side="right"
          className="backdrop-blur-xl bg-[#06183C]/95 border-white/20 text-white w-[280px] sm:w-[320px]"
          data-testid="mobile-navigation-sheet"
        >
          <SheetHeader className="border-b border-white/10 pb-4 mb-6">
            <SheetTitle className="flex items-center justify-between">
              <img
                src="https://vectorwiz.com/wp-content/uploads/2023/02/VectorWiz-New-Logo-04.svg"
                alt="VectorWiz"
                className="h-8"
              />
            </SheetTitle>
          </SheetHeader>
          
          <nav className="flex flex-col space-y-2">
            <a
              href="https://vectorwiz.com/"
              className="px-4 py-3 text-white/90 hover:text-white hover:bg-white/10 rounded-lg transition-all backdrop-blur-sm"
              data-testid="mobile-nav-home"
            >
              Home
            </a>
            <a
              href="https://vectorwiz.com/services"
              className="px-4 py-3 text-white/90 hover:text-white hover:bg-white/10 rounded-lg transition-all backdrop-blur-sm"
              data-testid="mobile-nav-services"
            >
              Services
            </a>
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className={`px-4 py-3 rounded-lg transition-all backdrop-blur-sm ${
                isActive("/")
                  ? "bg-[#0B9F47]/20 text-[#0B9F47] border border-[#0B9F47]/30"
                  : "text-white/90 hover:text-white hover:bg-white/10"
              }`}
              data-testid="mobile-nav-tools"
            >
              Tools
            </Link>
            <a
              href="https://vectorwiz.com/contact/"
              className="px-4 py-3 text-white/90 hover:text-white hover:bg-white/10 rounded-lg transition-all backdrop-blur-sm"
              data-testid="mobile-nav-contact"
            >
              Contact
            </a>

            <div className="pt-4 border-t border-white/10 mt-4">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setQuoteDialogOpen(true);
                }}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-[#0B9F47] hover:bg-[#0B9F47]/90 text-white font-medium transition-all shadow-lg"
                data-testid="mobile-request-quote-button"
              >
                <FileText className="h-4 w-4" />
                Request Quote
              </button>
            </div>
          </nav>
        </SheetContent>
      </Sheet>

      {/* Quote Request Dialog with Glassmorphism */}
      <Dialog open={quoteDialogOpen} onOpenChange={setQuoteDialogOpen}>
        <DialogContent 
          className="max-w-3xl max-h-[90vh] overflow-y-auto text-white border-white/20 backdrop-blur-xl shadow-2xl"
          style={{
            background: "linear-gradient(75deg, rgba(6, 24, 60, 0.95) 0%, rgba(32, 68, 139, 0.95) 100%)"
          }}
        >
          <VisuallyHidden>
            <DialogTitle>Request a Quote</DialogTitle>
            <DialogDescription>
              Fill out the form to request a custom quote for your vector conversion project
            </DialogDescription>
          </VisuallyHidden>
          <QuoteRequestForm />
        </DialogContent>
      </Dialog>
    </>
  );
}

// Export the hook for other components to use
export function useQuoteDialog() {
  const [quoteDialogOpen, setQuoteDialogOpen] = useState(false);
  
  return {
    openQuoteDialog: () => setQuoteDialogOpen(true),
    closeQuoteDialog: () => setQuoteDialogOpen(false),
    QuoteDialog: () => (
      <Dialog open={quoteDialogOpen} onOpenChange={setQuoteDialogOpen}>
        <DialogContent 
          className="max-w-3xl max-h-[90vh] overflow-y-auto text-white border-white/20 backdrop-blur-xl shadow-2xl"
          style={{
            background: "linear-gradient(75deg, rgba(6, 24, 60, 0.95) 0%, rgba(32, 68, 139, 0.95) 100%)"
          }}
        >
          <VisuallyHidden>
            <DialogTitle>Request a Quote</DialogTitle>
            <DialogDescription>
              Fill out the form to request a custom quote for your vector conversion project
            </DialogDescription>
          </VisuallyHidden>
          <QuoteRequestForm />
        </DialogContent>
      </Dialog>
    ),
  };
}
