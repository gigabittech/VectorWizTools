import { Link, useLocation } from "wouter";
import { BASE_PATH } from "../../lib/queryClient";
import { FileText, Menu as MenuIcon, X, ChevronDown } from "lucide-react";
import { useState } from "react";
import QuoteRequestForm from "../QuoteRequestForm";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import logoImage from "@assets/VectorWiz-logo_1760804742760.png";

const SERVICES_LINKS = [
  { text: "Vector Silhouette Service", url: "https://vectorwiz.com/vector-silhouette-service/" },
  { text: "Vector Line Drawing", url: "https://vectorwiz.com/vector-line-drawing-service/" },
  { text: "Vector Art Conversion", url: "https://vectorwiz.com/vector-art-conversion-service/" },
  { text: "Vector Logo Conversion", url: "https://vectorwiz.com/vector-logo-conversion-service/" },
  { text: "Badge Vector Conversion", url: "https://vectorwiz.com/badge-vector-conversion/" },
  { text: "Pets Vector Conversion", url: "https://vectorwiz.com/pets-vector-conversion/" },
  { text: "Vehicles Vector Conversion", url: "https://vectorwiz.com/vehicles-vector-conversion/" },
  { text: "JPG to Vector Conversion", url: "https://vectorwiz.com/jpg-to-vector-conversion/" },
  { text: "Image to Vector Conversion", url: "https://vectorwiz.com/image-to-vector-conversion/" },
  { text: "PDF to Vector Conversion", url: "https://vectorwiz.com/convert-pdf-to-vector-file/" },
  { text: "AI Image to Vector Conversion", url: "https://vectorwiz.com/ai-image-to-vector-conversion/" },
];

const INDUSTRIES_LINKS = [
  { text: "Sign Companies & Sign Shops", url: "https://vectorwiz.com/industries/sign-shops/" },
  { text: "Print Shops", url: "https://vectorwiz.com/industries/print-shops/" },
  { text: "eCommerce Sellers", url: "https://vectorwiz.com/industries/ecommerce-sellers/" },
  { text: "Fashion Brands", url: "https://vectorwiz.com/industries/fashion-brands/" },
  { text: "Embroidery Shops", url: "https://vectorwiz.com/industries/embroidery-shops/" },
  { text: "Photography Studios", url: "https://vectorwiz.com/industries/photography-studios/" },
  { text: "Real Estate", url: "https://vectorwiz.com/industries/real-estate/" },
  { text: "Packaging Design", url: "https://vectorwiz.com/industries/packaging-design/" },
];

export default function Navigation() {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [quoteDialogOpen, setQuoteDialogOpen] = useState(false);

  const isActive = (href: string) => {
    const normalizedHref = href === "/" ? (BASE_PATH || "/") : href;
    if (normalizedHref === "/" || normalizedHref === BASE_PATH) {
      return location === "/" || location === BASE_PATH;
    }
    return location === normalizedHref || location.startsWith(normalizedHref);
  };

  return (
    <>
      <nav
        className="sticky top-0 z-50 backdrop-blur-lg bg-[#06183C]/95 border-b border-white/10 shadow-lg"
        data-testid="main-navigation"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Desktop & Tablet Header Content */}
          <div className="flex justify-between items-center h-16 md:h-20">
            {/* Logo Section */}
            <div className="flex items-center">
              <Link href="/" className="flex items-center" data-testid="logo-link">
                <img
                  src={logoImage}
                  alt="VectorWiz"
                  className="h-6 md:h-10 transition-all duration-300"
                />
              </Link>
            </div>

            {/* Desktop Navigation Links */}
            <div className="hidden lg:flex items-center space-x-8">
              <a href="https://vectorwiz.com/" className="text-white hover:text-[#0B9F47] transition-colors text-sm font-semibold uppercase tracking-wider">Home</a>
              
              {/* Services Dropdown */}
              <div className="relative group py-4">
                <button className="flex items-center gap-1 text-white hover:text-[#0B9F47] transition-colors text-sm font-semibold uppercase tracking-wider">
                  Services <ChevronDown className="h-4 w-4" />
                </button>
                <div className="absolute left-0 top-[100%] hidden group-hover:block w-64 bg-[#0a1b3d] border border-white/10 shadow-2xl rounded-b-xl py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                  {SERVICES_LINKS.map((link, idx) => (
                    <a key={idx} href={link.url} className="block px-6 py-2.5 text-[13px] text-white/80 hover:text-white hover:bg-[#0B9F47]/20 transition-all border-b border-white/5 last:border-0">{link.text}</a>
                  ))}
                </div>
              </div>

              {/* Industries Dropdown */}
              <div className="relative group py-4">
                <button className="flex items-center gap-1 text-white hover:text-[#0B9F47] transition-colors text-sm font-semibold uppercase tracking-wider">
                  Industries <ChevronDown className="h-4 w-4" />
                </button>
                <div className="absolute left-0 top-[100%] hidden group-hover:block w-64 bg-[#0a1b3d] border border-white/10 shadow-2xl rounded-b-xl py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                  {INDUSTRIES_LINKS.map((link, idx) => (
                    <a key={idx} href={link.url} className="block px-6 py-2.5 text-[13px] text-white/80 hover:text-white hover:bg-[#0B9F47]/20 transition-all border-b border-white/5 last:border-0">{link.text}</a>
                  ))}
                </div>
              </div>

              <Link href="/" className={`text-sm font-semibold uppercase tracking-wider transition-colors ${isActive("/") ? "text-[#0B9F47]" : "text-white hover:text-[#0B9F47]"}`}>Tools</Link>
              <a href="https://vectorwiz.com/insights/" className="text-white hover:text-[#0B9F47] transition-colors text-sm font-semibold uppercase tracking-wider">Insights</a>
              <a href="https://vectorwiz.com/contact/" className="text-white hover:text-[#0B9F47] transition-colors text-sm font-semibold uppercase tracking-wider">Contact</a>
            </div>

            {/* Desktop Request Quote & Mobile Icons */}
            <div className="flex items-center space-x-4">
              {/* Request Quote Button (Full for Desktop/Tablet, Centered on Mobile via flex layout) */}
              <button
                onClick={() => setQuoteDialogOpen(true)}
                className="hidden md:flex items-center gap-2 px-6 py-3 rounded-full bg-[#10A342] hover:bg-white hover:text-[#10A342] text-white font-bold text-[13px] uppercase tracking-wider transition-all shadow-lg hover:shadow-xl"
                data-testid="request-quote-button"
              >
                REQUEST QUOTE
              </button>

              {/* Mobile View Content (Logo Left, Button Center, Menu Right) */}
              <div className="lg:hidden flex items-center justify-between w-full md:w-auto gap-4">
                <button
                  onClick={() => setQuoteDialogOpen(true)}
                  className="flex md:hidden items-center px-4 py-2 rounded-lg bg-[#10A342] text-white font-bold text-[11px] uppercase tracking-wider transition-all"
                  data-testid="mobile-request-quote-button-centered"
                >
                  REQUEST QUOTE
                </button>

                <button
                  onClick={() => setMobileMenuOpen(true)}
                  className="p-1 text-[#0B9F47] hover:brightness-125 transition-all"
                  data-testid="mobile-menu-button"
                >
                  <MenuIcon className="h-8 w-8" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation Sheet */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent
          side="right"
          className="backdrop-blur-xl bg-[#06183C]/98 border-white/20 text-white w-[85%] max-w-[350px] overflow-y-auto"
          data-testid="mobile-navigation-sheet"
        >
          <div className="flex flex-col h-full pt-10">
            <div className="flex justify-between items-center px-6 mb-8">
              <img src={logoImage} alt="VectorWiz" className="h-6" />
              <button onClick={() => setMobileMenuOpen(false)} className="text-[#0B9F47]"><X className="h-8 w-8"/></button>
            </div>

            <nav className="flex flex-col px-6 space-y-4">
              <a href="https://vectorwiz.com/" className="text-lg font-bold uppercase py-2 tracking-wide border-b border-white/5">Home</a>
              
              <div className="space-y-4">
                <p className="text-sm font-black text-[#0B9F47] uppercase tracking-widest pt-2">Services</p>
                <div className="flex flex-col space-y-3 pl-2">
                  {SERVICES_LINKS.slice(0, 6).map((link, idx) => (
                    <a key={idx} href={link.url} className="text-[14px] text-white/70 hover:text-white">{link.text}</a>
                  ))}
                  <a href="https://vectorwiz.com/vector-conversion-services/" className="text-[14px] text-[#0B9F47] font-bold">More Services...</a>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-sm font-black text-[#0B9F47] uppercase tracking-widest pt-2">Industries</p>
                <div className="flex flex-col space-y-3 pl-2">
                  {INDUSTRIES_LINKS.map((link, idx) => (
                    <a key={idx} href={link.url} className="text-[14px] text-white/70 hover:text-white">{link.text}</a>
                  ))}
                </div>
              </div>

              <Link href="/" onClick={() => setMobileMenuOpen(false)} className="text-lg font-bold uppercase py-2 tracking-wide border-b border-white/5">Tools</Link>
              <a href="https://vectorwiz.com/insights/" className="text-lg font-bold uppercase py-2 tracking-wide border-b border-white/5">Insights</a>
              <a href="https://vectorwiz.com/contact/" className="text-lg font-bold uppercase py-2 tracking-wide border-b border-white/5">Contact</a>
            </nav>
          </div>
        </SheetContent>
      </Sheet>

      {/* Quote Request Dialog */}
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

export function useQuoteDialog() {
  const [quoteDialogOpen, setQuoteDialogOpen] = useState(false);
  return {
    openQuoteDialog: () => setQuoteDialogOpen(true),
    QuoteDialog: () => (
      <Dialog open={quoteDialogOpen} onOpenChange={setQuoteDialogOpen}>
        <DialogContent
          className="max-w-3xl max-h-[90vh] overflow-y-auto text-white border-white/20 backdrop-blur-xl shadow-2xl"
          style={{
            background: "linear-gradient(75deg, rgba(6, 24, 60, 0.95) 0%, rgba(32, 68, 139, 0.95) 100%)"
          }}
        >
          <QuoteRequestForm />
        </DialogContent>
      </Dialog>
    ),
  };
}
