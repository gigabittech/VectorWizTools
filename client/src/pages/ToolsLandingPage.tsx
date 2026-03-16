import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Image as ImageIcon, FileText, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Tool as DbTool, SeoSettings } from "@shared/schema";
import { Loader } from "@mantine/core";
import { setPageMetadata } from "@/lib/seoHelpers";

interface Tool {
  name: string;
  description: string;
  category: "Image Tools" | "PDF Tools";
  route?: string;
  icon: string;
  comingSoon?: boolean;
}

const toolIcons: Record<string, string> = {
  "ai-image-generator": "🎨",
  "remove-background": "🖼️",
  "image-upscale": "⬆️",
  "remove-watermark": "💧",
  "image-to-text": "📝",
  "image-compressor": "🗜️",
  "image-resizer": "📐",
  "remove-objects": "✂️",
  "profile-photo-maker": "👤",
  "png-to-jpg": "🔄",
  "format-converter": "🔄",
  "blur-background": "🌫️",
  "image-filter": "✨",
  "webp-to-jpg": "🔄",
  "colorize-photo": "🎨",
  "combine-images": "➕",
  "make-background-transparent": "⬜",
  "image-cropper": "✂️",
  "jpg-to-png": "🔄",
  "file-to-svg": "📊",
  "add-text-to-image": "📝",
  "translate-image": "🌐",
  "postable-image": "📱",
  "collage-maker": "🖼️",
  "svg-to-png": "🔄",
  "tiff-to-jpg": "🔄",
  "image-rotator": "🔁",
  "png-to-gif": "🔄",
  "png-to-pdf": "🔄",
  "chart-maker": "📊",
  "eps-to-jpg": "🔄",
  "bmp-to-jpg": "🔄",
  "png-to-bmp": "🔄",
  "heic-to-jpg": "🔄",
  "vsd-to-jpg": "🔄",
  "png-to-svg": "🔄",
  "jpg-to-svg": "🔄",
  "pdf-to-svg": "🔄",
  "jpg-to-vsdx": "🔄",
  "image-watermark": "💧",
  "image-border": "🖼️",
  "color-palette-extractor": "🎨",
  "image-to-base64": "🔤",
  "image-comparison": "⚖️",
  "make-round-image": "⭕",
  "image-splitter": "✂️",
  "png-to-webp": "🔄",
  "jpg-to-webp": "🔄",
  "vector-checker": "🔍",
  "dpi-calculator": "📊",
  "file-size-calculator": "📊",
  "print-size-calculator": "🖨️",
  "logo-dimensions": "📏",
  "vector-simplifier": "✨",
  "aspect-ratio-calculator": "📐",
  "font-to-vector": "🔤",
  "merge-pdf": "🔗",
  "edit-pdf": "✏️",
  "pdf-to-jpg": "🖼️",
  "jpg-to-pdf": "📄",
  "compress-pdf": "🗜️",
  "split-pdf": "✂️",
  "pdf-to-word": "📝",
  "change-background": "🎨",
  "word-to-pdf": "📄",
  "unlock-pdf": "🔓",
  "pdf-to-excel": "📊",
  "pdf-to-powerpoint": "📽️",
  "epub-to-pdf": "📚",
  "crop-pdf": "✂️",
  "pdf-translator": "🌐",
  "powerpoint-to-pdf": "📄",
  "pdf-to-epub": "📚",
  "pdf-to-png": "🖼️",
  "delete-pdf-pages": "🗑️",
  "url-to-pdf": "🌐",
  "rotate-pdf": "🔄",
  "rearrange-pdf": "📑",
  "extract-images-pdf": "🖼️",
  "esign-pdf": "✍️",
  "create-pdf": "➕",
  "pdf-watermark-remover": "💧",
  "protect-pdf": "🔒",
  "pdf-to-csv": "📊",
  "add-page-numbers-pdf": "🔢",
  "add-watermark-pdf": "💧",
  "images-to-pdf": "🖼️",
  "heic-to-pdf": "📄",
  "add-text-pdf": "📝",
  "annotate-pdf": "✏️",
  "tiff-to-pdf": "📄",
  "mobi-to-pdf": "📚",
  "pdf-to-mobi": "📚",
  "pdf-to-tiff": "🖼️",
  "azw3-to-pdf": "📚",
  "webp-to-pdf": "📄",
  "pdf-to-azw3": "📚",
  "ms-outlook-to-pdf": "📧",
  "pdf-to-text": "📝",
  "gif-to-pdf": "📄",
  "extract-text-pdf": "📝",
  "eps-to-pdf": "📄",
};

// Data is now fetched from the database
export default function ToolsLandingPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<"all" | "Image Tools" | "PDF Tools">("all");

  const { data: dbTools, isLoading } = useQuery<DbTool[]>({
    queryKey: ["/api/tools?onlyActive=true"],
  });

  const { data: seoSettings } = useQuery<SeoSettings>({
    queryKey: ["/api/seo-settings"],
  });

  useEffect(() => {
    // Set page metadata dynamically from database or fallback to defaults
    setPageMetadata({
      title: seoSettings?.defaultMetaTitle || "Free Online Image & PDF Tools - VectorWiz",
      description: seoSettings?.defaultMetaDescription || "Professional free online tools for image conversion, PDF editing, and file management. Convert formats, resize images, compress files, and more with VectorWiz tools.",
      keywords: ['image converter', 'PDF tools', 'format converter', 'image resizer', 'file compression', 'vector tools', 'online image tools', 'free PDF editor'],
      ogTitle: seoSettings?.defaultMetaTitle || "Free Online Image & PDF Tools - VectorWiz",
      ogDescription: seoSettings?.defaultMetaDescription || "Professional free online tools for image conversion, PDF editing, and file management.",
      ogType: 'website',
      ogUrl: window.location.href,
      ogImage: seoSettings?.defaultOgImage || undefined
    });
  }, [seoSettings]);

  const allTools: Tool[] = (dbTools || []).map(t => ({
    name: t.name,
    description: t.description || "",
    category: t.category as "Image Tools" | "PDF Tools",
    route: `/${t.slug || t.tool_id}`,
    icon: (t.slug && toolIcons[t.slug]) || toolIcons[t.tool_id] || "🛠️",
    comingSoon: t.status === "coming-soon"
  }));

  const filteredTools = allTools.filter((tool) => {
    const matchesSearch = tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === "all" || tool.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  useEffect(() => {
    // Smooth scroll to top on page load
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader color="green" size="xl" />
      </div>
    );
  }

  const imageToolsFiltered = filteredTools.filter(t => t.category === "Image Tools");
  const pdfToolsFiltered = filteredTools.filter(t => t.category === "PDF Tools");
  const imageToolsTotal = allTools.filter(t => t.category === "Image Tools").length;
  const pdfToolsTotal = allTools.filter(t => t.category === "PDF Tools").length;

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut",
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
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

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-b from-gray-50 to-white"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Hero Section */}
      <motion.section
        className="py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-[#06183C] to-[#20448B] text-white"
        variants={heroVariants}
      >
        <div className="max-w-7xl mx-auto text-center">
          <motion.h1
            className="text-4xl md:text-5xl font-bold mb-4"
            data-testid="page-title"
            variants={itemVariants}
          >
            Free Online Tools
          </motion.h1>
          <motion.p
            className="text-xl text-gray-200"
            data-testid="page-subtitle"
            variants={itemVariants}
          >
            Professional image and PDF tools for all your conversion and editing needs
          </motion.p>
        </div>
      </motion.section>

      {/* Tools Section */}
      <motion.section
        className="py-12 px-4 sm:px-6 lg:px-8"
        style={{ backgroundColor: '#f5f5f7' }}
        variants={itemVariants}
      >
        <div className="max-w-7xl mx-auto">
          {/* Glassmorphism Filter Buttons */}
          <motion.div
            className="flex items-center justify-center mb-8"
            variants={itemVariants}
          >
            <div className="inline-flex items-center gap-2 p-1.5 rounded-full backdrop-blur-md bg-white/60 border border-white/40 shadow-lg" data-testid="category-filters">
              <button
                onClick={() => setActiveCategory("all")}
                className={`
                  flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-200
                  ${activeCategory === "all"
                    ? "bg-[#0B9F47] text-white shadow-md"
                    : "text-gray-700 hover:bg-white/40"
                  }
                `}
                data-testid="filter-all"
              >
                All Tools ({allTools.length})
              </button>
              <button
                onClick={() => setActiveCategory("Image Tools")}
                className={`
                  flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-200
                  ${activeCategory === "Image Tools"
                    ? "bg-[#0B9F47] text-white shadow-md"
                    : "text-gray-700 hover:bg-white/40"
                  }
                `}
                data-testid="filter-image"
              >
                <ImageIcon className="h-4 w-4" />
                Image Tools ({imageToolsTotal})
              </button>
              <button
                onClick={() => setActiveCategory("PDF Tools")}
                className={`
                  flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-200
                  ${activeCategory === "PDF Tools"
                    ? "bg-[#0B9F47] text-white shadow-md"
                    : "text-gray-700 hover:bg-white/40"
                  }
                `}
                data-testid="filter-pdf"
              >
                <FileText className="h-4 w-4" />
                PDF Tools ({pdfToolsTotal})
              </button>
            </div>
          </motion.div>

          {/* Tools Grid */}
          <motion.div
            className="space-y-12"
            variants={containerVariants}
          >
            {activeCategory === "all" && (
              <>
                {/* Image Tools Section */}
                {imageToolsFiltered.length > 0 && (
                  <motion.div variants={itemVariants}>
                    <motion.h2
                      className="text-3xl font-bold mb-6 flex items-center"
                      data-testid="section-image-tools"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                    >
                      <ImageIcon className="h-8 w-8 mr-3 text-[#0B9F47]" />
                      Image Tools
                    </motion.h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {imageToolsFiltered.map((tool, index) => (
                        <motion.div
                          key={index}
                          variants={itemVariants}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.3, delay: index * 0.03 }}
                        >
                          <ToolCard tool={tool} />
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* PDF Tools Section */}
                {pdfToolsFiltered.length > 0 && (
                  <motion.div variants={itemVariants}>
                    <motion.h2
                      className="text-3xl font-bold mb-6 flex items-center"
                      data-testid="section-pdf-tools"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: 0.3 }}
                    >
                      <FileText className="h-8 w-8 mr-3 text-[#0B9F47]" />
                      PDF Tools
                    </motion.h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {pdfToolsFiltered.map((tool, index) => (
                        <motion.div
                          key={index}
                          variants={itemVariants}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.3, delay: index * 0.03 }}
                        >
                          <ToolCard tool={tool} />
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </>
            )}

            {activeCategory === "Image Tools" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {imageToolsFiltered.map((tool, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.03 }}
                  >
                    <ToolCard tool={tool} />
                  </motion.div>
                ))}
              </div>
            )}

            {activeCategory === "PDF Tools" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {pdfToolsFiltered.map((tool, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.03 }}
                  >
                    <ToolCard tool={tool} />
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>

          {filteredTools.length === 0 && (
            <motion.div
              className="text-center py-12"
              data-testid="no-results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
            >
              <p className="text-gray-500 text-lg">No tools found matching your search.</p>
            </motion.div>
          )}
        </div>
      </motion.section>
    </motion.div>
  );
}

function ToolCard({ tool }: { tool: Tool }) {
  const content = (
    <motion.div
      className="h-full backdrop-blur-md bg-white/70 border border-white/40 rounded-xl p-6 hover:shadow-lg hover:bg-white/80 transition-all duration-300 cursor-pointer group"
      data-testid={`tool-card-${tool.name.toLowerCase().replace(/\s+/g, '-')}`}
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      <div className="flex flex-col h-full">
        <div className="text-4xl mb-3">{tool.icon}</div>
        <h3 className="font-semibold text-lg mb-2 group-hover:text-[#0B9F47] transition-colors" data-testid="tool-name">
          {tool.name}
        </h3>
        <p className="text-sm text-gray-600 mb-4 flex-grow" data-testid="tool-description">
          {tool.description}
        </p>
        {tool.comingSoon ? (
          <span className="inline-flex items-center text-xs font-medium text-amber-700 backdrop-blur-md bg-amber-100/60 border border-amber-200/40 px-3 py-1.5 rounded-full self-start shadow-sm" data-testid="coming-soon-badge">
            Coming Soon
          </span>
        ) : (
          <div className="inline-flex items-center text-xs font-medium text-white backdrop-blur-md bg-[#0B9F47]/90 hover:bg-[#0B9F47] border border-[#0B9F47]/40 px-3 py-1.5 rounded-full shadow-sm transition-all group-hover:shadow-md self-start">
            Try Now
            <ArrowRight className="h-3.5 w-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
          </div>
        )}
      </div>
    </motion.div>
  );


  if (tool.route && !tool.comingSoon) {
    return <Link href={tool.route}>{content}</Link>;
  }

  return content;
}
