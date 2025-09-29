import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { Clock } from "lucide-react";

const services = [
  { value: "IMAGE_TO_VECTOR", label: "Image to Vector", baseTime: "2-3 days" },
  { value: "LOGO_VECTORIZATION", label: "Logo Vectorization", baseTime: "3-4 days" },
  { value: "PDF_TO_VECTOR", label: "PDF to Vector", baseTime: "1-2 days" },
  { value: "DXF_CUTTER_READY", label: "DXF Cutter Ready", baseTime: "4-5 days" },
  { value: "RASTER_TO_VECTOR", label: "Raster to Vector", baseTime: "2-4 days" },
];

export default function TurnaroundEstimator() {
  const [service, setService] = useState("");
  const [complexity, setComplexity] = useState("medium");
  const [fileCount, setFileCount] = useState("1");

  const estimateMutation = useMutation({
    mutationFn: async (data: { service: string; complexity: string; fileCount: number }) => {
      const response = await apiRequest("POST", "/api/tools/turnaround", data);
      return response.json();
    },
  });

  const handleEstimate = () => {
    if (service) {
      estimateMutation.mutate({
        service,
        complexity,
        fileCount: parseInt(fileCount) || 1,
      });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8" data-testid="turnaround-estimator">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Project Details</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="service">Service Type</Label>
            <Select value={service} onValueChange={setService}>
              <SelectTrigger data-testid="service-select">
                <SelectValue placeholder="Select a service" />
              </SelectTrigger>
              <SelectContent>
                {services.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="complexity">Project Complexity</Label>
            <Select value={complexity} onValueChange={setComplexity}>
              <SelectTrigger data-testid="complexity-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="simple">Simple (basic shapes, minimal detail)</SelectItem>
                <SelectItem value="medium">Medium (moderate detail, some text)</SelectItem>
                <SelectItem value="complex">Complex (high detail, gradients, effects)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="fileCount">Number of Files</Label>
            <Input
              id="fileCount"
              type="number"
              min="1"
              max="50"
              value={fileCount}
              onChange={(e) => setFileCount(e.target.value)}
              placeholder="How many files to convert?"
              data-testid="file-count"
            />
          </div>

          <Button 
            onClick={handleEstimate} 
            className="w-full gradient-primary"
            disabled={!service || estimateMutation.isPending}
            data-testid="get-estimate"
          >
            {estimateMutation.isPending ? "Calculating..." : "Get Estimate"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Delivery Estimate</CardTitle>
        </CardHeader>
        <CardContent>
          {estimateMutation.data ? (
            <div className="space-y-4" data-testid="estimate-results">
              <div className="text-center">
                <div className="text-4xl font-bold text-primary mb-2" data-testid="estimated-days">
                  {estimateMutation.data.estimatedDays}
                </div>
                <p className="text-lg text-muted-foreground">
                  {estimateMutation.data.estimatedDays === 1 ? "Business Day" : "Business Days"}
                </p>
              </div>

              <div className="p-4 bg-muted/30 rounded-lg">
                <h3 className="font-semibold mb-2">Factors Affecting Timeline:</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Service complexity: {complexity}</li>
                  <li>• Number of files: {fileCount}</li>
                  <li>• Current queue status</li>
                  <li>• Revision requirements</li>
                </ul>
              </div>

              <div className="text-center">
                <Button className="gradient-primary" data-testid="start-order">
                  Start This Order
                </Button>
              </div>
            </div>
          ) : estimateMutation.isError ? (
            <div className="text-center py-8" data-testid="estimate-error">
              <p className="text-destructive">Failed to calculate estimate. Please try again.</p>
            </div>
          ) : (
            <div className="text-center py-8" data-testid="estimate-placeholder">
              <p className="text-muted-foreground">Select service details to get an estimate</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
