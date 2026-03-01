import { storage } from "../data/storage";
import { hashPassword } from "../utils/auth";

const imageTools = [
    { name: "AI Image Generator", description: "Create AI generated images", category: "Image Tools", route: "/tools/ai-image-generator", icon: "🎨" },
    { name: "Remove Background", description: "Remove background from an image", category: "Image Tools", route: "/tools/remove-background", icon: "🖼️" },
    { name: "Upscale Image", description: "Increase image resolution and quality", category: "Image Tools", route: "/tools/image-upscale", icon: "⬆️" },
    { name: "Remove Watermark", description: "Remove watermarks from photos", category: "Image Tools", route: "/tools/remove-watermark", icon: "💧" },
    { name: "Image To Text", description: "Extract text from images (OCR)", category: "Image Tools", route: "/tools/image-to-text", icon: "📝" },
    { name: "Compress Image Size", description: "Reduce image file size", category: "Image Tools", route: "/tools/image-compressor", icon: "🗜️" },
    { name: "Resize Image Dimensions", description: "Change image width and height", category: "Image Tools", route: "/tools/image-resizer", icon: "📐" },
    { name: "Remove Objects From Photo", description: "Erase unwanted objects", category: "Image Tools", route: "/tools/remove-objects", icon: "✂️" },
    { name: "Profile Photo Maker", description: "Create professional profile photos", category: "Image Tools", route: "/tools/profile-photo-maker", icon: "👤" },
    { name: "PNG to JPG", description: "Convert PNG images to JPG format", category: "Image Tools", route: "/tools/png-to-jpg", icon: "🔄" },
    { name: "Format Converter", description: "Convert images to different formats", category: "Image Tools", route: "/tools/format-converter", icon: "🔄" },
    { name: "Blur Background Tool", description: "Blur image backgrounds", category: "Image Tools", route: "/tools/blur-background", icon: "🌫️" },
    { name: "Image Filter & Effects", description: "Apply filters like grayscale, sepia, brightness", category: "Image Tools", route: "/tools/image-filter", icon: "✨" },
    { name: "WebP to JPG", description: "Convert WebP images to JPG", category: "Image Tools", route: "/tools/webp-to-jpg", icon: "🔄" },
    { name: "Colorize Photo", description: "Add color to black & white photos", category: "Image Tools", route: "/tools/colorize-photo", icon: "🎨" },
    { name: "Combine Images", description: "Merge multiple images together", category: "Image Tools", route: "/tools/combine-images", icon: "➕" },
    { name: "Make Background Transparent", description: "Create transparent backgrounds", category: "Image Tools", route: "/tools/make-background-transparent", icon: "⬜" },
    { name: "Crop Image", description: "Trim and crop images", category: "Image Tools", route: "/tools/image-cropper", icon: "✂️" },
    { name: "JPG to PNG", description: "Convert JPG images to PNG format", category: "Image Tools", route: "/tools/jpg-to-png", icon: "🔄" },
    { name: "File to SVG", description: "Convert files to SVG vector format", category: "Image Tools", route: "/tools/file-to-svg", icon: "📊" },
    { name: "Add Text to Image", description: "Add text overlays and captions to images", category: "Image Tools", route: "/tools/add-text-to-image", icon: "📝" },
    { name: "Translate Image", description: "Translate text within images", category: "Image Tools", route: "/tools/translate-image", icon: "🌐" },
    { name: "Postable Image", description: "Create social media ready images", category: "Image Tools", route: "/tools/postable-image", icon: "📱" },
    { name: "Collage Maker", description: "Create photo collages online", category: "Image Tools", route: "/tools/collage-maker", icon: "🖼️" },
    { name: "SVG to PNG", description: "Convert SVG files to PNG images", category: "Image Tools", route: "/tools/svg-to-png", icon: "🔄" },
    { name: "TIFF to JPG", description: "Convert TIFF files to JPG format", category: "Image Tools", route: "/tools/tiff-to-jpg", icon: "🔄" },
    { name: "Rotate & Flip Image", description: "Rotate and flip images in any direction", category: "Image Tools", route: "/tools/image-rotator", icon: "🔁" },
    { name: "PNG to GIF", description: "Convert PNG images to GIF", category: "Image Tools", route: "/tools/png-to-gif", icon: "🔄" },
    { name: "PNG to PDF", description: "Convert PNG images to PDF", category: "Image Tools", route: "/tools/png-to-pdf", icon: "🔄" },
    { name: "Chart Maker", description: "Create charts and graphs", category: "Image Tools", route: "/tools/chart-maker", icon: "📊" },
    { name: "EPS to JPG", description: "Convert EPS files to JPG images", category: "Image Tools", route: "/tools/eps-to-jpg", icon: "🔄" },
    { name: "BMP to JPG", description: "Convert BMP images to JPG", category: "Image Tools", route: "/tools/bmp-to-jpg", icon: "🔄" },
    { name: "PNG to BMP", description: "Convert PNG to BMP format", category: "Image Tools", route: "/tools/png-to-bmp", icon: "🔄" },
    { name: "HEIC to JPG", description: "Convert HEIC to JPG format", category: "Image Tools", route: "/tools/heic-to-jpg", icon: "🔄" },
    { name: "VSD to JPG", description: "Convert Visio diagrams to JPG", category: "Image Tools", route: "/tools/vsd-to-jpg", icon: "🔄" },
    { name: "PNG to SVG", description: "Convert PNG to SVG vector", category: "Image Tools", route: "/tools/png-to-svg", icon: "🔄" },
    { name: "JPG to SVG", description: "Convert JPG to SVG vector", category: "Image Tools", route: "/tools/jpg-to-svg", icon: "🔄" },
    { name: "PDF to SVG", description: "Convert PDF to SVG vector", category: "Image Tools", route: "/tools/pdf-to-svg", icon: "🔄" },
    { name: "VSDX to JPG", description: "Convert VSDX to JPG format", category: "Image Tools", route: "/tools/jpg-to-vsdx", icon: "🔄" },
    { name: "VSDX to PDF", description: "Convert VSDX diagrams to PDF", category: "Image Tools", route: "/tools/format-converter", icon: "🔄" },
    { name: "GIF to JPG", description: "Convert GIF images to JPG", category: "Image Tools", route: "/tools/format-converter", icon: "🔄" },
    { name: "Add Watermark to Image", description: "Add text or logo watermarks to protect your images", category: "Image Tools", route: "/tools/image-watermark", icon: "💧" },
    { name: "Add Border to Image", description: "Add frames and borders to your images", category: "Image Tools", route: "/tools/image-border", icon: "🖼️" },
    { name: "Color Palette Extractor", description: "Extract dominant colors from any image", category: "Image Tools", route: "/tools/color-palette-extractor", icon: "🎨" },
    { name: "Image to Base64", description: "Convert images to Base64 encoded strings", category: "Image Tools", route: "/tools/image-to-base64", icon: "🔤" },
    { name: "Compare Images", description: "Side-by-side image comparison tool", category: "Image Tools", route: "/tools/image-comparison", icon: "⚖️" },
    { name: "Make Round Image", description: "Create circular profile pictures and avatars", category: "Image Tools", route: "/tools/make-round-image", icon: "⭕" },
    { name: "Image Splitter", description: "Split images into pieces", category: "Image Tools", route: "/tools/image-splitter", icon: "✂️" },
    { name: "PNG to WEBP", description: "Convert PNG to WEBP format", category: "Image Tools", route: "/tools/png-to-webp", icon: "🔄" },
    { name: "JPG to WEBP", description: "Convert JPG to WEBP format", category: "Image Tools", route: "/tools/jpg-to-webp", icon: "🔄" },
    { name: "Vector Checker", description: "Check if files are vector or raster", category: "Image Tools", route: "/tools/vector-checker", icon: "🔍" },
    { name: "DPI Calculator", description: "Calculate image DPI and resolution", category: "Image Tools", route: "/tools/dpi-calculator", icon: "📊" },
    { name: "Image File Size Calculator", description: "Calculate image file sizes", category: "Image Tools", route: "/tools/file-size-calculator", icon: "📊" },
    { name: "Print Size Calculator", description: "Calculate print dimensions", category: "Image Tools", route: "/tools/print-size-calculator", icon: "🖨️" },
    { name: "Logo Dimensions Calculator", description: "Calculate optimal logo sizes", category: "Image Tools", route: "/tools/logo-dimensions", icon: "📏" },
    { name: "Vector Simplifier", description: "Simplify complex vector paths", category: "Image Tools", route: "/tools/vector-simplifier", icon: "✨" },
    { name: "Aspect Ratio Calculator", description: "Calculate image aspect ratios", category: "Image Tools", route: "/tools/aspect-ratio-calculator", icon: "📐" },
    { name: "Font to Vector", description: "Convert fonts to vector outlines", category: "Image Tools", route: "/tools/font-to-vector", icon: "🔤" },
];

const pdfTools = [
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

async function seed() {
    console.log("🌱 Starting database seeding...");
    try {
        // --- Admin User ---
        const admin = await storage.getUserByUsername("admin");
        if (!admin) {
            const hashedPassword = await hashPassword("admin123");
            await storage.createUser({
                username: "admin",
                password: hashedPassword,
                role: "admin",
            });
            console.log("✅ Admin user created: admin / admin123");
        }

        // --- Tools ---
        const allTools = [...imageTools, ...pdfTools];
        const existingTools = await storage.getTools();
        const existingToolIds = new Set(existingTools.map(t => t.tool_id));

        for (const tool of allTools) {
            const toolId = tool.route.split('/').pop() || "";
            if (!existingToolIds.has(toolId)) {
                await storage.createTool({
                    tool_id: toolId,
                    name: tool.name,
                    title: `Free ${tool.name} Tool`,
                    description: tool.description,
                    category: tool.category,
                    status: "active",
                    keywords: [tool.name.toLowerCase(), tool.category.toLowerCase()],
                    howToSteps: [
                        "Upload your file",
                        "Configure settings if needed",
                        "Process the file",
                        "Download the result"
                    ]
                });
            }
        }
        console.log(`✅ Seeded ${allTools.length} tools successfully!`);

    } catch (error) {
        console.error("❌ Seeding failed:", error);
        process.exit(1);
    } finally {
        process.exit(0);
    }
}

seed();
