import { useEffect, ReactNode, useState, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { ChevronRight, Home, Loader } from "lucide-react";
import { Stack, Text } from "@mantine/core";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import QuoteRequestForm from "@/components/QuoteRequestForm";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import ToolContentSection from "./ToolContentSection";
import FAQSection from "./FAQSection";
import {
  setPageMetadata,
  injectJSONLD,
  generateSoftwareApplicationSchema,
  generateHowToSchema
} from "@/lib/seoHelpers";

interface ToolLayoutProps {
  title?: string;
  description?: string;
  children: ReactNode;
  category?: string;
  keywords?: string[];
  howToSteps?: Array<{
    name: string;
    text: string;
  }>;
  toolId?: string; // Optional: provide to fetch from CMS
  slug?: string;   // Optional: provide to fetch from CMS
}

export default function ToolLayout({
  title: initialTitle,
  description: initialDescription,
  children,
  category: initialCategory = "Image Tools",
  keywords: initialKeywords = [],
  howToSteps: initialHowToSteps,
  toolId,
  slug,
}: ToolLayoutProps) {
  const [quoteDialogOpen, setQuoteDialogOpen] = useState(false);
  const [location] = useLocation();

  // Auto-detect slug from URL if not provided
  // Paths are typically /tools/:slug
  const derivedSlug = useMemo(() => {
    if (slug) return slug;
    const match = location.match(/\/tools\/([^\/]+)$/);
    return match ? match[1] : null;
  }, [location, slug]);

  // Fetch CMS data if toolId or slug is provided
  const queryKey = toolId ? `/tools/api/tools/tool_id/${toolId}` : derivedSlug ? `/tools/api/tools/slug/${derivedSlug}` : null;
  const { data: cmsData, isLoading: isCmsLoading } = useQuery<any>({
    queryKey: [queryKey],
    enabled: !!queryKey,
  });

  // Fetch global SEO settings for fallback
  const { data: seoSettings, isLoading: isSeoSettingsLoading } = useQuery<any>({
    queryKey: ["/tools/api/seo-settings"],
  });

  const isLoading = isCmsLoading || isSeoSettingsLoading;
  console.log('cms Data', cmsData);

  // Use CMS data if available, otherwise fallback to props
  const toolName = cmsData?.name || initialTitle || "VectorWiz Tool";
  const toolTitle = cmsData?.title || initialTitle || toolName;
  const toolDescription = cmsData?.description || initialDescription || "";
  const toolCategory = cmsData?.category || initialCategory;
  const toolKeywords = cmsData?.seo?.metaKeywords?.split(',').map((k: string) => k.trim()) || initialKeywords;

  // Format how-to steps for schema if CMS provides them or they are passed as props
  const formattedSteps = cmsData?.howToSteps || initialHowToSteps || [];

  useEffect(() => {
    if (isLoading) return;

    // Priority Logic:
    // 1. Tool-specific SEO data from tool_seo table (cmsData.seo)
    // 2. Default SEO values from seo_settings table (seoSettings)
    // 3. Last fallback to tool-related fields or hardcoded values

    const seoTitle = cmsData?.seo?.metaTitle || seoSettings?.defaultMetaTitle || `${toolTitle} - Free Online Tool | VectorWiz`;
    const seoDescription = cmsData?.seo?.metaDescription || seoSettings?.defaultMetaDescription || toolDescription;
    const seoOgTitle = cmsData?.seo?.ogTitle || seoTitle;
    const seoOgDescription = cmsData?.seo?.ogDescription || seoDescription;
    const seoOgImage = cmsData?.seo?.ogImage || seoSettings?.defaultOgImage;
    const seoCanonical = cmsData?.seo?.canonicalUrl || window.location.href;
    const seoRobots = `${cmsData?.seo?.indexStatus || 'index'}, ${cmsData?.seo?.followStatus || 'follow'}`;

    // Set page metadata using helper function
    setPageMetadata({
      title: seoTitle,
      description: seoDescription,
      keywords: [toolName.toLowerCase(), toolCategory.toLowerCase(), ...toolKeywords],
      ogTitle: seoOgTitle,
      ogDescription: seoOgDescription,
      ogType: 'website',
      ogUrl: window.location.href,
      ogImage: seoOgImage || undefined,
      canonicalUrl: seoCanonical,
      robots: seoRobots
    });

    // Generate JSON-LD schemas
    const schemas = [];

    // Add SoftwareApplication schema
    schemas.push(generateSoftwareApplicationSchema({
      name: toolName,
      description: seoDescription,
      applicationCategory: "UtilityApplication",
      operatingSystem: "Any",
      price: "0",
      priceCurrency: "USD"
    }));

    // Add HowTo schema if steps provided
    if (formattedSteps.length > 0) {
      schemas.push(generateHowToSchema({
        name: `How to use ${toolName}`,
        description: seoDescription,
        steps: typeof formattedSteps[0] === 'string'
          ? formattedSteps.map((s: string, i: number) => ({ name: `Step ${i + 1}`, text: s }))
          : formattedSteps
      }));
    }

    // Add generic schema based on schemaType if provided
    if (cmsData?.seo?.schemaType) {
      try {
        // If it's valid JSON, use it, otherwise create a simple WebPage schema
        const customSchema = JSON.parse(cmsData.seo.schemaType);
        schemas.push(customSchema);
      } catch (e) {
        // fallback to a simple WebPage schema with specified type
        schemas.push({
          "@context": "https://schema.org",
          "@type": cmsData.seo.schemaType,
          "name": toolTitle,
          "description": toolDescription
        });
      }
    }

    // Inject schemas and get cleanup function
    const cleanupSchema = injectJSONLD(schemas);

    // Return cleanup function
    return cleanupSchema;
  }, [toolName, toolTitle, toolDescription, toolCategory, toolKeywords, formattedSteps, isLoading, cmsData, seoSettings]);

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
  }, [toolTitle]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Stack align="center" gap="md">
          <Loader size="lg" color="green" />
          <Text c="dimmed" size="sm" fw={500}>Loading Tool CMS Data...</Text>
        </Stack>
      </div>
    );
  }

  if (cmsData && cmsData.is_active === 'in_active') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-center px-4">
        <Text size="xl" fw={700} c="red" mb="sm">This tool is currently unavailable</Text>
        <Text c="dimmed" mb="lg">The tool you are looking for has been temporarily disabled or moved.</Text>
        <Link href="/">
          <span className="text-[#0B9F47] hover:underline cursor-pointer font-medium">Return to Home</span>
        </Link>
      </div>
    );
  }

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
              <Link href="/tools" className="flex items-center text-gray-500 hover:text-[#0B9F47] transition-colors duration-300" data-testid="breadcrumb-home">
                <Home className="h-4 w-4" />
              </Link>
            </li>
            <li className="flex items-center">
              <ChevronRight className="h-4 w-4 text-gray-400 mx-2" />
              <Link href="/tools" className="text-gray-500 hover:text-[#0B9F47] transition-colors duration-300" data-testid="breadcrumb-tools">
                Tools
              </Link>
            </li>
            <li className="flex items-center">
              <ChevronRight className="h-4 w-4 text-gray-400 mx-2" />
              <span className="text-gray-900 font-medium" data-testid="breadcrumb-current">
                {toolTitle}
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
            {toolTitle || ''}
          </motion.h1>
          <motion.p
            className="text-lg text-gray-200 max-w-2xl mx-auto"
            data-testid="tool-description"
            variants={itemVariants}
          >
            {toolDescription || ''}
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

      {/* CMS Content Section */}
      {cmsData?.contents && (
        <ToolContentSection contents={cmsData.contents} />
      )}

      {/* FAQ Section */}
      {cmsData?.faqs && cmsData.faqs.length > 0 && (
        <FAQSection faqs={cmsData.faqs} />
      )}

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
