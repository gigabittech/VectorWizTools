import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calculator } from "lucide-react";

interface DPIResults {
  dpiX: number;
  dpiY: number;
  needsVector: boolean;
  quality: string;
}

export default function DPICalculator() {
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [printWidth, setPrintWidth] = useState("");
  const [printHeight, setPrintHeight] = useState("");
  const [results, setResults] = useState<DPIResults | null>(null);

  const calculateDPI = () => {
    const pixelW = parseFloat(width);
    const pixelH = parseFloat(height);
    const printW = parseFloat(printWidth);
    const printH = parseFloat(printHeight);

    if (pixelW && pixelH && printW && printH) {
      const dpiX = pixelW / printW;
      const dpiY = pixelH / printH;
      const avgDPI = (dpiX + dpiY) / 2;

      let quality = "Poor";
      let needsVector = true;

      if (avgDPI >= 300) {
        quality = "Excellent";
        needsVector = false;
      } else if (avgDPI >= 150) {
        quality = "Good";
        needsVector = false;
      } else if (avgDPI >= 72) {
        quality = "Fair";
        needsVector = true;
      }

      setResults({
        dpiX: Math.round(dpiX),
        dpiY: Math.round(dpiY),
        needsVector,
        quality,
      });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8" data-testid="dpi-calculator">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calculator className="h-5 w-5" />
            <span>Image & Print Dimensions</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="width">Image Width (pixels)</Label>
              <Input
                id="width"
                type="number"
                value={width}
                onChange={(e) => setWidth(e.target.value)}
                placeholder="e.g., 1920"
                data-testid="image-width"
              />
            </div>
            <div>
              <Label htmlFor="height">Image Height (pixels)</Label>
              <Input
                id="height"
                type="number"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                placeholder="e.g., 1080"
                data-testid="image-height"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="printWidth">Print Width (inches)</Label>
              <Input
                id="printWidth"
                type="number"
                step="0.1"
                value={printWidth}
                onChange={(e) => setPrintWidth(e.target.value)}
                placeholder="e.g., 8.5"
                data-testid="print-width"
              />
            </div>
            <div>
              <Label htmlFor="printHeight">Print Height (inches)</Label>
              <Input
                id="printHeight"
                type="number"
                step="0.1"
                value={printHeight}
                onChange={(e) => setPrintHeight(e.target.value)}
                placeholder="e.g., 11"
                data-testid="print-height"
              />
            </div>
          </div>

          <Button onClick={calculateDPI} className="w-full gradient-primary" data-testid="calculate-dpi">
            Calculate DPI
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Results</CardTitle>
        </CardHeader>
        <CardContent>
          {results ? (
            <div className="space-y-4" data-testid="dpi-results">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-muted/30 rounded-lg">
                  <p className="text-2xl font-bold" data-testid="dpi-x">{results.dpiX}</p>
                  <p className="text-sm text-muted-foreground">DPI (Width)</p>
                </div>
                <div className="text-center p-4 bg-muted/30 rounded-lg">
                  <p className="text-2xl font-bold" data-testid="dpi-y">{results.dpiY}</p>
                  <p className="text-sm text-muted-foreground">DPI (Height)</p>
                </div>
              </div>

              <div className="text-center">
                <Badge 
                  className={`text-lg px-4 py-2 ${
                    results.quality === "Excellent" ? "bg-emerald-100 text-emerald-700" :
                    results.quality === "Good" ? "bg-blue-100 text-blue-700" :
                    results.quality === "Fair" ? "bg-amber-100 text-amber-700" :
                    "bg-red-100 text-red-700"
                  }`}
                  data-testid="quality-badge"
                >
                  {results.quality} Quality
                </Badge>
              </div>

              {results.needsVector && (
                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg" data-testid="vector-recommendation">
                  <h3 className="font-semibold text-destructive mb-2">Vectorization Recommended</h3>
                  <p className="text-sm text-destructive/80">
                    Your image resolution is too low for high-quality printing. Consider vectorizing for scalable, crisp results.
                  </p>
                  <Button className="mt-3 gradient-primary" size="sm" data-testid="start-vector-order">
                    Start Vector Order
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8" data-testid="dpi-placeholder">
              <p className="text-muted-foreground">Enter dimensions above to calculate DPI</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
