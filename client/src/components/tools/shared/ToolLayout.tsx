import { useEffect, ReactNode, useState } from "react";
import { Link } from "wouter";
import { ChevronRight, Home } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import QuoteRequestForm from "@/components/QuoteRequestForm";
import {
  setPageMetadata,
  injectJSONLD,
  generateSoftwareApplicationSchema,
  generateHowToSchema
} from "@/lib/seoHelpers";

interface ToolLayoutProps {
  title: string;
  description: string;
  children: ReactNode;
  category?: "Image Tools" | "PDF Tools";
  keywords?: string[];
  howToSteps?: Array<{
    name: string;
    text: string;
  }>;
}

export default function ToolLayout({
  title,
  description,
  children,
  category = "Image Tools",
  keywords = [],
  howToSteps,
}: ToolLayoutProps) {
  const [quoteDialogOpen, setQuoteDialogOpen] = useState(false);

  useEffect(() => {
    // Set page metadata using helper function
    setPageMetadata({
      title: `${title} - Free Online Tool | VectorWiz`,
      description,
      keywords: [title.toLowerCase(), category.toLowerCase(), ...keywords],
      ogTitle: `${title} - VectorWiz`,
      ogDescription: description,
      ogType: 'website',
      ogUrl: window.location.href
    });

    // Generate JSON-LD schemas
    const schemas = [];
    
    // Add SoftwareApplication schema
    schemas.push(generateSoftwareApplicationSchema({
      name: title,
      description,
      applicationCategory: "UtilityApplication",
      operatingSystem: "Any",
      price: "0",
      priceCurrency: "USD"
    }));

    // Add HowTo schema if steps provided
    if (howToSteps && howToSteps.length > 0) {
      schemas.push(generateHowToSchema({
        name: `How to use ${title}`,
        description,
        steps: howToSteps
      }));
    }

    // Inject schemas and get cleanup function
    const cleanupSchema = injectJSONLD(schemas);

    // Return cleanup function
    return cleanupSchema;
  }, [title, description, category, keywords, howToSteps]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Breadcrumbs with Glassmorphism */}
      <nav className="backdrop-blur-md bg-white/70 border-b border-white/20 py-3 px-4 sm:px-6 lg:px-8 sticky top-16 z-40" data-testid="breadcrumbs">
        <div className="max-w-7xl mx-auto">
          <ol className="flex items-center space-x-2 text-sm">
            <li>
              <Link href="/" className="flex items-center text-gray-500 hover:text-[#0B9F47] transition-colors" data-testid="breadcrumb-home">
                <Home className="h-4 w-4" />
              </Link>
            </li>
            <li className="flex items-center">
              <ChevronRight className="h-4 w-4 text-gray-400 mx-2" />
              <Link href="/" className="text-gray-500 hover:text-[#0B9F47] transition-colors" data-testid="breadcrumb-tools">
                Tools
              </Link>
            </li>
            <li className="flex items-center">
              <ChevronRight className="h-4 w-4 text-gray-400 mx-2" />
              <span className="text-gray-900 font-medium" data-testid="breadcrumb-current">
                {title}
              </span>
            </li>
          </ol>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-[#06183C] to-[#20448B] text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-4" data-testid="tool-title">
            {title}
          </h1>
          <p className="text-lg text-gray-200 max-w-2xl mx-auto" data-testid="tool-description">
            {description}
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>

      {/* Footer CTA with Glassmorphism */}
      <section className="relative mt-12 py-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Background with Gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#06183C] to-[#20448B]" />
        
        {/* Glassmorphism Overlay */}
        <div className="absolute inset-0 backdrop-blur-sm bg-white/5" />
        
        {/* Content */}
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="backdrop-blur-lg bg-white/10 border border-white/20 rounded-2xl p-8 shadow-2xl">
            <h2 className="text-2xl md:text-3xl font-bold mb-4 text-white">
              Need Professional Vector Conversion?
            </h2>
            <p className="text-gray-200 mb-6 text-lg">
              Our expert team can handle complex vectorization projects with precision and quality.
            </p>
            <button 
              onClick={() => setQuoteDialogOpen(true)}
              className="inline-flex items-center px-8 py-3 rounded-full bg-[#0B9F47] hover:bg-[#0B9F47]/90 text-white font-medium transition-all shadow-lg hover:shadow-xl backdrop-blur-sm transform hover:scale-105" 
              data-testid="cta-button"
            >
              Request a Quote
            </button>
          </div>
        </div>
      </section>

      {/* Quote Request Dialog */}
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
    </div>
  );
}
