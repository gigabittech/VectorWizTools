import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Paper, Title, TextInput, Button, Select, Badge } from "@mantine/core";
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
      const response = await apiRequest("POST", "/tools/api/tools/turnaround", data);
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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <Paper withBorder shadow="md" p="lg" data-testid="turnaround-estimator">
        <div className="space-y-4">
          <Title order={3} className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Project Details</span>
          </Title>
          <div>
            <Select
              label="Service Type"
              value={service}
              onChange={setService}
              placeholder="Select a service"
              data={services.map(s => ({ value: s.value, label: s.label }))}
              data-testid="service-select"
            />
          </div>

          <div>
            <Select
              label="Project Complexity"
              value={complexity}
              onChange={setComplexity}
              data={[
                { value: "simple", label: "Simple (basic shapes, minimal detail)" },
                { value: "medium", label: "Medium (moderate detail, some text)" },
                { value: "complex", label: "Complex (high detail, gradients, effects)" }
              ]}
              data-testid="complexity-select"
            />
          </div>

          <div>
            <TextInput
              label="Number of Files"
              type="number"
              min={1}
              max={50}
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
        </div>
      </Paper>

      <Paper withBorder shadow="md" p="lg">
        <div className="space-y-4">
          <Title order={3}>Delivery Estimate</Title>
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
        </div>
      </Paper>
    </div>
  );
}
