import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ObjectUploader } from "@/components/ObjectUploader";
import { useToast } from "@/hooks/use-toast";
import { Search, CheckCircle, XCircle, FileText } from "lucide-react";
import type { UploadResult } from "@uppy/core";

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

  const handleGetUploadParameters = async () => {
    // Mock upload parameters for demonstration
    return {
      method: "PUT" as const,
      url: "https://example.com/upload",
    };
  };

  const handleUploadComplete = async (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    setIsAnalyzing(true);
    
    // Simulate analysis delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    if (result.successful && result.successful.length > 0) {
      const newAnalyses = result.successful.map((file) => 
        analyzeFile(file.name || "unknown")
      );
      
      setAnalyses(prev => [...prev, ...newAnalyses]);
      
      toast({
        title: "Analysis Complete",
        description: `Analyzed ${newAnalyses.length} file(s)`,
      });
    }
    
    setIsAnalyzing(false);
  };

  const clearResults = () => {
    setAnalyses([]);
  };

  return (
    <div className="space-y-8" data-testid="vector-checker">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Search className="h-5 w-5" />
            <span>Upload Files to Check</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
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
            
            <ObjectUploader
              maxNumberOfFiles={5}
              maxFileSize={10 * 1024 * 1024} // 10MB
              onGetUploadParameters={handleGetUploadParameters}
              onComplete={handleUploadComplete}
              buttonClassName="gradient-primary text-white"
            >
              <Search className="mr-2 h-4 w-4" />
              Choose Files to Check
            </ObjectUploader>
          </div>
        </CardContent>
      </Card>

      {analyses.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Analysis Results</CardTitle>
              <Button variant="outline" size="sm" onClick={clearResults} data-testid="clear-results">
                Clear Results
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4" data-testid="analysis-results">
              {analyses.map((analysis, index) => (
                <Card key={index} className="p-4">
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
                          <Badge variant="secondary" data-testid={`file-format-${index}`}>
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
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>File Format Guide</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-emerald-600 mb-3 flex items-center">
                <CheckCircle className="h-5 w-5 mr-2" />
                Vector Formats
              </h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">SVG</span>
                  <Badge className="bg-emerald-100 text-emerald-700">Web optimized</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">AI</span>
                  <Badge className="bg-emerald-100 text-emerald-700">Adobe Illustrator</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">EPS</span>
                  <Badge className="bg-emerald-100 text-emerald-700">Print ready</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">PDF</span>
                  <Badge className="bg-emerald-100 text-emerald-700">Universal</Badge>
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
                  <Badge className="bg-amber-100 text-amber-700">Photos</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">PNG</span>
                  <Badge className="bg-amber-100 text-amber-700">Transparency</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">GIF</span>
                  <Badge className="bg-amber-100 text-amber-700">Animation</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">TIFF</span>
                  <Badge className="bg-amber-100 text-amber-700">High quality</Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
