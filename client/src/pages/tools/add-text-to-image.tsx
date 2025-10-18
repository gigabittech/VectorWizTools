import { useState } from "react";
import ToolLayout from "@/components/tools/shared/ToolLayout";
import FileUploader, { UploadedFile } from "@/components/tools/shared/FileUploader";
import ProcessingIndicator, { ProcessingStatus } from "@/components/tools/shared/ProcessingIndicator";
import DownloadButton from "@/components/tools/shared/DownloadButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { downloadFile } from "@/lib/fileUtils";
import { Type, Plus, Trash2 } from "lucide-react";

interface TextLayer {
  id: string;
  text: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  fontSize: number;
  fontFamily: string;
  color: string;
  backgroundColor: string;
  backgroundOpacity: number;
  bold: boolean;
  italic: boolean;
  textAlign: 'left' | 'center' | 'right';
}

export default function AddTextToImage() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [status, setStatus] = useState<ProcessingStatus>("idle");
  const [textLayers, setTextLayers] = useState<TextLayer[]>([
    {
      id: '1',
      text: 'Your Text Here',
      x: 50,
      y: 50,
      fontSize: 48,
      fontFamily: 'Arial',
      color: '#FFFFFF',
      backgroundColor: '#000000',
      backgroundOpacity: 0,
      bold: false,
      italic: false,
      textAlign: 'center',
    }
  ]);
  const [selectedLayerId, setSelectedLayerId] = useState<string>('1');
  const [processedBlob, setProcessedBlob] = useState<Blob | null>(null);
  const [processedPreview, setProcessedPreview] = useState<string | null>(null);
  const { toast } = useToast();

  const selectedLayer = textLayers.find(l => l.id === selectedLayerId);

  const handleFilesSelected = (uploadedFiles: UploadedFile[]) => {
    setFiles(uploadedFiles);
    setProcessedBlob(null);
    setProcessedPreview(null);
  };

  const addTextLayer = () => {
    const newId = String(Date.now());
    const newLayer: TextLayer = {
      id: newId,
      text: 'New Text',
      x: 50,
      y: 30,
      fontSize: 48,
      fontFamily: 'Arial',
      color: '#FFFFFF',
      backgroundColor: '#000000',
      backgroundOpacity: 0,
      bold: false,
      italic: false,
      textAlign: 'center',
    };
    setTextLayers([...textLayers, newLayer]);
    setSelectedLayerId(newId);
  };

  const removeTextLayer = (id: string) => {
    if (textLayers.length === 1) {
      toast({
        title: "Cannot Remove",
        description: "You must have at least one text layer",
        variant: "destructive",
      });
      return;
    }
    const newLayers = textLayers.filter(l => l.id !== id);
    setTextLayers(newLayers);
    if (selectedLayerId === id) {
      setSelectedLayerId(newLayers[0].id);
    }
  };

  const updateLayer = (id: string, updates: Partial<TextLayer>) => {
    setTextLayers(textLayers.map(l => l.id === id ? { ...l, ...updates } : l));
  };

  const handleApplyText = async () => {
    if (files.length === 0) {
      toast({
        title: "No File",
        description: "Please upload an image first",
        variant: "destructive",
      });
      return;
    }

    setStatus("processing");

    try {
      const img = new Image();
      const url = URL.createObjectURL(files[0].file);
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = url;
      });

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');

      canvas.width = img.width;
      canvas.height = img.height;

      // Draw original image
      ctx.drawImage(img, 0, 0);

      // Draw each text layer
      textLayers.forEach(layer => {
        const x = (layer.x / 100) * canvas.width;
        const y = (layer.y / 100) * canvas.height;
        
        // Set font properties
        let fontStyle = '';
        if (layer.italic) fontStyle += 'italic ';
        if (layer.bold) fontStyle += 'bold ';
        ctx.font = `${fontStyle}${layer.fontSize}px ${layer.fontFamily}`;
        ctx.textAlign = layer.textAlign;
        ctx.textBaseline = 'middle';

        // Draw background if opacity > 0
        if (layer.backgroundOpacity > 0) {
          const metrics = ctx.measureText(layer.text);
          const textWidth = metrics.width;
          const textHeight = layer.fontSize;
          const padding = 10;

          let bgX = x - padding;
          if (layer.textAlign === 'center') {
            bgX = x - textWidth / 2 - padding;
          } else if (layer.textAlign === 'right') {
            bgX = x - textWidth - padding;
          }

          ctx.fillStyle = layer.backgroundColor;
          ctx.globalAlpha = layer.backgroundOpacity / 100;
          ctx.fillRect(bgX, y - textHeight / 2 - padding, textWidth + padding * 2, textHeight + padding * 2);
          ctx.globalAlpha = 1;
        }

        // Draw text
        ctx.fillStyle = layer.color;
        ctx.fillText(layer.text, x, y);
      });

      URL.revokeObjectURL(url);

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Failed to create blob'));
          },
          files[0].file.type,
          0.92
        );
      });

      setProcessedBlob(blob);
      const previewUrl = URL.createObjectURL(blob);
      setProcessedPreview(previewUrl);

      setStatus("success");
      toast({
        title: "Success!",
        description: "Text added successfully",
      });
    } catch (error) {
      setStatus("error");
      toast({
        title: "Failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  const handleDownload = () => {
    if (!processedBlob || files.length === 0) return;

    const originalName = files[0].file.name;
    const extension = originalName.split('.').pop() || 'png';
    const baseName = originalName.replace(/\.[^/.]+$/, '');
    const newFilename = `${baseName}_with_text.${extension}`;

    downloadFile(processedBlob, newFilename);
  };

  const fontOptions = [
    "Arial",
    "Georgia",
    "Times New Roman",
    "Courier New",
    "Verdana",
    "Impact",
    "Comic Sans MS",
    "Trebuchet MS",
  ];

  const presets = [
    {
      name: "Bold Title",
      fontSize: 72,
      bold: true,
      color: "#FFFFFF",
      backgroundColor: "#000000",
      backgroundOpacity: 70,
    },
    {
      name: "Subtitle",
      fontSize: 36,
      italic: true,
      color: "#FFFFFF",
      backgroundOpacity: 0,
    },
    {
      name: "Caption",
      fontSize: 24,
      color: "#000000",
      backgroundColor: "#FFFFFF",
      backgroundOpacity: 80,
    },
  ];

  const applyPreset = (preset: typeof presets[0]) => {
    if (selectedLayer) {
      updateLayer(selectedLayer.id, preset);
    }
  };

  return (
    <ToolLayout
      title="Add Text to Image Online"
      description="Add custom text to images for free. Create memes, social media graphics, and photo captions. Customize fonts, colors, and positioning."
      category="Image Tools"
      keywords={["add text to image", "text on photo", "meme maker", "image caption", "text overlay"]}
      howToSteps={[
        { name: "Upload Image", text: "Click or drag and drop your image file" },
        { name: "Add Text", text: "Type your text and customize font, size, and color" },
        { name: "Position", text: "Adjust text position using the X and Y sliders" },
        { name: "Download", text: "Click Apply Text and download your image" },
      ]}
    >
      <div className="space-y-6">
        {/* File Upload */}
        <div className="backdrop-blur-md bg-white/70 border border-white/40 rounded-xl p-6 hover:bg-white/80 transition-all">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Type className="h-5 w-5 text-[#0B9F47]" />
            Upload Image
          </h2>
          <div>
            <FileUploader
              accept="image/*"
              maxFiles={1}
              maxSize={50 * 1024 * 1024}
              onFilesSelected={handleFilesSelected}
              multiple={false}
              allowedTypes={["image/jpeg", "image/png", "image/webp"]}
              data-testid="file-uploader"
            />
          </div>
        </div>

        {/* Text Layers */}
        {files.length > 0 && (
          <div className="backdrop-blur-md bg-white/70 border border-white/40 rounded-xl p-6 hover:bg-white/80 transition-all">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Text Layers</h2>
              <Button
                onClick={addTextLayer}
                size="sm"
                variant="outline"
                data-testid="button-add-layer"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Layer
              </Button>
            </div>
            <div className="space-y-4">
              {/* Layer Selector */}
              <div className="flex gap-2 flex-wrap">
                {textLayers.map((layer, index) => (
                  <div key={layer.id} className="flex items-center gap-1">
                    <Button
                      variant={selectedLayerId === layer.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedLayerId(layer.id)}
                      className={selectedLayerId === layer.id ? "bg-[#0B9F47] hover:bg-[#0B9F47]/90" : ""}
                      data-testid={`button-layer-${index + 1}`}
                    >
                      Layer {index + 1}
                    </Button>
                    {textLayers.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeTextLayer(layer.id)}
                        data-testid={`button-remove-layer-${index + 1}`}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              {selectedLayer && (
                <div className="space-y-6 pt-4 border-t">
                  {/* Quick Presets */}
                  <div>
                    <Label className="mb-3 block" data-testid="label-presets">Quick Presets</Label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      {presets.map((preset) => (
                        <Button
                          key={preset.name}
                          variant="outline"
                          size="sm"
                          onClick={() => applyPreset(preset)}
                          data-testid={`preset-${preset.name.toLowerCase().replace(/\s+/g, '-')}`}
                        >
                          {preset.name}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Text Input */}
                  <div className="space-y-2">
                    <Label htmlFor="text-input" data-testid="label-text">Text</Label>
                    <Input
                      id="text-input"
                      type="text"
                      value={selectedLayer.text}
                      onChange={(e) => updateLayer(selectedLayer.id, { text: e.target.value })}
                      placeholder="Enter your text"
                      data-testid="input-text"
                    />
                  </div>

                  {/* Position */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label data-testid="label-x-position">X Position: {selectedLayer.x}%</Label>
                      <Slider
                        value={[selectedLayer.x]}
                        onValueChange={(val) => updateLayer(selectedLayer.id, { x: val[0] })}
                        min={0}
                        max={100}
                        step={1}
                        data-testid="slider-x-position"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label data-testid="label-y-position">Y Position: {selectedLayer.y}%</Label>
                      <Slider
                        value={[selectedLayer.y]}
                        onValueChange={(val) => updateLayer(selectedLayer.id, { y: val[0] })}
                        min={0}
                        max={100}
                        step={1}
                        data-testid="slider-y-position"
                      />
                    </div>
                  </div>

                  {/* Font Size */}
                  <div className="space-y-2">
                    <Label data-testid="label-font-size">Font Size: {selectedLayer.fontSize}px</Label>
                    <Slider
                      value={[selectedLayer.fontSize]}
                      onValueChange={(val) => updateLayer(selectedLayer.id, { fontSize: val[0] })}
                      min={12}
                      max={200}
                      step={2}
                      data-testid="slider-font-size"
                    />
                  </div>

                  {/* Font Family */}
                  <div className="space-y-2">
                    <Label htmlFor="font-family" data-testid="label-font-family">Font</Label>
                    <Select
                      value={selectedLayer.fontFamily}
                      onValueChange={(val) => updateLayer(selectedLayer.id, { fontFamily: val })}
                    >
                      <SelectTrigger id="font-family" data-testid="select-font-family">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {fontOptions.map((font) => (
                          <SelectItem key={font} value={font} data-testid={`font-${font.toLowerCase().replace(/\s+/g, '-')}`}>
                            {font}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Text Color */}
                  <div className="space-y-2">
                    <Label data-testid="label-text-color">Text Color</Label>
                    <div className="flex gap-2 items-center">
                      <Input
                        type="color"
                        value={selectedLayer.color}
                        onChange={(e) => updateLayer(selectedLayer.id, { color: e.target.value })}
                        className="w-20 h-10"
                        data-testid="input-text-color"
                      />
                      <Input
                        type="text"
                        value={selectedLayer.color}
                        onChange={(e) => updateLayer(selectedLayer.id, { color: e.target.value })}
                        className="flex-1"
                        data-testid="input-text-color-hex"
                      />
                    </div>
                  </div>

                  {/* Text Alignment */}
                  <div className="space-y-2">
                    <Label htmlFor="text-align" data-testid="label-text-align">Text Alignment</Label>
                    <Select
                      value={selectedLayer.textAlign}
                      onValueChange={(val: any) => updateLayer(selectedLayer.id, { textAlign: val })}
                    >
                      <SelectTrigger id="text-align" data-testid="select-text-align">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="left" data-testid="align-left">Left</SelectItem>
                        <SelectItem value="center" data-testid="align-center">Center</SelectItem>
                        <SelectItem value="right" data-testid="align-right">Right</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Text Style */}
                  <div className="space-y-2">
                    <Label data-testid="label-text-style">Text Style</Label>
                    <div className="flex gap-4">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="bold"
                          checked={selectedLayer.bold}
                          onCheckedChange={(val) => updateLayer(selectedLayer.id, { bold: val })}
                          data-testid="switch-bold"
                        />
                        <Label htmlFor="bold" data-testid="label-bold">Bold</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="italic"
                          checked={selectedLayer.italic}
                          onCheckedChange={(val) => updateLayer(selectedLayer.id, { italic: val })}
                          data-testid="switch-italic"
                        />
                        <Label htmlFor="italic" data-testid="label-italic">Italic</Label>
                      </div>
                    </div>
                  </div>

                  {/* Background */}
                  <div className="space-y-4">
                    <Label data-testid="label-background">Text Background</Label>
                    <div className="space-y-2">
                      <Label data-testid="label-bg-opacity">Background Opacity: {selectedLayer.backgroundOpacity}%</Label>
                      <Slider
                        value={[selectedLayer.backgroundOpacity]}
                        onValueChange={(val) => updateLayer(selectedLayer.id, { backgroundOpacity: val[0] })}
                        min={0}
                        max={100}
                        step={5}
                        data-testid="slider-bg-opacity"
                      />
                    </div>
                    {selectedLayer.backgroundOpacity > 0 && (
                      <div className="flex gap-2 items-center">
                        <Input
                          type="color"
                          value={selectedLayer.backgroundColor}
                          onChange={(e) => updateLayer(selectedLayer.id, { backgroundColor: e.target.value })}
                          className="w-20 h-10"
                          data-testid="input-bg-color"
                        />
                        <Input
                          type="text"
                          value={selectedLayer.backgroundColor}
                          onChange={(e) => updateLayer(selectedLayer.id, { backgroundColor: e.target.value })}
                          className="flex-1"
                          data-testid="input-bg-color-hex"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Apply Button */}
              <Button
                onClick={handleApplyText}
                className="w-full bg-[#0B9F47] hover:bg-[#0B9F47]/90 text-white"
                size="lg"
                disabled={status === "processing"}
                data-testid="button-apply"
              >
                Apply Text
              </Button>
            </div>
          </div>
        )}

        {/* Processing Status */}
        {status !== "idle" && (
          <ProcessingIndicator
            status={status}
            message="Adding text..."
            successMessage="Text added successfully!"
            errorMessage="Failed to add text. Please try again."
          />
        )}

        {/* Preview and Download */}
        {processedBlob && processedPreview && (
          <div className="backdrop-blur-md bg-white/70 border border-white/40 rounded-xl p-6 hover:bg-white/80 transition-all">
            <h2 className="text-xl font-bold mb-4">Result</h2>
            <div className="space-y-4">
              {/* Preview */}
              <div className="border rounded-lg p-4 bg-gray-50">
                <p className="text-sm font-medium mb-2" data-testid="label-preview">Preview</p>
                <img
                  src={processedPreview}
                  alt="Preview with text"
                  className="max-w-full h-auto mx-auto"
                  data-testid="preview-image"
                />
              </div>

              {/* File Size Comparison */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg" data-testid="stat-original">
                  <p className="text-sm text-blue-900 mb-1">Original</p>
                  <p className="text-xs text-blue-600" data-testid="text-original-size">
                    {(files[0].file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg" data-testid="stat-processed">
                  <p className="text-sm text-green-900 mb-1">With Text</p>
                  <p className="text-xs text-green-600" data-testid="text-processed-size">
                    {(processedBlob.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>

              {/* Download Button */}
              <DownloadButton
                onClick={handleDownload}
                className="w-full bg-[#0B9F47] hover:bg-[#0B9F47]/90 text-white"
                size="lg"
              >
                Download Image with Text
              </DownloadButton>
            </div>
          </div>
        )}

        {/* Information */}
        <div className="backdrop-blur-md bg-white/70 border border-white/40 rounded-xl p-6 hover:bg-white/80 transition-all">
          <h2 className="text-xl font-bold mb-4">About Adding Text to Images</h2>
          <div className="prose prose-sm max-w-none">
            <p>
              Add custom text to your images for free. Perfect for creating:
            </p>
            <ul>
              <li><strong>Social Media Posts:</strong> Add captions and titles to images</li>
              <li><strong>Memes:</strong> Create funny memes with custom text</li>
              <li><strong>Quotes:</strong> Add inspirational quotes to photos</li>
              <li><strong>Thumbnails:</strong> Create eye-catching YouTube or blog thumbnails</li>
              <li><strong>Event Graphics:</strong> Add event details to promotional images</li>
            </ul>
            <p className="text-sm text-gray-600 mt-4">
              <strong>Pro Tips:</strong>
              <br />• Use multiple layers for complex designs
              <br />• Add backgrounds to text for better readability
              <br />• Use bold fonts for headlines, italic for subtitles
              <br />• Position text at 10-90% for better composition
            </p>
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}
