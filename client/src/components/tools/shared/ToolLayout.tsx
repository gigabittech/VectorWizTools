import { useEffect, ReactNode, useState } from "react";
import { Link } from "wouter";
import { ChevronRight, Home } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import QuoteRequestForm from "@/components/QuoteRequestForm";
import { motion } from "framer-motion";
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

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.4,
        ease: "easeOut",
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
  };

  const heroVariants = {
    hidden: { opacity: 0, y: -30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut",
      },
    },
  };

  useEffect(() => {
    // Smooth scroll to top on page load
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [title]);

  return (
    <motion.div
      className="min-h-screen"
      style={{ backgroundColor: '#f5f5f7' }}
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Breadcrumbs with Glassmorphism */}
      <motion.nav
        className="backdrop-blur-md bg-white/70 border-b border-white/20 py-3 px-4 sm:px-6 lg:px-8 sticky top-16 z-40"
        data-testid="breadcrumbs"
        variants={itemVariants}
      >
        <div className="max-w-7xl mx-auto">
          <ol className="flex items-center space-x-2 text-sm">
            <li>
              <Link href="/" className="flex items-center text-gray-500 hover:text-[#0B9F47] transition-colors duration-300" data-testid="breadcrumb-home">
                <Home className="h-4 w-4" />
              </Link>
            </li>
            <li className="flex items-center">
              <ChevronRight className="h-4 w-4 text-gray-400 mx-2" />
              <Link href="/" className="text-gray-500 hover:text-[#0B9F47] transition-colors duration-300" data-testid="breadcrumb-tools">
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
      </motion.nav>

      {/* Hero Section */}
      <motion.section
        className="bg-gradient-to-r from-[#06183C] to-[#20448B] text-white py-12 px-4 sm:px-6 lg:px-8"
        variants={heroVariants}
      >
        <div className="max-w-4xl mx-auto text-center">
          <motion.h1
            className="text-3xl md:text-4xl font-bold mb-4"
            data-testid="tool-title"
            variants={itemVariants}
          >
            {title}
          </motion.h1>
          <motion.p
            className="text-lg text-gray-200 max-w-2xl mx-auto"
            data-testid="tool-description"
            variants={itemVariants}
          >
            {description}
          </motion.p>
        </div>
      </motion.section>

      {/* Main Content */}
      <motion.main
        className="py-8 px-4 sm:px-6 lg:px-8"
        variants={itemVariants}
      >
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          >
            {children}
          </motion.div>
        </div>
      </motion.main>

      {/* Footer CTA with Glassmorphism */}
      <motion.section
        className="relative mt-12 py-12 px-4 sm:px-6 lg:px-8 overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
      >
        {/* Background with Gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#06183C] to-[#20448B]" />
        
        {/* Glassmorphism Overlay */}
        <div className="absolute inset-0 backdrop-blur-sm bg-white/5" />
        
        {/* Content */}
        <div className="relative max-w-4xl mx-auto text-center">
          <motion.div
            className="backdrop-blur-lg bg-white/10 border border-white/20 rounded-2xl p-8 shadow-2xl"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5, ease: "easeOut" }}
          >
            <h2 className="text-2xl md:text-3xl font-bold mb-4 text-white">
              Need Professional Vector Conversion?
            </h2>
            <p className="text-gray-200 mb-6 text-lg">
              Our expert team can handle complex vectorization projects with precision and quality.
            </p>
            <motion.button
              onClick={() => setQuoteDialogOpen(true)}
              className="inline-flex items-center px-8 py-3 rounded-full bg-[#0B9F47] hover:bg-[#0B9F47]/90 text-white font-medium transition-all duration-300 shadow-lg hover:shadow-xl backdrop-blur-sm"
              data-testid="cta-button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.2 }}
            >
              Request a Quote
            </motion.button>
          </motion.div>
        </div>
      </motion.section>

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
    </motion.div>
  );
}
