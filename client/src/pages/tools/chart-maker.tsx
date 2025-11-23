import { useState } from "react";
import ToolLayout from "@/components/tools/shared/ToolLayout";
import ProcessingIndicator, { ProcessingStatus } from "@/components/tools/shared/ProcessingIndicator";
import DownloadButton from "@/components/tools/shared/DownloadButton";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { downloadFile } from "@/lib/fileUtils";
import html2canvas from "html2canvas";
import { BarChart3 } from "lucide-react";

const chartTypes = [
  { value: "bar", label: "Bar Chart" },
  { value: "line", label: "Line Chart" },
  { value: "pie", label: "Pie Chart" },
];

export default function ChartMaker() {
  const [status, setStatus] = useState<ProcessingStatus>("idle");
  const [chartType, setChartType] = useState("bar");
  const [title, setTitle] = useState("Chart Title");
  const [dataPoints, setDataPoints] = useState([{ label: "Item 1", value: 10 }]);
  const [processedBlob, setProcessedBlob] = useState<Blob | null>(null);
  const chartRef = useState<HTMLDivElement | null>(null);
  const { toast } = useToast();

  const addDataPoint = () => {
    setDataPoints([...dataPoints, { label: `Item ${dataPoints.length + 1}`, value: 10 }]);
  };

  const removeDataPoint = (index: number) => {
    if (dataPoints.length > 1) {
      setDataPoints(dataPoints.filter((_, i) => i !== index));
    }
  };

  const updateDataPoint = (index: number, field: string, value: string | number) => {
    const updated = [...dataPoints];
    updated[index] = { ...updated[index], [field]: value };
    setDataPoints(updated);
  };

  const handleCreateChart = async () => {
    setStatus("processing");

    try {
      const chartElement = document.getElementById('chart-container');
      if (!chartElement) throw new Error('Chart container not found');

      const canvas = await html2canvas(chartElement, { backgroundColor: '#ffffff' });
      canvas.toBlob((blob) => {
        if (blob) {
          setProcessedBlob(blob);
          setStatus("success");
          toast({
            title: "Success!",
            description: "Chart created successfully",
          });
        }
      }, 'image/png', 1.0);
    } catch (error) {
      setStatus("error");
      toast({
        title: "Processing Failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  const handleDownload = () => {
    if (!processedBlob) return;
    downloadFile(processedBlob, "chart.png");
  };

  const maxValue = Math.max(...dataPoints.map(d => d.value), 1);

  return (
    <ToolLayout
      title="Chart Maker"
      description="Create professional charts and graphs. Generate bar charts, line charts, and pie charts from your data."
      category="Image Tools"
      keywords={["chart maker", "graph maker", "bar chart", "line chart", "pie chart", "data visualization"]}
      howToSteps={[
        { name: "Enter Data", text: "Add your data points with labels and values" },
        { name: "Choose Type", text: "Select chart type (bar, line, or pie)" },
        { name: "Create", text: "Click Create Chart" },
        { name: "Download", text: "Download your chart as an image" },
      ]}
    >
      <div className="space-y-6">
        <div className="backdrop-blur-md bg-white/70 border border-white/40 rounded-xl p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-[#0B9F47]" />
            Chart Settings
          </h2>
          <div className="space-y-4">
            <div>
              <Label>Chart Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div>
              <Label>Chart Type</Label>
              <Select value={chartType} onValueChange={setChartType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {chartTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="backdrop-blur-md bg-white/70 border border-white/40 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Data Points</h2>
            <Button onClick={addDataPoint} size="sm" variant="outline">
              Add Data Point
            </Button>
          </div>
          <div className="space-y-2">
            {dataPoints.map((point, index) => (
              <div key={index} className="flex gap-2 items-center">
                <Input
                  value={point.label}
                  onChange={(e) => updateDataPoint(index, 'label', e.target.value)}
                  placeholder="Label"
                  className="flex-1"
                />
                <Input
                  type="number"
                  value={point.value}
                  onChange={(e) => updateDataPoint(index, 'value', Number(e.target.value))}
                  placeholder="Value"
                  className="w-24"
                />
                {dataPoints.length > 1 && (
                  <Button onClick={() => removeDataPoint(index)} size="sm" variant="destructive">
                    Remove
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="backdrop-blur-md bg-white/70 border border-white/40 rounded-xl p-6">
          <div id="chart-container" className="p-8 bg-white rounded-lg">
            <h3 className="text-2xl font-bold mb-6 text-center">{title}</h3>
            {chartType === "bar" && (
              <div className="flex items-end justify-center gap-4 h-64">
                {dataPoints.map((point, index) => (
                  <div key={index} className="flex flex-col items-center">
                    <div
                      className="bg-[#0B9F47] w-16 rounded-t"
                      style={{ height: `${(point.value / maxValue) * 200}px` }}
                    />
                    <div className="mt-2 text-sm font-medium">{point.label}</div>
                    <div className="text-xs text-gray-500">{point.value}</div>
                  </div>
                ))}
              </div>
            )}
            {chartType === "line" && (
              <div className="h-64 flex items-end justify-center">
                <svg width="100%" height="200" className="border-b border-l">
                  <polyline
                    fill="none"
                    stroke="#0B9F47"
                    strokeWidth="3"
                    points={dataPoints.map((point, i) => 
                      `${(i / (dataPoints.length - 1)) * 400},${200 - (point.value / maxValue) * 200}`
                    ).join(' ')}
                  />
                </svg>
              </div>
            )}
            {chartType === "pie" && (
              <div className="flex justify-center">
                <div className="w-64 h-64 relative">
                  {dataPoints.map((point, index) => {
                    const percentage = point.value / dataPoints.reduce((sum, p) => sum + p.value, 0);
                    const startAngle = dataPoints.slice(0, index).reduce((sum, p) => 
                      sum + (p.value / dataPoints.reduce((s, pt) => s + pt.value, 0)) * 360, 0
                    );
                    return (
                      <div
                        key={index}
                        className="absolute inset-0"
                        style={{
                          clipPath: `polygon(50% 50%, 50% 0%, ${50 + Math.cos((startAngle + percentage * 360) * Math.PI / 180) * 50}% ${50 + Math.sin((startAngle + percentage * 360) * Math.PI / 180) * 50}%)`,
                          backgroundColor: `hsl(${index * 60}, 70%, 50%)`,
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="backdrop-blur-md bg-white/70 border border-white/40 rounded-xl p-6">
          <Button
            onClick={handleCreateChart}
            className="w-full bg-[#0B9F47] hover:bg-[#0B9F47]/90 text-white"
            size="lg"
            disabled={status === "processing"}
          >
            Create Chart
          </Button>
        </div>

        {status !== "idle" && (
          <ProcessingIndicator
            status={status}
            message="Creating chart..."
            successMessage="Chart created successfully!"
            errorMessage="Failed to create chart. Please try again."
          />
        )}

        {processedBlob && (
          <div className="backdrop-blur-md bg-white/70 border border-white/40 rounded-xl p-6">
            <DownloadButton
              onClick={handleDownload}
              className="w-full bg-[#0B9F47] hover:bg-[#0B9F47]/90 text-white"
            >
              Download Chart
            </DownloadButton>
          </div>
        )}
      </div>
    </ToolLayout>
  );
}

