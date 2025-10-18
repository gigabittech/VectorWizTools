import { useState } from "react";
import ToolLayout from "@/components/tools/shared/ToolLayout";
import FileUploader, { UploadedFile } from "@/components/tools/shared/FileUploader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { getImageDimensions } from "@/lib/fileUtils";
import { Combine } from "lucide-react";

export default function ImageComparison() {
  const [image1Files, setImage1Files] = useState<UploadedFile[]>([]);
  const [image2Files, setImage2Files] = useState<UploadedFile[]>([]);
  const [splitPosition, setSplitPosition] = useState([50]);
  const [viewMode, setViewMode] = useState<"side-by-side" | "slider">("side-by-side");
  const [image1Dims, setImage1Dims] = useState<{width: number; height: number} | null>(null);
  const [image2Dims, setImage2Dims] = useState<{width: number; height: number} | null>(null);
  const { toast } = useToast();

  const handleImage1Selected = async (uploadedFiles: UploadedFile[]) => {
    setImage1Files(uploadedFiles);
    if (uploadedFiles.length > 0) {
      try {
        const dims = await getImageDimensions(uploadedFiles[0].file);
        setImage1Dims(dims);
      } catch (error) {
        console.error("Failed to get image dimensions:", error);
      }
    }
  };

  const handleImage2Selected = async (uploadedFiles: UploadedFile[]) => {
    setImage2Files(uploadedFiles);
    if (uploadedFiles.length > 0) {
      try {
        const dims = await getImageDimensions(uploadedFiles[0].file);
        setImage2Dims(dims);
      } catch (error) {
        console.error("Failed to get image dimensions:", error);
      }
    }
  };

  const handleSwapImages = () => {
    const temp = image1Files;
    setImage1Files(image2Files);
    setImage2Files(temp);

    const tempDims = image1Dims;
    setImage1Dims(image2Dims);
    setImage2Dims(tempDims);

    toast({
      title: "Swapped!",
      description: "Images swapped successfully",
    });
  };

  const hasImages = image1Files.length > 0 && image2Files.length > 0;

  return (
    <ToolLayout
      title="Image Comparison Tool"
      description="Compare two images side by side online for free. Perfect for before/after comparisons, A/B testing, and design reviews. Interactive slider view available."
      category="Image Tools"
      keywords={["compare images", "image comparison", "before after", "ab testing", "side by side"]}
      howToSteps={[
        { name: "Upload First Image", text: "Click or drag and drop your first image (Before)" },
        { name: "Upload Second Image", text: "Upload the second image for comparison (After)" },
        { name: "Choose View Mode", text: "Select side-by-side or slider view" },
        { name: "Compare", text: "Use the slider to compare images interactively" },
      ]}
    >
      <div className="space-y-6">
        {/* File Upload - Image 1 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Combine className="h-5 w-5 text-[#0B9F47]" />
              Image 1 (Before)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FileUploader
              accept="image/*"
              maxFiles={1}
              maxSize={50 * 1024 * 1024}
              onFilesSelected={handleImage1Selected}
              multiple={false}
              allowedTypes={["image/jpeg", "image/png", "image/webp"]}
              data-testid="file-uploader-1"
            />
            {image1Dims && (
              <p className="text-sm text-gray-600 mt-2" data-testid="text-image1-dims">
                Dimensions: {image1Dims.width} × {image1Dims.height}px
              </p>
            )}
          </CardContent>
        </Card>

        {/* File Upload - Image 2 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Combine className="h-5 w-5 text-[#0B9F47]" />
              Image 2 (After)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FileUploader
              accept="image/*"
              maxFiles={1}
              maxSize={50 * 1024 * 1024}
              onFilesSelected={handleImage2Selected}
              multiple={false}
              allowedTypes={["image/jpeg", "image/png", "image/webp"]}
              data-testid="file-uploader-2"
            />
            {image2Dims && (
              <p className="text-sm text-gray-600 mt-2" data-testid="text-image2-dims">
                Dimensions: {image2Dims.width} × {image2Dims.height}px
              </p>
            )}
          </CardContent>
        </Card>

        {/* Swap Button */}
        {hasImages && (
          <Button
            onClick={handleSwapImages}
            variant="outline"
            className="w-full"
            data-testid="button-swap"
          >
            <Combine className="h-4 w-4 mr-2" />
            Swap Images
          </Button>
        )}

        {/* Comparison View */}
        {hasImages && (
          <Card>
            <CardHeader>
              <CardTitle>Comparison</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* View Mode Selection */}
              <div className="space-y-2">
                <Label data-testid="label-view-mode">View Mode</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={viewMode === "side-by-side" ? "default" : "outline"}
                    onClick={() => setViewMode("side-by-side")}
                    className={viewMode === "side-by-side" ? "bg-[#0B9F47] hover:bg-[#0B9F47]/90" : ""}
                    data-testid="button-side-by-side"
                  >
                    Side by Side
                  </Button>
                  <Button
                    variant={viewMode === "slider" ? "default" : "outline"}
                    onClick={() => setViewMode("slider")}
                    className={viewMode === "slider" ? "bg-[#0B9F47] hover:bg-[#0B9F47]/90" : ""}
                    data-testid="button-slider"
                  >
                    Slider View
                  </Button>
                </div>
              </div>

              {/* Side by Side View */}
              {viewMode === "side-by-side" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-testid="view-side-by-side">
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <p className="text-sm font-medium mb-2 text-center" data-testid="label-before">Before</p>
                    <img
                      src={image1Files[0].preview}
                      alt="Before"
                      className="max-w-full h-auto mx-auto"
                      data-testid="preview-image1"
                    />
                  </div>
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <p className="text-sm font-medium mb-2 text-center" data-testid="label-after">After</p>
                    <img
                      src={image2Files[0].preview}
                      alt="After"
                      className="max-w-full h-auto mx-auto"
                      data-testid="preview-image2"
                    />
                  </div>
                </div>
              )}

              {/* Slider View */}
              {viewMode === "slider" && (
                <div className="space-y-4" data-testid="view-slider">
                  <div className="relative border rounded-lg overflow-hidden bg-gray-50" style={{ aspectRatio: '16/9' }}>
                    <div className="relative w-full h-full">
                      {/* Image 1 (Before) - Full width */}
                      <div className="absolute inset-0">
                        <img
                          src={image1Files[0].preview}
                          alt="Before"
                          className="w-full h-full object-contain"
                          data-testid="slider-image1"
                        />
                      </div>

                      {/* Image 2 (After) - Clipped */}
                      <div
                        className="absolute inset-0 overflow-hidden"
                        style={{ clipPath: `inset(0 0 0 ${splitPosition[0]}%)` }}
                      >
                        <img
                          src={image2Files[0].preview}
                          alt="After"
                          className="w-full h-full object-contain"
                          data-testid="slider-image2"
                        />
                      </div>

                      {/* Divider Line */}
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg"
                        style={{ left: `${splitPosition[0]}%` }}
                        data-testid="slider-divider"
                      >
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center">
                          <Combine className="h-5 w-5 text-gray-700" />
                        </div>
                      </div>

                      {/* Labels */}
                      <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded text-sm font-medium" data-testid="label-slider-before">
                        Before
                      </div>
                      <div className="absolute top-4 right-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded text-sm font-medium" data-testid="label-slider-after">
                        After
                      </div>
                    </div>
                  </div>

                  {/* Slider Control */}
                  <div className="space-y-2">
                    <Label data-testid="label-split-position">
                      Split Position: {splitPosition[0]}%
                    </Label>
                    <Slider
                      value={splitPosition}
                      onValueChange={setSplitPosition}
                      min={0}
                      max={100}
                      step={1}
                      className="w-full"
                      data-testid="slider-split-position"
                    />
                  </div>
                </div>
              )}

              {/* Image Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg" data-testid="stat-image1">
                  <p className="text-sm text-blue-900 mb-1">Image 1 (Before)</p>
                  {image1Dims && (
                    <p className="text-xs text-blue-600" data-testid="text-image1-details">
                      {image1Dims.width} × {image1Dims.height}px<br />
                      {(image1Files[0].file.size / 1024).toFixed(1)} KB
                    </p>
                  )}
                </div>
                <div className="bg-green-50 p-4 rounded-lg" data-testid="stat-image2">
                  <p className="text-sm text-green-900 mb-1">Image 2 (After)</p>
                  {image2Dims && (
                    <p className="text-xs text-green-600" data-testid="text-image2-details">
                      {image2Dims.width} × {image2Dims.height}px<br />
                      {(image2Files[0].file.size / 1024).toFixed(1)} KB
                    </p>
                  )}
                </div>
              </div>

              {/* Dimension Warning */}
              {image1Dims && image2Dims && (image1Dims.width !== image2Dims.width || image1Dims.height !== image2Dims.height) && (
                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> Images have different dimensions. For best comparison results, use images with the same dimensions.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Information */}
        <Card>
          <CardHeader>
            <CardTitle>About Image Comparison</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            <p>
              Compare two images side by side with our free online tool. Perfect for:
            </p>
            <ul>
              <li><strong>Before/After Photos:</strong> Show transformations and improvements</li>
              <li><strong>Design Reviews:</strong> Compare design iterations and mockups</li>
              <li><strong>A/B Testing:</strong> Evaluate different design variations</li>
              <li><strong>Quality Checks:</strong> Compare original vs processed images</li>
              <li><strong>Photo Editing:</strong> See the impact of your edits</li>
            </ul>
            <h3 className="text-base font-semibold mt-4 mb-2">View Modes:</h3>
            <ul className="text-sm">
              <li><strong>Side by Side:</strong> View both images at once for easy comparison</li>
              <li><strong>Slider:</strong> Interactive slider to reveal before/after with smooth transition</li>
            </ul>
            <p className="text-sm text-gray-600 mt-4">
              <strong>Pro Tip:</strong> For best results, use images with identical dimensions. The slider view works best when images are aligned.
            </p>
          </CardContent>
        </Card>
      </div>
    </ToolLayout>
  );
}
