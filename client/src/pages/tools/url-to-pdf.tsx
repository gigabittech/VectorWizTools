import { useState } from "react";
import ToolLayout from "@/components/tools/shared/ToolLayout";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Globe } from "lucide-react";

export default function URLToPDF() {
  const [url, setUrl] = useState("");
  const { toast } = useToast();

  const handleConvert = () => {
    if (!url.trim()) {
      toast({
        title: "No URL",
        description: "Please enter a URL",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Server Processing Required",
      description: "URL to PDF conversion requires server-side processing with headless browser. This feature is coming soon.",
      variant: "default",
    });
  };

  return (
    <ToolLayout
      title="URL to PDF"
      description="Enter a URL and receive the PC or mobile web page as a PDF. Convert web pages to PDF documents."
      category="PDF Tools"
      keywords={["url to pdf", "webpage to pdf", "html to pdf", "convert url", "web to pdf"]}
      howToSteps={[
        { name: "Enter URL", text: "Enter the website URL" },
        { name: "Convert", text: "Click Convert to PDF" },
        { name: "Download", text: "Download your PDF file" },
      ]}
    >
      <div className="space-y-6">
        <div className="backdrop-blur-md bg-white/70 border border-white/40 rounded-xl p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Globe className="h-5 w-5 text-[#0B9F47]" />
            Enter URL
          </h2>
          <div className="space-y-4">
            <div>
              <Label>Website URL</Label>
              <Input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
              />
            </div>
            <Button
              onClick={handleConvert}
              className="w-full bg-[#0B9F47] hover:bg-[#0B9F47]/90 text-white"
              size="lg"
            >
              Convert to PDF
            </Button>
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-900">
                <strong>Note:</strong> URL to PDF conversion requires server-side processing with headless browser. This feature is coming soon.
              </p>
            </div>
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}

