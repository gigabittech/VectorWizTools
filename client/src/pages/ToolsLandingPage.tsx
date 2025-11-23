import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Image as ImageIcon, FileText, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

interface Tool {
  name: string;
  description: string;
  category: "Image Tools" | "PDF Tools";
  route?: string;
  icon: string;
  comingSoon?: boolean;
}

const imageTools: Tool[] = [
  { name: "AI Image Generator", description: "Create AI generated images", category: "Image Tools", route: "/tools/ai-image-generator", icon: "🎨" },
  { name: "Remove Background", description: "Remove background from an image", category: "Image Tools", route: "/tools/remove-background", icon: "🖼️" },
  { name: "Upscale Image", description: "Increase image resolution and quality", category: "Image Tools", route: "/tools/image-upscale", icon: "⬆️" },
  { name: "Remove Watermark", description: "Remove watermarks from photos", category: "Image Tools", route: "/tools/remove-watermark", icon: "💧" },
  { name: "Image To Text", description: "Extract text from images (OCR)", category: "Image Tools", route: "/tools/image-to-text", icon: "📝" },
  { name: "Compress Image Size", description: "Reduce image file size", category: "Image Tools", route: "/tools/image-compressor", icon: "🗜️" },
  { name: "Resize Image Dimensions", description: "Change image width and height", category: "Image Tools", route: "/tools/image-resizer", icon: "📐" },
  { name: "Remove Objects From Photo", description: "Erase unwanted objects", category: "Image Tools", route: "/tools/remove-objects", icon: "✂️" },
  { name: "Profile Photo Maker", description: "Create professional profile photos", category: "Image Tools", route: "/tools/profile-photo-maker", icon: "👤" },
  { name: "PNG to JPG", description: "Convert PNG images to JPG format", category: "Image Tools", route: "/tools/format-converter", icon: "🔄" },
  { name: "Blur Background Tool", description: "Blur image backgrounds", category: "Image Tools", route: "/tools/blur-background", icon: "🌫️" },
  { name: "Image Filter & Effects", description: "Apply filters like grayscale, sepia, brightness", category: "Image Tools", route: "/tools/image-filter", icon: "✨" },
  { name: "WebP to JPG", description: "Convert WebP images to JPG", category: "Image Tools", route: "/tools/format-converter", icon: "🔄" },
  { name: "Colorize Photo", description: "Add color to black & white photos", category: "Image Tools", route: "/tools/colorize-photo", icon: "🎨" },
  { name: "Combine Images", description: "Merge multiple images together", category: "Image Tools", route: "/tools/combine-images", icon: "➕" },
  { name: "Make Background Transparent", description: "Create transparent backgrounds", category: "Image Tools", route: "/tools/make-background-transparent", icon: "⬜" },
  { name: "Crop Image", description: "Trim and crop images", category: "Image Tools", route: "/tools/image-cropper", icon: "✂️" },
  { name: "JPG to PNG", description: "Convert JPG images to PNG format", category: "Image Tools", route: "/tools/format-converter", icon: "🔄" },
  { name: "File to SVG", description: "Convert files to SVG vector format", category: "Image Tools", route: "/tools/file-to-svg", icon: "📊" },
  { name: "Add Text to Image", description: "Add text overlays and captions to images", category: "Image Tools", route: "/tools/add-text-to-image", icon: "📝" },
  { name: "Translate Image", description: "Translate text within images", category: "Image Tools", route: "/tools/translate-image", icon: "🌐" },
  { name: "Postable Image", description: "Create social media ready images", category: "Image Tools", route: "/tools/postable-image", icon: "📱" },
  { name: "Collage Maker", description: "Create photo collages online", category: "Image Tools", route: "/tools/collage-maker", icon: "🖼️" },
  { name: "SVG to PNG", description: "Convert SVG files to PNG images", category: "Image Tools", route: "/tools/format-converter", icon: "🔄" },
  { name: "TIFF to JPG", description: "Convert TIFF files to JPG format", category: "Image Tools", route: "/tools/format-converter", icon: "🔄" },
  { name: "Rotate & Flip Image", description: "Rotate and flip images in any direction", category: "Image Tools", route: "/tools/image-rotator", icon: "🔁" },
  { name: "PNG to GIF", description: "Convert PNG images to GIF", category: "Image Tools", route: "/tools/format-converter", icon: "🔄" },
  { name: "PNG to PDF", description: "Convert PNG images to PDF", category: "Image Tools", route: "/tools/format-converter", icon: "🔄" },
  { name: "Chart Maker", description: "Create charts and graphs", category: "Image Tools", route: "/tools/chart-maker", icon: "📊" },
  { name: "EPS to JPG", description: "Convert EPS files to JPG images", category: "Image Tools", route: "/tools/format-converter", icon: "🔄" },
  { name: "BMP to JPG", description: "Convert BMP images to JPG", category: "Image Tools", route: "/tools/format-converter", icon: "🔄" },
  { name: "PNG to BMP", description: "Convert PNG to BMP format", category: "Image Tools", route: "/tools/format-converter", icon: "🔄" },
  { name: "HEIC to JPG", description: "Convert HEIC to JPG format", category: "Image Tools", route: "/tools/format-converter", icon: "🔄" },
  { name: "VSD to JPG", description: "Convert Visio diagrams to JPG", category: "Image Tools", route: "/tools/format-converter", icon: "🔄" },
  { name: "PNG to SVG", description: "Convert PNG to SVG vector", category: "Image Tools", route: "/tools/format-converter", icon: "🔄" },
  { name: "JPG to SVG", description: "Convert JPG to SVG vector", category: "Image Tools", route: "/tools/format-converter", icon: "🔄" },
  { name: "PDF to SVG", description: "Convert PDF to SVG vector", category: "Image Tools", route: "/tools/format-converter", icon: "🔄" },
  { name: "VSDX to JPG", description: "Convert VSDX to JPG format", category: "Image Tools", route: "/tools/format-converter", icon: "🔄" },
  { name: "VSDX to PDF", description: "Convert VSDX diagrams to PDF", category: "Image Tools", route: "/tools/format-converter", icon: "🔄" },
  { name: "GIF to JPG", description: "Convert GIF images to JPG", category: "Image Tools", route: "/tools/format-converter", icon: "🔄" },
  { name: "Add Watermark to Image", description: "Add text or logo watermarks to protect your images", category: "Image Tools", route: "/tools/image-watermark", icon: "💧" },
  { name: "Add Border to Image", description: "Add frames and borders to your images", category: "Image Tools", route: "/tools/image-border", icon: "🖼️" },
  { name: "Color Palette Extractor", description: "Extract dominant colors from any image", category: "Image Tools", route: "/tools/color-palette-extractor", icon: "🎨" },
  { name: "Image to Base64", description: "Convert images to Base64 encoded strings", category: "Image Tools", route: "/tools/image-to-base64", icon: "🔤" },
  { name: "Compare Images", description: "Side-by-side image comparison tool", category: "Image Tools", route: "/tools/image-comparison", icon: "⚖️" },
  { name: "Make Round Image", description: "Create circular profile pictures and avatars", category: "Image Tools", route: "/tools/make-round-image", icon: "⭕" },
  { name: "Image Splitter", description: "Split images into pieces", category: "Image Tools", route: "/tools/image-splitter", icon: "✂️" },
  { name: "PNG to WEBP", description: "Convert PNG to WEBP format", category: "Image Tools", route: "/tools/format-converter", icon: "🔄" },
  { name: "JPG to WEBP", description: "Convert JPG to WEBP format", category: "Image Tools", route: "/tools/format-converter", icon: "🔄" },
  { name: "Vector Checker", description: "Check if files are vector or raster", category: "Image Tools", route: "/tools/vector-checker", icon: "🔍" },
  { name: "DPI Calculator", description: "Calculate image DPI and resolution", category: "Image Tools", route: "/tools/dpi-calculator", icon: "📊" },
  { name: "Image File Size Calculator", description: "Calculate image file sizes", category: "Image Tools", route: "/tools/file-size-calculator", icon: "📊" },
  { name: "Print Size Calculator", description: "Calculate print dimensions", category: "Image Tools", route: "/tools/print-size-calculator", icon: "🖨️" },
  { name: "Logo Dimensions Calculator", description: "Calculate optimal logo sizes", category: "Image Tools", route: "/tools/logo-dimensions", icon: "📏" },
  { name: "Vector Simplifier", description: "Simplify complex vector paths", category: "Image Tools", route: "/tools/vector-simplifier", icon: "✨" },
  { name: "Aspect Ratio Calculator", description: "Calculate image aspect ratios", category: "Image Tools", route: "/tools/aspect-ratio-calculator", icon: "📐" },
  { name: "Font to Vector", description: "Convert fonts to vector outlines", category: "Image Tools", route: "/tools/font-to-vector", icon: "🔤" },
];

const pdfTools: Tool[] = [
  { name: "Merge PDF", description: "Merge 2 or more PDF files into a single PDF file", category: "PDF Tools", route: "/tools/merge-pdf", icon: "🔗" },
  { name: "Edit PDF", description: "Free PDF Editor", category: "PDF Tools", route: "/tools/edit-pdf", icon: "✏️" },
  { name: "PDF to JPG", description: "Convert each PDF page to high‑quality JPG in your browser", category: "PDF Tools", route: "/tools/pdf-to-jpg", icon: "🖼️" },
  { name: "JPG to PDF", description: "Convert JPG images and receive as a PDF", category: "PDF Tools", route: "/tools/jpg-to-pdf", icon: "📄" },
  { name: "Compress PDF", description: "Lessen the file size of a PDF file", category: "PDF Tools", route: "/tools/compress-pdf", icon: "🗜️" },
  { name: "Split PDF", description: "Split into one or multiple PDF files", category: "PDF Tools", route: "/tools/split-pdf", icon: "✂️" },
  { name: "PDF to Word", description: "Convert PDF to Word Document", category: "PDF Tools", route: "/tools/pdf-to-word", icon: "📝" },
  { name: "Change Background", description: "Change Background of an image", category: "PDF Tools", route: "/tools/change-background", icon: "🎨" },
  { name: "Word to PDF", description: "Convert a Word Document to PDF", category: "PDF Tools", route: "/tools/word-to-pdf", icon: "📄" },
  { name: "Unlock PDF", description: "Remove the password from a PDF file while the password", category: "PDF Tools", route: "/tools/unlock-pdf", icon: "🔓" },
  { name: "PDF to Excel", description: "Convert PDF to XLSX", category: "PDF Tools", route: "/tools/pdf-to-excel", icon: "📊" },
  { name: "PDF to Powerpoint", description: "Upload a PDF and Download as a Powerpoint Presentation", category: "PDF Tools", route: "/tools/pdf-to-powerpoint", icon: "📽️" },
  { name: "PNG to PDF", description: "Upload images and receive as a PDF file", category: "PDF Tools", route: "/tools/png-to-pdf", icon: "📄" },
  { name: "EPUB to PDF", description: "Convert EPUB to PDF file", category: "PDF Tools", route: "/tools/epub-to-pdf", icon: "📚" },
  { name: "Crop PDF", description: "Free PDF Cropper", category: "PDF Tools", route: "/tools/crop-pdf", icon: "✂️" },
  { name: "PDF Translator", description: "Translate your pdf", category: "PDF Tools", route: "/tools/pdf-translator", icon: "🌐" },
  { name: "Powerpoint to PDF", description: "Upload a PowerPoint presentation on Download as a PDF file", category: "PDF Tools", route: "/tools/powerpoint-to-pdf", icon: "📄" },
  { name: "PDF to EPUB", description: "Convert PDF file to EPUB file", category: "PDF Tools", route: "/tools/pdf-to-epub", icon: "📚" },
  { name: "PDF to PNG", description: "Convert from PDF to PNG and download each page as an image", category: "PDF Tools", route: "/tools/pdf-to-png", icon: "🖼️" },
  { name: "PDF Page Deleter", description: "Delete page(s) from a PDF", category: "PDF Tools", route: "/tools/delete-pdf-pages", icon: "🗑️" },
  { name: "URL to PDF", description: "Enter a URL and receive the PC or mobile web page as a PDF", category: "PDF Tools", route: "/tools/url-to-pdf", icon: "🌐" },
  { name: "Rotate PDF", description: "Rotate one or more pages in a PDF file", category: "PDF Tools", route: "/tools/rotate-pdf", icon: "🔄" },
  { name: "Rearrange PDF", description: "Rearrange the pages of a PDF file", category: "PDF Tools", route: "/tools/rearrange-pdf", icon: "📑" },
  { name: "Extract Images PDF", description: "Extract images from a PDF file", category: "PDF Tools", route: "/tools/extract-images-pdf", icon: "🖼️" },
  { name: "eSign PDF", description: "E-sign a PDF with a box or with your signature", category: "PDF Tools", route: "/tools/esign-pdf", icon: "✍️" },
  { name: "Create PDF", description: "Free PDF Creator", category: "PDF Tools", route: "/tools/create-pdf", icon: "➕" },
  { name: "PDF Watermark Remover", description: "Remove Watermark from PDF", category: "PDF Tools", route: "/tools/pdf-watermark-remover", icon: "💧" },
  { name: "Protect PDF", description: "Add a password to a PDF file", category: "PDF Tools", route: "/tools/protect-pdf", icon: "🔒" },
  { name: "PDF to CSV", description: "Convert from PDF to CSV", category: "PDF Tools", route: "/tools/pdf-to-csv", icon: "📊" },
  { name: "Add Numbers to PDF", description: "Add page numbers to a PDF file", category: "PDF Tools", route: "/tools/add-page-numbers-pdf", icon: "🔢" },
  { name: "Add Watermark", description: "Stamp an image over your PDF", category: "PDF Tools", route: "/tools/add-watermark-pdf", icon: "💧" },
  { name: "IMAGES to PDF", description: "Convert from JPG online", category: "PDF Tools", route: "/tools/images-to-pdf", icon: "🖼️" },
  { name: "HEIC to PDF", description: "Upload images and receive as a PDF file", category: "PDF Tools", route: "/tools/heic-to-pdf", icon: "📄" },
  { name: "Add Text", description: "Add Text to PDF", category: "PDF Tools", route: "/tools/add-text-pdf", icon: "📝" },
  { name: "Annotate PDF", description: "Free PDF Annotate", category: "PDF Tools", route: "/tools/annotate-pdf", icon: "✏️" },
  { name: "TIFF to PDF", description: "Upload images and receive as a PDF file", category: "PDF Tools", route: "/tools/tiff-to-pdf", icon: "📄" },
  { name: "MOBI to PDF", description: "Convert MOBI file to PDF file", category: "PDF Tools", route: "/tools/mobi-to-pdf", icon: "📚" },
  { name: "PDF to MOBI", description: "Convert PDF to MOBI file", category: "PDF Tools", route: "/tools/pdf-to-mobi", icon: "📚" },
  { name: "PDF to TIFF", description: "Convert PDF to TIFF and download each page as an image", category: "PDF Tools", route: "/tools/pdf-to-tiff", icon: "🖼️" },
  { name: "AZW3 to PDF", description: "Convert AZW3 file to PDF file", category: "PDF Tools", route: "/tools/azw3-to-pdf", icon: "📚" },
  { name: "WEBP to PDF", description: "Upload images and receive as a PDF file", category: "PDF Tools", route: "/tools/webp-to-pdf", icon: "📄" },
  { name: "PDF to AZW3", description: "Convert PDF file to AZW3 file", category: "PDF Tools", route: "/tools/pdf-to-azw3", icon: "📚" },
  { name: "MS Outlook to PDF", description: "Upload a file Outlook file Download as a PDF", category: "PDF Tools", route: "/tools/ms-outlook-to-pdf", icon: "📧" },
  { name: "PDF to Text", description: "Convert a PDF to Text", category: "PDF Tools", route: "/tools/pdf-to-text", icon: "📝" },
  { name: "GIF to PDF", description: "Upload images and receive as a PDF file", category: "PDF Tools", route: "/tools/gif-to-pdf", icon: "📄" },
  { name: "Extract text from PDF", description: "Extract text from PDF document", category: "PDF Tools", route: "/tools/extract-text-pdf", icon: "📝" },
  { name: "EPS to PDF", description: "Upload images and receive as a PDF file", category: "PDF Tools", route: "/tools/eps-to-pdf", icon: "📄" },
];

export default function ToolsLandingPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<"all" | "Image Tools" | "PDF Tools">("all");

  useEffect(() => {
    document.title = "Free Online Image & PDF Tools - VectorWiz";
    
    const metaDescription = document.querySelector('meta[name="description"]') || document.createElement('meta');
    metaDescription.setAttribute('name', 'description');
    metaDescription.setAttribute('content', 'Professional free online tools for image conversion, PDF editing, and file management. Convert formats, resize images, compress files, and more with VectorWiz tools.');
    if (!document.querySelector('meta[name="description"]')) {
      document.head.appendChild(metaDescription);
    }

    const ogTitle = document.querySelector('meta[property="og:title"]') || document.createElement('meta');
    ogTitle.setAttribute('property', 'og:title');
    ogTitle.setAttribute('content', 'Free Online Image & PDF Tools - VectorWiz');
    if (!document.querySelector('meta[property="og:title"]')) {
      document.head.appendChild(ogTitle);
    }

    const ogDescription = document.querySelector('meta[property="og:description"]') || document.createElement('meta');
    ogDescription.setAttribute('property', 'og:description');
    ogDescription.setAttribute('content', 'Professional free online tools for image conversion, PDF editing, and file management. Convert formats, resize images, compress files, and more.');
    if (!document.querySelector('meta[property="og:description"]')) {
      document.head.appendChild(ogDescription);
    }

    const ogType = document.querySelector('meta[property="og:type"]') || document.createElement('meta');
    ogType.setAttribute('property', 'og:type');
    ogType.setAttribute('content', 'website');
    if (!document.querySelector('meta[property="og:type"]')) {
      document.head.appendChild(ogType);
    }

    const ogUrl = document.querySelector('meta[property="og:url"]') || document.createElement('meta');
    ogUrl.setAttribute('property', 'og:url');
    ogUrl.setAttribute('content', window.location.href);
    if (!document.querySelector('meta[property="og:url"]')) {
      document.head.appendChild(ogUrl);
    }

    const keywords = document.querySelector('meta[name="keywords"]') || document.createElement('meta');
    keywords.setAttribute('name', 'keywords');
    keywords.setAttribute('content', 'image converter, PDF tools, format converter, image resizer, file compression, vector tools, online image tools, free PDF editor');
    if (!document.querySelector('meta[name="keywords"]')) {
      document.head.appendChild(keywords);
    }
  }, []);

  const allTools = [...imageTools, ...pdfTools];

  const filteredTools = allTools.filter((tool) => {
    const matchesSearch = tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === "all" || tool.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const imageToolsFiltered = filteredTools.filter(t => t.category === "Image Tools");
  const pdfToolsFiltered = filteredTools.filter(t => t.category === "PDF Tools");

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

  useEffect(() => {
    // Smooth scroll to top on page load
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

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
                Image Tools ({imageTools.length})
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
                PDF Tools ({pdfTools.length})
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
