import { useState } from "react";
import ToolLayout from "@/components/tools/shared/ToolLayout";
import FileUploader, { UploadedFile } from "@/components/tools/shared/FileUploader";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { FileSpreadsheet, Loader2, Download, Table as TableIcon, Layers, ShieldCheck, Grid3X3 } from "lucide-react";
import * as XLSX from "xlsx";
import * as pdfjsLib from "pdfjs-dist";

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

interface TextItem {
  str: string;
  x: number;
  y: number;
  width: number;
  height: number;
  right: number;
}

export default function PDFToExcel() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleFilesSelected = (uploadedFiles: UploadedFile[]) => {
    setFiles(uploadedFiles);
  };

  const handleConvert = async () => {
    if (files.length === 0) return;

    setIsProcessing(true);
    try {
      const file = files[0].file;
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;

      const fullData: any[][] = [];

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const viewport = page.getViewport({ scale: 1.0 });

        // 1. Normalize items and filter noise
        const items: TextItem[] = textContent.items
          .map((item: any) => ({
            str: item.str,
            x: item.transform[4],
            y: item.transform[5],
            width: item.width,
            height: item.height,
            right: item.transform[4] + item.width
          }))
          .filter(item => item.str.trim().length > 0)
          .filter(item => {
            // Basic header/footer filtering (top and bottom 5% of page)
            const margin = viewport.height * 0.05;
            return item.y > margin && item.y < (viewport.height - margin);
          });

        if (items.length === 0) continue;

        // 2. Identify Rows with dynamic baseline correction
        const rows: TextItem[][] = [];
        const sortedByY = [...items].sort((a, b) => b.y - a.y);

        if (sortedByY.length > 0) {
          let currentRow: TextItem[] = [sortedByY[0]];
          for (let i = 1; i < sortedByY.length; i++) {
            const lastY = currentRow[0].y;
            const currentItem = sortedByY[i];

            // If the item is on the same line (within 20% of font height)
            const tolerance = currentRow[0].height * 0.25 || 3;
            if (Math.abs(currentItem.y - lastY) < tolerance) {
              currentRow.push(currentItem);
            } else {
              rows.push(currentRow.sort((a, b) => a.x - b.x));
              currentRow = [currentItem];
            }
          }
          rows.push(currentRow.sort((a, b) => a.x - b.x));
        }

        // 3. PAGE-LEVEL GRID DETECTION (The "Bucketing" Algorithm)
        // Find all unique horizontal start/end points to detect column "gutters"
        const xMarkers = new Set<number>();
        items.forEach(item => {
          xMarkers.add(Math.round(item.x));
        });

        const sortedMarkers = Array.from(xMarkers).sort((a, b) => a - b);
        const colBoundaries: number[] = [];
        if (sortedMarkers.length > 0) {
          let group = [sortedMarkers[0]];
          for (let i = 1; i < sortedMarkers.length; i++) {
            if (sortedMarkers[i] - group[group.length - 1] < 15) { // Gutter threshold
              group.push(sortedMarkers[i]);
            } else {
              colBoundaries.push(group.reduce((a, b) => a + b) / group.length);
              group = [sortedMarkers[i]];
            }
          }
          colBoundaries.push(group.reduce((a, b) => a + b) / group.length);
        }

        // 4. Map Rows to Grid
        rows.forEach(rowItems => {
          const excelRow: string[] = new Array(colBoundaries.length).fill("");

          rowItems.forEach(item => {
            // Find best fitting column boundary
            let bestColIdx = 0;
            let minDiff = Infinity;

            colBoundaries.forEach((bound, idx) => {
              const diff = Math.abs(item.x - bound);
              if (diff < minDiff) {
                minDiff = diff;
                bestColIdx = idx;
              }
            });

            const currentVal = excelRow[bestColIdx];
            excelRow[bestColIdx] = currentVal ? `${currentVal} ${item.str}` : item.str;
          });

          fullData.push(excelRow.map(c => c.trim()));
        });

        // Separator between pages
        if (pageNum < pdf.numPages) {
          fullData.push([]);
        }
      }

      // 5. Final Export with optimized formatting
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(fullData);

      // Advanced column width calculation
      const colWidths = (fullData[0] || []).map((_, i) => {
        let maxChars = 10;
        fullData.forEach(row => {
          if (row[i]) {
            const len = String(row[i]).length;
            if (len > maxChars) maxChars = len;
          }
        });
        return { wch: Math.min(maxChars + 2, 80) };
      });
      ws["!cols"] = colWidths;

      XLSX.utils.book_append_sheet(wb, ws, "Extracted Data");

      const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      const blob = new Blob([wbout], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });

      const saveName = `${file.name.replace(/\.pdf$/i, "")}_Table_Export.xlsx`;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = saveName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Table Exported!",
        description: "Grid structure preserved successfully.",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Mapping error",
        description: "Failed to detect table grid. This file may be too complex.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <ToolLayout
      title="Pro PDF Table Extractor"
      description="Advanced grid-detection technology to preserve table structures. Converts any PDF data into clean Excel spreadsheets."
      category="PDF Tools"
      keywords={["pdf to excel", "table extraction", "preserve grid", "pdf structure to spreadsheet"]}
      howToSteps={[
        { name: "Upload", text: "Select a PDF that contains tables" },
        { name: "Grid Logic", text: "Our engine maps physical X/Y coordinates to Excel cells" },
        { name: "Export", text: "Download a structured .xlsx file" },
      ]}
    >
      <div className="max-w-5xl mx-auto py-8">
        <div className="relative backdrop-blur-3xl bg-white/40 border border-white/60 shadow-2xl rounded-[3rem] p-12 overflow-hidden">
          {/* Decorative gradients */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-green-200/20 rounded-full blur-[100px] -mr-64 -mt-64" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-200/20 rounded-full blur-[100px] -ml-64 -mb-64" />

          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="mb-8">
              <div className="relative">
                <div className="absolute inset-0 bg-green-500 blur-2xl opacity-20 animate-pulse" />
                <div className="relative h-24 w-24 bg-gradient-to-tr from-green-600 to-green-400 rounded-3xl flex items-center justify-center shadow-2xl rotate-3">
                  <Grid3X3 className="h-12 w-12 text-white" />
                </div>
              </div>
            </div>

            <h2 className="text-4xl font-black tracking-tight text-gray-900 mb-4 px-4">
              Structural Table <span className="text-green-600">Reconstruction</span>
            </h2>
            <p className="text-lg font-medium text-gray-600 max-w-2xl px-6 leading-relaxed mb-12">
              Standard converters ignore spacing. Our engine analyzes the spatial geometry to identify <span className="text-gray-900 font-bold underline decoration-green-500/30">actual table gutters</span> for zero-shift exports.
            </p>

            <div className="w-full max-w-2xl px-4">
              <FileUploader
                accept="application/pdf"
                maxFiles={1}
                maxSize={100 * 1024 * 1024}
                onFilesSelected={handleFilesSelected}
                multiple={false}
                allowedTypes={["application/pdf"]}
              />
            </div>

            {files.length > 0 && (
              <div className="mt-12 w-full max-w-lg space-y-6 animate-in zoom-in-95 duration-500">
                <div className="bg-white/90 p-6 rounded-3xl border border-gray-100 shadow-xl flex items-center gap-5">
                  <div className="h-14 w-14 bg-gradient-to-br from-green-50 to-green-100 rounded-2xl flex items-center justify-center">
                    <FileSpreadsheet className="h-7 w-7 text-green-600" />
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-base font-bold text-gray-900 truncate">{files[0].file.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">PDF Ready</span>
                      <span className="text-xs text-gray-400 font-medium">{(files[0].file.size / (1024 * 1024)).toFixed(2)} MB</span>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleConvert}
                  disabled={isProcessing}
                  className="w-full h-16 bg-green-600 hover:bg-green-700 text-white rounded-3xl shadow-[0_12px_40px_-8px_rgba(22,163,74,0.4)] transition-all duration-300 transform active:scale-95 group overflow-hidden relative"
                >
                  {isProcessing ? (
                    <div className="flex items-center gap-3">
                      <Loader2 className="h-6 w-6 animate-spin" />
                      <span className="font-bold text-lg">Reconstructing Grid...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-3 w-full">
                      <span className="font-bold text-xl uppercase tracking-wider">Start High-Fidelity Export</span>
                      <Download className="h-6 w-6 group-hover:translate-y-1 transition-transform" />
                    </div>
                  )}
                </Button>

                <p className="text-xs text-center text-gray-500 font-medium flex items-center justify-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-green-500" />
                  Your document metadata and content remain 100% private. Processing happens in your local RAM.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12 px-4">
          <FeatureCard
            icon={<Layers className="h-7 w-7 text-blue-600" />}
            title="Layered Parsing"
            desc="Separates visual headers and footer metadata from the core table body automatically."
          />
          <FeatureCard
            icon={<Grid3X3 className="h-7 w-7 text-green-600" />}
            title="Gutter Detection"
            desc="Identifies vertical whitespace channels between columns to prevent horizontal drift."
          />
          <FeatureCard
            icon={<TableIcon className="h-7 w-7 text-purple-600" />}
            title="Cell Resonation"
            desc="Maps scattered text fragments into a strict matrix structure for pixel-perfect Excel cells."
          />
        </div>
      </div>
    </ToolLayout>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="group bg-white/80 p-8 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
      <div className="h-16 w-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 shadow-inner">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
      <p className="text-sm text-gray-500 leading-relaxed font-medium">{desc}</p>
    </div>
  );
}
