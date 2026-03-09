import { Switch, Route, useLocation } from "wouter";
import { queryClient, BASE_PATH } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { MantineProvider, Loader } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { ModalsProvider } from '@mantine/modals';
import { theme, darkTheme } from './lib/theme';
import { ColorSchemeProvider, useColorScheme } from './lib/color-scheme';
import Layout from "@/components/layout/Layout";
import NotFound from "@/pages/not-found";
import ToolsLandingPage from "@/pages/ToolsLandingPage";
import DPICalculator from "@/pages/tools/dpi-calculator";
import TurnaroundEstimator from "@/pages/tools/turnaround-estimator";
import VectorChecker from "@/pages/tools/vector-checker";
import FormatConverter from "@/pages/tools/format-converter";
import ColorExtractor from "@/pages/tools/color-extractor";
import FileSizeCalculator from "@/pages/tools/file-size-calculator";
import PrintSizeCalculator from "@/pages/tools/print-size-calculator";
import LogoDimensions from "@/pages/tools/logo-dimensions";
import VectorSimplifier from "@/pages/tools/vector-simplifier";
import AspectRatioCalculator from "@/pages/tools/aspect-ratio-calculator";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import LoginPage from "@/pages/auth/login";
import FontToVector from "@/pages/tools/font-to-vector";
import ImageResizer from "@/pages/tools/image-resizer";
import ImageCompressor from "@/pages/tools/image-compressor";
import ImageCropper from "@/pages/tools/image-cropper";
import ImageRotator from "@/pages/tools/image-rotator";
import ImageFilter from "@/pages/tools/image-filter";
import ImageWatermark from "@/pages/tools/image-watermark";
import ImageBorder from "@/pages/tools/image-border";
import ColorPaletteExtractor from "@/pages/tools/color-palette-extractor";
import ImageToBase64 from "@/pages/tools/image-to-base64";
import ImageComparison from "@/pages/tools/image-comparison";
import AddTextToImage from "@/pages/tools/add-text-to-image";
import MakeRoundImage from "@/pages/tools/make-round-image";
import AIImageGenerator from "@/pages/tools/ai-image-generator";
// Unified background tool
import PDFToJPG from "@/pages/tools/pdf-to-jpg";
import ImageUpscale from "@/pages/tools/image-upscale";
import RemoveWatermark from "@/pages/tools/remove-watermark";
import ImageToText from "@/pages/tools/image-to-text";
import RemoveObjects from "@/pages/tools/remove-objects";
import ProfilePhotoMaker from "@/pages/tools/profile-photo-maker";
import ChangeBackground from "@/pages/tools/change-background";
import ColorizePhoto from "@/pages/tools/colorize-photo";
import CombineImages from "@/pages/tools/combine-images";
import FileToSVG from "@/pages/tools/file-to-svg";
import TranslateImage from "@/pages/tools/translate-image";
import PostableImage from "@/pages/tools/postable-image";
import CollageMaker from "@/pages/tools/collage-maker";
import ChartMaker from "@/pages/tools/chart-maker";
import ImageSplitter from "@/pages/tools/image-splitter";
import MergePDF from "@/pages/tools/merge-pdf";
import SplitPDF from "@/pages/tools/split-pdf";
import JPGToPDF from "@/pages/tools/jpg-to-pdf";
import CompressPDF from "@/pages/tools/compress-pdf";
import ProtectPDF from "@/pages/tools/protect-pdf";
import RotatePDF from "@/pages/tools/rotate-pdf";
import EditPDF from "@/pages/tools/edit-pdf";
import PDFToWord from "@/pages/tools/pdf-to-word";
import WordToPDF from "@/pages/tools/word-to-pdf";
import UnlockPDF from "@/pages/tools/unlock-pdf";
import PDFToExcel from "@/pages/tools/pdf-to-excel";
import PDFToPowerpoint from "@/pages/tools/pdf-to-powerpoint";
import PNGToPDF from "@/pages/tools/png-to-pdf";
import EPUBToPDF from "@/pages/tools/epub-to-pdf";
import CropPDF from "@/pages/tools/crop-pdf";
import PDFTranslator from "@/pages/tools/pdf-translator";
import PowerpointToPDF from "@/pages/tools/powerpoint-to-pdf";
import PDFToEPUB from "@/pages/tools/pdf-to-epub";
import PDFToPNG from "@/pages/tools/pdf-to-png";
import DeletePDFPages from "@/pages/tools/delete-pdf-pages";
import URLToPDF from "@/pages/tools/url-to-pdf";
import RearrangePDF from "@/pages/tools/rearrange-pdf";
import ExtractImagesPDF from "@/pages/tools/extract-images-pdf";
import ESignPDF from "@/pages/tools/esign-pdf";
import CreatePDF from "@/pages/tools/create-pdf";
import PDFWatermarkRemover from "@/pages/tools/pdf-watermark-remover";
import PDFToCSV from "@/pages/tools/pdf-to-csv";
import AddPageNumbersPDF from "@/pages/tools/add-page-numbers-pdf";
import AddWatermarkPDF from "@/pages/tools/add-watermark-pdf";
import ImagesToPDF from "@/pages/tools/images-to-pdf";
import HEICToPDF from "@/pages/tools/heic-to-pdf";
import AddTextPDF from "@/pages/tools/add-text-pdf";
import AnnotatePDF from "@/pages/tools/annotate-pdf";
import TIFFToPDF from "@/pages/tools/tiff-to-pdf";
import MOBIToPDF from "@/pages/tools/mobi-to-pdf";
import PDFToMOBI from "@/pages/tools/pdf-to-mobi";
import PDFToTIFF from "@/pages/tools/pdf-to-tiff";
import AZW3ToPDF from "@/pages/tools/azw3-to-pdf";
import WEBPToPDF from "@/pages/tools/webp-to-pdf";
import PDFToAZW3 from "@/pages/tools/pdf-to-azw3";
import MSOutlookToPDF from "@/pages/tools/ms-outlook-to-pdf";
import PDFToText from "@/pages/tools/pdf-to-text";
import GIFToPDF from "@/pages/tools/gif-to-pdf";
import ExtractTextPDF from "@/pages/tools/extract-text-pdf";
import EPSToPDF from "@/pages/tools/eps-to-pdf";
import PNGtoJPG from "./pages/tools/png-to-jpg";
import WEBPtoJPG from "@/pages/tools/webp-to-jpg";
import JPGtoPNG from "@/pages/tools/jpg-to-png";
import SVGtoPNG from "@/pages/tools/svg-to-png";
import TIFFtoJPG from "@/pages/tools/tiff-to-jpg";
import PNGtoGIF from "@/pages/tools/png-to-gif";
import EPStoJPG from "@/pages/tools/eps-to-jpg";
import BMPtoJPG from "@/pages/tools/bmp-to-jpg";
import PNGtoBMP from "@/pages/tools/png-to-bmp";
import HEICtoJPG from "@/pages/tools/heic-to-jpg";
import VSDtoJPG from "@/pages/tools/vsd-to-jpg";
import PNGtoSVG from "./pages/tools/image_tools/png-to-svg";
import JPGtoSVG from "./pages/tools/image_tools/jpg-to-svg";
import PDFtoSVG from "./pages/tools/image_tools/pdf-to-svg";
import JPGtoVSDX from "./pages/tools/image_tools/jpg-to-vsdx";
import VSDXtoJPG from "./pages/tools/image_tools/vsdx-to-jpg";
import PNGtoWebP from "./pages/tools/image_tools/png-to-webp";
import JPGtoWebP from "./pages/tools/image_tools/jpg-to-webp";
import Dashboard from "@/pages/dashboard";
import ToolsManagement from "@/pages/toolsManagement";
import SeoRedirects from "@/pages/SeoRedirects";

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader color="green" />
      </div>
    );
  }

  if (!user) {
    setTimeout(() => setLocation(`${BASE_PATH}/login`), 0);
    return null;
  }

  return <Component />;
}


const COMPONENT_MAP: Record<string, React.ComponentType> = {
  DPICalculator,
  TurnaroundEstimator,
  VectorChecker,
  FormatConverter,
  ColorExtractor,
  FileSizeCalculator,
  PrintSizeCalculator,
  LogoDimensions,
  VectorSimplifier,
  AspectRatioCalculator,
  FontToVector,
  ImageResizer,
  ImageCompressor,
  ImageCropper,
  ImageRotator,
  ImageFilter,
  ImageWatermark,
  ImageBorder,
  ColorPaletteExtractor,
  ImageToBase64,
  ImageComparison,
  AddTextToImage,
  MakeRoundImage,
  AIImageGenerator,
  RemoveBackgroundTool: ChangeBackground,
  PDFToJPG,
  ImageUpscale,
  RemoveWatermark,
  ImageToText,
  RemoveObjects,
  ProfilePhotoMaker,
  BlurBackground: ChangeBackground,
  ColorizePhoto,
  CombineImages,
  MakeBackgroundTransparent: ChangeBackground,
  FileToSVG,
  TranslateImage,
  PostableImage,
  CollageMaker,
  ChartMaker,
  ImageSplitter,
  MergePDF,
  SplitPDF,
  JPGToPDF,
  CompressPDF,
  ProtectPDF,
  RotatePDF,
  EditPDF,
  PDFToWord,
  ChangeBackground,
  WordToPDF,
  UnlockPDF,
  PDFToExcel,
  PDFToPowerpoint,
  PNGToPDF,
  EPUBToPDF,
  CropPDF,
  PDFTranslator,
  PowerpointToPDF,
  PDFToEPUB,
  PDFToPNG,
  DeletePDFPages,
  URLToPDF,
  RearrangePDF,
  ExtractImagesPDF,
  ESignPDF,
  CreatePDF,
  PDFWatermarkRemover,
  PDFToCSV,
  AddPageNumbersPDF,
  AddWatermarkPDF,
  ImagesToPDF,
  HEICToPDF,
  AddTextPDF,
  AnnotatePDF,
  TIFFToPDF,
  MOBIToPDF,
  PDFToMOBI,
  PDFToTIFF,
  AZW3ToPDF,
  WEBPToPDF,
  PDFToAZW3,
  MSOutlookToPDF,
  PDFToText,
  GIFToPDF,
  ExtractTextPDF,
  EPSToPDF,
  PNGtoJPG,
  WEBPtoJPG,
  JPGtoPNG,
  SVGtoPNG,
  TIFFtoJPG,
  PNGtoGIF,
  EPStoJPG,
  BMPtoJPG,
  PNGtoBMP,
  HEICtoJPG,
  VSDtoJPG,
  PNGtoSVG,
  JPGtoSVG,
  PDFtoSVG,
  JPGtoVSDX,
  VSDXtoJPG,
  PNGtoWebP,
  JPGtoWebP,
};

function Router() {
  const { data: tools, isLoading } = useQuery<any[]>({
    queryKey: ["/api/tools"],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader color="green" />
      </div>
    );
  }

  console.log(tools, "heres are tools");

  return (
    <Switch>
      <Route path={`${BASE_PATH}/login`} component={LoginPage} />

      {/* Admin Routes (Uses separate AdminLayout internally) */}
      <Route path="/tools/admin/dashboard">
        {() => <ProtectedRoute component={Dashboard} />}
      </Route>
      <Route path="/tools/admin/management">
        {() => <ProtectedRoute component={ToolsManagement} />}
      </Route>
      <Route path="/tools/admin/seo-redirects">
        {() => <ProtectedRoute component={SeoRedirects} />}
      </Route>

      {/* Main Project Routes (Wrapped in standard Layout) */}
      <Route>
        <Layout>
          <Switch>
            <Route path="/" component={ToolsLandingPage} />

            {/* Dynamic Tool Routes */}
            {tools?.map((tool) => {
              const Component = COMPONENT_MAP[tool.tool_component];
              if (!Component) return null;
              return (
                <Route
                  key={tool.id}
                  path={`/tools/${tool.slug || tool.tool_id}`}
                  component={Component as any}
                />
              );
            })}

            <Route component={NotFound} />
          </Switch>
        </Layout>
      </Route>
    </Switch>
  );
}

function ThemedApp() {
  const { colorScheme } = useColorScheme();
  const currentTheme = colorScheme === 'dark' ? darkTheme : theme;

  return (
    <MantineProvider theme={currentTheme} forceColorScheme={colorScheme}>
      <Notifications />
      <ModalsProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <TooltipProvider>
              <Toaster />
              <Router />
            </TooltipProvider>
          </AuthProvider>
        </QueryClientProvider>
      </ModalsProvider>
    </MantineProvider>
  );
}

function App() {
  return (
    <ColorSchemeProvider>
      <ThemedApp />
    </ColorSchemeProvider>
  );
}

export default App;
