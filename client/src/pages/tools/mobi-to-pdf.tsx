import { useState } from "react";
import ToolLayout from "@/components/tools/shared/ToolLayout";
import FileUploader, { UploadedFile } from "@/components/tools/shared/FileUploader";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Book, Download, Loader2 } from "lucide-react";
import { initMobiFile } from "@lingo-reader/mobi-parser";
import jsPDF from "jspdf";

export default function MOBIToPDF() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isConverting, setIsConverting] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const { toast } = useToast();

  const handleFilesSelected = (uploadedFiles: UploadedFile[]) => {
    setFiles(uploadedFiles);
    setPdfUrl(null);
  };

  const convertToPDF = async () => {
    if (files.length === 0) return;

    setIsConverting(true);
    try {
      const file = files[0].file;
      const mobi = await initMobiFile(file);
      const spine = mobi.getSpine();
      const metadata = mobi.getMetadata();
      
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "pt",
        format: "a4",
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 50;
      const contentWidth = pageWidth - margin * 2;

      let yOffset = margin;

      // Add Title Page
      doc.setFont("helvetica", "bold");
      doc.setFontSize(24);
      const titleLines = doc.splitTextToSize(metadata.title || "Untitled Book", contentWidth);
      doc.text(titleLines, pageWidth / 2, pageHeight / 3, { align: "center" });
      
      if (metadata.author && metadata.author.length > 0) {
        doc.setFontSize(16);
        doc.setFont("helvetica", "normal");
        doc.text(`By ${metadata.author.join(", ")}`, pageWidth / 2, pageHeight / 3 + 60, { align: "center" });
      }

      doc.addPage();
      yOffset = margin;

      for (let i = 0; i < spine.length; i++) {
        const chapterId = spine[i].id;
        const chapter = mobi.loadChapter(chapterId);
        if (!chapter || !chapter.html) continue;

        // Strip HTML but keep structure for minimal rendering
        const parser = new DOMParser();
        const chapterDoc = parser.parseFromString(chapter.html, "text/html");
        
        // Simple heuristic: if it's a new chapter, start a new page unless it's the very first
        if (i > 0) {
          doc.addPage();
          yOffset = margin;
        }

        const elements = chapterDoc.querySelectorAll("h1, h2, h3, h4, p, img, div");
        
        for (let j = 0; j < elements.length; j++) {
          const el = elements[j] as HTMLElement;
          const tagName = el.tagName.toUpperCase();
          const text = el.innerText.trim();

          if (!text && tagName !== "IMG") continue;

          // Check if we need a new page before adding content
          if (yOffset > pageHeight - margin) {
            doc.addPage();
            yOffset = margin;
          }

          if (tagName.startsWith("H")) {
            const level = parseInt(tagName.substring(1));
            const fontSize = Math.max(12, 20 - (level * 2));
            doc.setFont("helvetica", "bold");
            doc.setFontSize(fontSize);
            
            const lines = doc.splitTextToSize(text, contentWidth);
            const blockHeight = lines.length * (fontSize + 5);
            
            if (yOffset + blockHeight > pageHeight - margin) {
              doc.addPage();
              yOffset = margin;
            }
            
            doc.text(lines, margin, yOffset);
            yOffset += blockHeight + 15;
          } else if (tagName === "P" || tagName === "DIV") {
            // Check if this div is just a wrapper for another element we already processed
            if (el.children.length > 0 && Array.from(el.children).every(c => ["H1", "H2", "H3", "P", "IMG"].includes(c.tagName))) {
              continue; 
            }

            doc.setFont("helvetica", "normal");
            doc.setFontSize(11);
            
            const lines = doc.splitTextToSize(text, contentWidth);
            
            for (const line of lines) {
              if (yOffset + 15 > pageHeight - margin) {
                doc.addPage();
                yOffset = margin;
              }
              doc.text(line, margin, yOffset);
              yOffset += 15;
            }
            yOffset += 5; // Paragraph spacing
          } else if (tagName === "IMG") {
            const imgEl = el as HTMLImageElement;
            const src = imgEl.src;
            
            try {
              // Extract base64 or blob URL
              let imgData: string = src;
              if (src.startsWith("blob:")) {
                const response = await fetch(src);
                const blob = await response.blob();
                imgData = await new Promise((resolve) => {
                  const reader = new FileReader();
                  reader.onloadend = () => resolve(reader.result as string);
                  reader.readAsDataURL(blob);
                });
              }

              if (imgData && imgData.startsWith("data:image")) {
                const imgProps = doc.getImageProperties(imgData);
                const ratio = imgProps.width / imgProps.height;
                let displayWidth = Math.min(contentWidth, imgProps.width);
                let displayHeight = displayWidth / ratio;
                
                if (displayHeight > pageHeight - margin * 2) {
                  displayHeight = pageHeight - margin * 2;
                  displayWidth = displayHeight * ratio;
                }

                if (yOffset + displayHeight > pageHeight - margin) {
                  doc.addPage();
                  yOffset = margin;
                }

                doc.addImage(imgData, "JPEG", margin + (contentWidth - displayWidth) / 2, yOffset, displayWidth, displayHeight);
                yOffset += displayHeight + 20;
              }
            } catch (imgErr) {
              console.warn("Could not add image to PDF:", imgErr);
            }
          }
        }
      }

      const pdfBlob = doc.output("blob");
      if (pdfBlob.size === 0) {
        throw new Error("Generated PDF is empty. Possibly the file is corrupted or too large.");
      }
      
      const url = URL.createObjectURL(pdfBlob);
      setPdfUrl(url);

      toast({
        title: "Success",
        description: "MOBI file converted to PDF successfully.",
      });
      
      if (typeof mobi.destroy === 'function') {
        mobi.destroy();
      }
    } catch (error: any) {
      console.error("Conversion error:", error);
      toast({
        title: "Conversion Failed",
        description: error.message || "Failed to convert MOBI to PDF. Please ensure the file is not encrypted.",
        variant: "destructive",
      });
    } finally {
      setIsConverting(false);
    }
  };



  const handleDownload = () => {
    if (pdfUrl) {
      const link = document.createElement("a");
      link.href = pdfUrl;
      link.download = `${files[0].file.name.replace(".mobi", "")}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <ToolLayout
      title="MOBI to PDF"
      description="Convert MOBI file to PDF file. Transform MOBI ebooks into PDF documents."
      category="PDF Tools"
      keywords={["mobi to pdf", "convert mobi", "ebook to pdf", "mobi converter", "kindle to pdf"]}
      howToSteps={[
        { name: "Upload MOBI", text: "Upload a MOBI file" },
        { name: "Convert", text: "Click Convert to PDF" },
        { name: "Download", text: "Download your PDF file" },
      ]}
    >
      <div className="space-y-6">
        <div className="backdrop-blur-md bg-white/70 border border-white/40 rounded-xl p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Book className="h-5 w-5 text-[#0B9F47]" />
            Upload MOBI
          </h2>
          <FileUploader
            accept=".mobi"
            maxFiles={1}
            maxSize={100 * 1024 * 1024}
            onFilesSelected={handleFilesSelected}
            multiple={false}
            allowedTypes={[".mobi", "application/x-mobipocket-ebook"]}
          />
          
          {files.length > 0 && !pdfUrl && (
            <div className="mt-6 flex justify-center">
              <Button 
                onClick={convertToPDF} 
                disabled={isConverting}
                className="bg-[#0B9F47] hover:bg-[#0B9F47]/90 text-white px-8"
              >
                {isConverting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Converting...
                  </>
                ) : "Convert to PDF"}
              </Button>
            </div>
          )}

          {pdfUrl && (
            <div className="mt-6 p-6 border-2 border-dashed border-[#0B9F47] rounded-xl bg-[#0B9F47]/5 flex flex-col items-center">
              <p className="text-[#0B9F47] font-semibold mb-4">Conversion Complete!</p>
              <Button 
                onClick={handleDownload}
                className="bg-[#0B9F47] hover:bg-[#0B9F47]/90 text-white flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Download PDF
              </Button>
            </div>
          )}

          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-900">
              <strong>Note:</strong> Conversion is performed locally in your browser for privacy. Large files may take a moment. Ensure the MOBI file is not DRM protected.
            </p>
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}


