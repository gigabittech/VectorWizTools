import { useState, useRef } from "react";
import { Paper, Title, Button, Badge } from "@mantine/core";
import { useToast } from "@/hooks/use-toast";
import { Search, CheckCircle, XCircle, FileText, Upload } from "lucide-react";

interface FileAnalysis {
  name: string;
  isVector: boolean;
  format: string;
  recommendation: string;
  details: string[];
}

export default function VectorChecker() {
  const [analyses, setAnalyses] = useState<FileAnalysis[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();

  const analyzeFile = (fileName: string): FileAnalysis => {
    const extension = fileName.split('.').pop()?.toLowerCase() || "";
    const vectorFormats = ['svg', 'ai', 'eps', 'pdf'];
    const rasterFormats = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff'];
    
    const isVector = vectorFormats.includes(extension);
    
    let recommendation = "";
    let details: string[] = [];
    
    if (isVector) {
      recommendation = "This appears to be a vector file! ✓";
      details = [
        "Scalable without quality loss",
        "Suitable for professional printing",
        "Can be edited with vector software"
      ];
    } else if (rasterFormats.includes(extension)) {
      recommendation = "This is a raster image - vectorization recommended";
      details = [
        "May lose quality when scaled up",
        "Not suitable for large format printing",
        "Consider vectorizing for professional use"
      ];
    } else {
      recommendation = "Unknown file format";
      details = [
        "Unable to determine file type",
        "Please upload common image formats"
      ];
    }
    
    return {
      name: fileName,
      isVector,
      format: extension.toUpperCase(),
      recommendation,
      details
    };
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsAnalyzing(true);
    
    // Simulate analysis delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const newAnalyses = Array.from(files).map((file) => analyzeFile(file.name));
    setAnalyses(prev => [...prev, ...newAnalyses]);
    
    toast({
      title: "Analysis Complete",
      description: `Analyzed ${files.length} file(s)`,
    });
    
    setIsAnalyzing(false);
    
    // Reset input
    if (event.target) {
      event.target.value = '';
    }
  };

  const clearResults = () => {
    setAnalyses([]);
  };

  return (
    <div className="space-y-8">
      <Paper withBorder shadow="md" p="lg" data-testid="vector-checker">
        <div className="space-y-4">
          <Title order={3} className="flex items-center space-x-2">
            <Search className="h-5 w-5" />
            <span>Upload Files to Check</span>
          </Title>
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Search className="h-8 w-8 text-emerald-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">
              {isAnalyzing ? "Analyzing Files..." : "Drop Files to Verify Format"}
            </h3>
            <p className="text-muted-foreground mb-6">
              Upload your files to instantly check if they're vector or raster images
            </p>
            
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.svg,.ai,.eps,.pdf"
              onChange={handleFileSelect}
              className="hidden"
              data-testid="file-input"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              className="bg-[#0B9F47] hover:bg-[#0B9F47]/90 text-white"
              disabled={isAnalyzing}
              data-testid="upload-button"
            >
              <Upload className="mr-2 h-4 w-4" />
              Choose Files to Check
            </Button>
          </div>
        </div>
      </Paper>

      {analyses.length > 0 && (
        <Paper withBorder shadow="md" p="lg">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Title order={3}>Analysis Results</Title>
              <Button variant="outline" size="sm" onClick={clearResults} data-testid="clear-results">
                Clear Results
              </Button>
            </div>
            <div className="space-y-4" data-testid="analysis-results">
              {analyses.map((analysis, index) => (
                <Paper key={index} withBorder p="md">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <FileText className="h-5 w-5 text-blue-600" />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="font-medium" data-testid={`file-name-${index}`}>
                            {analysis.name}
                          </h4>
                          <Badge variant="light" color="blue" data-testid={`file-format-${index}`}>
                            {analysis.format}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center space-x-2 mb-3">
                          {analysis.isVector ? (
                            <CheckCircle className="h-5 w-5 text-emerald-600" />
                          ) : (
                            <XCircle className="h-5 w-5 text-amber-600" />
                          )}
                          <p className={`font-medium ${
                            analysis.isVector ? "text-emerald-600" : "text-amber-600"
                          }`} data-testid={`recommendation-${index}`}>
                            {analysis.recommendation}
                          </p>
                        </div>
                        
                        <ul className="text-sm text-muted-foreground space-y-1">
                          {analysis.details.map((detail, detailIndex) => (
                            <li key={detailIndex} data-testid={`detail-${index}-${detailIndex}`}>
                              • {detail}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    
                    {!analysis.isVector && (
                      <Button size="sm" className="gradient-primary" data-testid={`vectorize-${index}`}>
                        Vectorize This File
                      </Button>
                    )}
                  </div>
                </Paper>
              ))}
            </div>
          </div>
        </Paper>
      )}

      <Paper withBorder shadow="md" p="lg">
        <div className="space-y-4">
          <Title order={3}>File Format Guide</Title>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-emerald-600 mb-3 flex items-center">
                <CheckCircle className="h-5 w-5 mr-2" />
                Vector Formats
              </h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">SVG</span>
                  <Badge variant="light" color="green">Web optimized</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">AI</span>
                  <Badge variant="light" color="green">Adobe Illustrator</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">EPS</span>
                  <Badge variant="light" color="green">Print ready</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">PDF</span>
                  <Badge variant="light" color="green">Universal</Badge>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold text-amber-600 mb-3 flex items-center">
                <XCircle className="h-5 w-5 mr-2" />
                Raster Formats
              </h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">JPG/JPEG</span>
                  <Badge variant="light" color="orange">Photos</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">PNG</span>
                  <Badge variant="light" color="orange">Transparency</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">GIF</span>
                  <Badge variant="light" color="orange">Animation</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">TIFF</span>
                  <Badge variant="light" color="orange">High quality</Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Paper>
    </div>
  );
}
