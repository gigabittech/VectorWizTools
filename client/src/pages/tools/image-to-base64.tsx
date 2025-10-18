import { useState } from "react";
import ToolLayout from "@/components/tools/shared/ToolLayout";
import FileUploader, { UploadedFile } from "@/components/tools/shared/FileUploader";
import ProcessingIndicator, { ProcessingStatus } from "@/components/tools/shared/ProcessingIndicator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Check, Copy, Code2 } from "lucide-react";

export default function ImageToBase64() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [status, setStatus] = useState<ProcessingStatus>("idle");
  const [base64String, setBase64String] = useState("");
  const [outputFormat, setOutputFormat] = useState<"plain" | "data-url" | "css" | "html" | "markdown">("data-url");
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleFilesSelected = async (uploadedFiles: UploadedFile[]) => {
    setFiles(uploadedFiles);
    setBase64String("");
    setCopied(false);

    if (uploadedFiles.length > 0) {
      setStatus("processing");
      try {
        const file = uploadedFiles[0].file;
        const reader = new FileReader();

        reader.onloadend = () => {
          const result = reader.result as string;
          setBase64String(result);
          setStatus("success");
          toast({
            title: "Success!",
            description: "Image converted to Base64",
          });
        };

        reader.onerror = () => {
          setStatus("error");
          toast({
            title: "Failed",
            description: "Failed to convert image",
            variant: "destructive",
          });
        };

        reader.readAsDataURL(file);
      } catch (error) {
        setStatus("error");
        toast({
          title: "Failed",
          description: error instanceof Error ? error.message : "An error occurred",
          variant: "destructive",
        });
      }
    }
  };

  const getFormattedOutput = (): string => {
    if (!base64String) return "";

    switch (outputFormat) {
      case "plain":
        return base64String.split(',')[1] || base64String;
      case "data-url":
        return base64String;
      case "css":
        return `background-image: url('${base64String}');`;
      case "html":
        return `<img src="${base64String}" alt="Base64 Image" />`;
      case "markdown":
        return `![Image](${base64String})`;
      default:
        return base64String;
    }
  };

  const copyToClipboard = () => {
    const output = getFormattedOutput();
    navigator.clipboard.writeText(output);
    setCopied(true);
    toast({
      title: "Copied!",
      description: "Base64 string copied to clipboard",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadAsText = () => {
    const output = getFormattedOutput();
    const blob = new Blob([output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'base64-output.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Downloaded!",
      description: "Base64 string saved as text file",
    });
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <ToolLayout
      title="Image to Base64 Converter"
      description="Convert images to Base64 strings online for free. Encode JPG, PNG, WebP images to Base64 format. Perfect for embedding images in HTML, CSS, or JavaScript."
      category="Image Tools"
      keywords={["image to base64", "base64 encoder", "encode image", "data url", "base64 converter"]}
      howToSteps={[
        { name: "Upload Image", text: "Click or drag and drop your image file" },
        { name: "Choose Format", text: "Select output format (plain, data URL, CSS, HTML)" },
        { name: "Copy", text: "Click Copy to copy the Base64 string to clipboard" },
        { name: "Use", text: "Paste the Base64 string in your code" },
      ]}
    >
      <div className="space-y-6">
        {/* File Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code2 className="h-5 w-5 text-[#0B9F47]" />
              Upload Image
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FileUploader
              accept="image/*"
              maxFiles={1}
              maxSize={5 * 1024 * 1024}
              onFilesSelected={handleFilesSelected}
              multiple={false}
              allowedTypes={["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"]}
              data-testid="file-uploader"
            />
            <p className="text-xs text-gray-500 mt-2">
              Maximum file size: 5MB (Base64 encoding increases size by ~33%)
            </p>
          </CardContent>
        </Card>

        {/* Processing Status */}
        {status !== "idle" && status !== "success" && (
          <ProcessingIndicator
            status={status}
            message="Converting to Base64..."
            errorMessage="Failed to convert image. Please try again."
          />
        )}

        {/* Output */}
        {base64String && status === "success" && (
          <>
            {/* Output Format Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Output Format</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="output-format" data-testid="label-format">Format</Label>
                  <Select value={outputFormat} onValueChange={(value: any) => setOutputFormat(value)}>
                    <SelectTrigger id="output-format" data-testid="select-format">
                      <SelectValue placeholder="Select format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="plain" data-testid="format-plain">Plain Base64</SelectItem>
                      <SelectItem value="data-url" data-testid="format-data-url">Data URL</SelectItem>
                      <SelectItem value="css" data-testid="format-css">CSS Background</SelectItem>
                      <SelectItem value="html" data-testid="format-html">HTML Image Tag</SelectItem>
                      <SelectItem value="markdown" data-testid="format-markdown">Markdown</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Format Description */}
                <div className="bg-blue-50 p-3 rounded text-sm">
                  {outputFormat === "plain" && (
                    <p><strong>Plain Base64:</strong> Just the encoded string without data URL prefix</p>
                  )}
                  {outputFormat === "data-url" && (
                    <p><strong>Data URL:</strong> Complete data URL with MIME type (use in src attributes)</p>
                  )}
                  {outputFormat === "css" && (
                    <p><strong>CSS Background:</strong> Ready-to-use CSS background-image property</p>
                  )}
                  {outputFormat === "html" && (
                    <p><strong>HTML Image Tag:</strong> Complete &lt;img&gt; tag with Base64 source</p>
                  )}
                  {outputFormat === "markdown" && (
                    <p><strong>Markdown:</strong> Markdown image syntax with Base64 data URL</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Base64 Output */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Base64 Output</CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={copyToClipboard}
                      data-testid="button-copy"
                    >
                      {copied ? (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4 mr-2" />
                          Copy
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={downloadAsText}
                      data-testid="button-download"
                    >
                      Download
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Preview */}
                {files[0].preview && (
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <p className="text-sm font-medium mb-2" data-testid="label-preview">Image Preview</p>
                    <img
                      src={files[0].preview}
                      alt="Preview"
                      className="max-w-full h-auto mx-auto max-h-48 object-contain"
                      data-testid="preview-image"
                    />
                  </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg" data-testid="stat-original">
                    <p className="text-sm text-blue-900 mb-1">Original Size</p>
                    <p className="font-semibold text-blue-700" data-testid="text-original-size">
                      {formatBytes(files[0].file.size)}
                    </p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg" data-testid="stat-base64">
                    <p className="text-sm text-green-900 mb-1">Base64 Size</p>
                    <p className="font-semibold text-green-700" data-testid="text-base64-size">
                      {formatBytes(new Blob([getFormattedOutput()]).size)}
                    </p>
                  </div>
                </div>

                {/* Base64 String */}
                <div className="space-y-2">
                  <Label data-testid="label-output">Output</Label>
                  <Textarea
                    value={getFormattedOutput()}
                    readOnly
                    className="font-mono text-xs min-h-[200px]"
                    data-testid="textarea-output"
                  />
                  <p className="text-xs text-gray-500">
                    Length: {getFormattedOutput().length.toLocaleString()} characters
                  </p>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Information */}
        <Card>
          <CardHeader>
            <CardTitle>About Base64 Image Encoding</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            <p>
              Convert images to Base64 strings for embedding directly in HTML, CSS, or JavaScript. Perfect for:
            </p>
            <ul>
              <li><strong>Email Templates:</strong> Embed images without external hosting</li>
              <li><strong>Data URIs:</strong> Inline images in CSS for faster loading</li>
              <li><strong>API Responses:</strong> Send images as JSON data</li>
              <li><strong>Offline Apps:</strong> Bundle images with code</li>
            </ul>
            <h3 className="text-base font-semibold mt-4 mb-2">Output Formats:</h3>
            <ul className="text-sm">
              <li><strong>Plain:</strong> Just the Base64 string</li>
              <li><strong>Data URL:</strong> <code>data:image/png;base64,...</code></li>
              <li><strong>CSS:</strong> <code>background-image: url('data:...');</code></li>
              <li><strong>HTML:</strong> <code>&lt;img src="data:..." /&gt;</code></li>
              <li><strong>Markdown:</strong> <code>![Image](data:...)</code></li>
            </ul>
            <p className="text-sm text-gray-600 mt-4">
              <strong>Note:</strong> Base64 encoding increases file size by about 33%. Use for small images or when embedding is necessary.
            </p>
          </CardContent>
        </Card>
      </div>
    </ToolLayout>
  );
}
