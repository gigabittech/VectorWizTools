import { useState } from "react";
import ToolLayout from "@/components/tools/shared/ToolLayout";
import FileUploader, { UploadedFile } from "@/components/tools/shared/FileUploader";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { FileSpreadsheet, Loader2, Download, Table as TableIcon, Lock, Zap } from "lucide-react";
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

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();

        const items: TextItem[] = textContent.items.map((item: any) => ({
          str: item.str,
          x: item.transform[4],
          y: item.transform[5],
          width: item.width,
          height: item.height,
        }));

        if (items.length === 0) continue;

        // --- STEP 1: Global Column Grid Detection ---
        // We look at all X-coordinates across the page to find common start positions
        // This creates a "Master Grid" that forces consistency across all rows.
        const xCoords = items.map(item => item.x).sort((a, b) => a - b);
        const masterColumns: number[] = [];
        const xThreshold = 15; // Tolerance for grouping similar X-positions

        if (xCoords.length > 0) {
          let currentGroup: number[] = [xCoords[0]];
          for (let j = 1; j < xCoords.length; j++) {
            const lastAvg = currentGroup.reduce((a, b) => a + b) / currentGroup.length;
            if (xCoords[j] - lastAvg < xThreshold) {
              currentGroup.push(xCoords[j]);
            } else {
              masterColumns.push(currentGroup.reduce((a, b) => a + b) / currentGroup.length);
              currentGroup = [xCoords[j]];
            }
          }
          masterColumns.push(currentGroup.reduce((a, b) => a + b) / currentGroup.length);
        }

        // --- STEP 2: Row Grouping with strict baseline ---
        const rowsMap: Map<number, TextItem[]> = new Map();
        const yTolerance = 6;

        items.forEach((item) => {
          let foundY = Array.from(rowsMap.keys()).find(
            (y) => Math.abs(y - item.y) < yTolerance
          );

          if (foundY !== undefined) {
            rowsMap.get(foundY)?.push(item);
          } else {
            rowsMap.set(item.y, [item]);
          }
        });

        // Sort rows by Y descending (top of page to bottom)
        const sortedY = Array.from(rowsMap.keys()).sort((a, b) => b - a);

        sortedY.forEach((y) => {
          const rowItems = rowsMap.get(y) || [];
          // Create a row with fixed length based on master columns
          const excelRow: string[] = new Array(masterColumns.length).fill("");

          // Assign each piece of text to its closest column slot
          rowItems.forEach(item => {
            let bestColIdx = 0;
            let minDiff = Infinity;

            masterColumns.forEach((colX, idx) => {
              const diff = Math.abs(colX - item.x);
              if (diff < minDiff) {
                minDiff = diff;
                bestColIdx = idx;
              }
            });

            // Prevent data merging by prepending space if something exists
            excelRow[bestColIdx] = excelRow[bestColIdx]
              ? excelRow[bestColIdx] + " " + item.str
              : item.str;
          });

          // Only add row if it contains actual data (not just whitespace)
          if (excelRow.some(cell => cell.trim() !== "")) {
            fullData.push(excelRow.map(c => c.trim()));
          }
        });

        // Blank line between pages
        if (i < pdf.numPages) fullData.push([]);
      }

      // --- STEP 3: Export with Layout Preservation ---
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(fullData);

      // Auto-calculate column widths for better readability
      const colWidths = fullData[0]?.map((_, colIdx) => {
        let maxLen = 12;
        fullData.forEach(row => {
          const content = row[colIdx] ? String(row[colIdx]) : "";
          if (content.length > maxLen) maxLen = content.length;
        });
        return { wch: Math.min(maxLen + 4, 60) };
      });
      if (colWidths) ws["!cols"] = colWidths;

      XLSX.utils.book_append_sheet(wb, ws, "Reconstructed Table");

      // Save the file
      const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      const blob = new Blob([wbout], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });

      const fileName = file.name.replace(/\.pdf$/i, "") + "_Formatted.xlsx";
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Export Success",
        description: "Table columns locked and aligned successfully.",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Layout Error",
        description: "Could not lock table columns. Please check document quality.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <ToolLayout
      title="Precision PDF to Excel"
      description="Advanced spatial mapping to extract PDF tables. Fixed column grid technology prevents data shifting."
      category="PDF Tools"
      keywords={["pdf to excel", "locked columns pdf", "table extraction", "spreadsheet converter"]}
      howToSteps={[
        { name: "Upload", text: "Choose your PDF document" },
        { name: "Grid Analysis", text: "Our AI maps the global column structure" },
        { name: "Export", text: "Columns are locked into a stable Excel grid" },
      ]}
    >
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="relative overflow-hidden backdrop-blur-xl bg-white/80 border border-white/40 rounded-[2rem] p-10 shadow-[0_20px_50px_rgba(0,0,0,0.05)]">
          {/* Background Decoration */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#0B9F47]/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl" />

          <div className="relative flex flex-col items-center text-center">
            <div className="group transition-all duration-500 transform hover:scale-110 mb-6">
              <div className="h-20 w-20 bg-gradient-to-br from-[#0B9F47] to-[#087a36] rounded-2xl flex items-center justify-center shadow-xl shadow-[#0B9F47]/20 rotate-3 group-hover:rotate-0">
                <FileSpreadsheet className="h-10 w-10 text-white" />
              </div>
            </div>

            <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
              Grid-Locked PDF Extraction
            </h1>
            <p className="text-gray-500 mb-10 max-w-lg leading-relaxed">
              Using global spatial mapping to ensure columns stay perfectly aligned from the first row to the last.
            </p>

            <div className="w-full">
              <FileUploader
                accept="application/pdf"
                maxFiles={1}
                maxSize={50 * 1024 * 1024}
                onFilesSelected={handleFilesSelected}
                multiple={false}
                allowedTypes={["application/pdf"]}
              />
            </div>

            {files.length > 0 && (
              <div className="mt-10 w-full animate-in fade-in slide-in-from-bottom-5">
                <div className="flex items-center gap-4 p-5 bg-white rounded-2xl border border-gray-100 shadow-sm mb-6 max-w-md mx-auto">
                  <div className="h-12 w-12 bg-green-50 rounded-xl flex items-center justify-center">
                    <TableIcon className="h-6 w-6 text-[#0B9F47]" />
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{files[0].file.name}</p>
                    <p className="text-xs text-gray-500 font-medium">Grid mapping ready • {(files[0].file.size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>

                <Button
                  onClick={handleConvert}
                  disabled={isProcessing}
                  className="w-full h-14 bg-gray-900 hover:bg-black text-white rounded-2xl shadow-2xl transition-all duration-300 flex items-center justify-center gap-3 text-lg font-bold disabled:opacity-70"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-6 w-6 animate-spin" />
                      Locking Column Grid...
                    </>
                  ) : (
                    <>
                      <Download className="h-6 w-6" />
                      Export Structured Excel
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FeatureCard
            icon={<Lock className="h-6 w-6 text-indigo-600" />}
            title="Locked Column Grid"
            desc="Calculates column gutters globally to prevent data shifting between rows."
            bg="bg-indigo-50"
          />
          <FeatureCard
            icon={<TableIcon className="h-6 w-6 text-[#0B9F47]" />}
            title="Tabular Preservation"
            desc="Detects table headers and aligns them precisely with corresponding data cells."
            bg="bg-green-50"
          />
          <FeatureCard
            icon={<Zap className="h-6 w-6 text-amber-500" />}
            title="Instant Local Build"
            desc="Processing happens in-browser for 100% privacy and Zero server delay."
            bg="bg-amber-50"
          />
        </div>
      </div>
    </ToolLayout>
  );
}

function FeatureCard({ icon, title, desc, bg }: { icon: React.ReactNode, title: string, desc: string, bg: string }) {
  return (
    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm transition-all hover:shadow-lg hover:-translate-y-1">
      <div className={`h-12 w-12 ${bg} rounded-2xl flex items-center justify-center mb-5`}>
        {icon}
      </div>
      <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-500 leading-relaxed font-medium">{desc}</p>
    </div>
  );
}
