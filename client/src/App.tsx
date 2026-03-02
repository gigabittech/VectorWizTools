import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
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
import RemoveBackgroundTool from "@/pages/tools/remove-background";
import PDFToJPG from "@/pages/tools/pdf-to-jpg";
import ImageUpscale from "@/pages/tools/image-upscale";
import RemoveWatermark from "@/pages/tools/remove-watermark";
import ImageToText from "@/pages/tools/image-to-text";
import RemoveObjects from "@/pages/tools/remove-objects";
import ProfilePhotoMaker from "@/pages/tools/profile-photo-maker";
import BlurBackground from "@/pages/tools/blur-background";
import ColorizePhoto from "@/pages/tools/colorize-photo";
import CombineImages from "@/pages/tools/combine-images";
import MakeBackgroundTransparent from "@/pages/tools/make-background-transparent";
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
import ChangeBackground from "@/pages/tools/change-background";
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
    setTimeout(() => setLocation("/login"), 0);
    return null;
  }

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={LoginPage} />

      {/* Admin Routes (Uses separate AdminLayout internally) */}
      <Route path="/tools/admin/dashboard">
        {() => <ProtectedRoute component={Dashboard} />}
      </Route>
      <Route path="/tools/admin/management">
        {() => <ProtectedRoute component={ToolsManagement} />}
      </Route>

      {/* Main Project Routes (Wrapped in standard Layout) */}
      <Route>
        <Layout>
          <Switch>
            <Route path="/" component={ToolsLandingPage} />
            <Route path="/tools/dpi-calculator" component={DPICalculator} />
            <Route path="/tools/turnaround-estimator" component={TurnaroundEstimator} />
            <Route path="/tools/vector-checker" component={VectorChecker} />
            <Route path="/tools/format-converter" component={FormatConverter} />
            <Route path="/tools/png-to-jpg" component={PNGtoJPG} />
            <Route path="/tools/png-to-svg" component={PNGtoSVG} />
            <Route path="/tools/jpg-to-svg" component={JPGtoSVG} />
            <Route path="/tools/eps-to-jpg" component={EPStoJPG} />
            <Route path="/tools/pdf-to-svg" component={PDFtoSVG} />
            <Route path="/tools/jpg-to-vsdx" component={JPGtoVSDX} />
            <Route path="/tools/png-to-webp" component={PNGtoWebP} />
            <Route path="/tools/jpg-to-webp" component={JPGtoWebP} />
            <Route path="/tools/vsdx-to-jpg" component={VSDXtoJPG} />
            <Route path="/tools/bmp-to-jpg" component={BMPtoJPG} />
            <Route path="/tools/png-to-bmp" component={PNGtoBMP} />
            <Route path="/tools/heic-to-jpg" component={HEICtoJPG} />
            <Route path="/tools/vsd-to-jpg" component={VSDtoJPG} />
            <Route path="/tools/color-extractor" component={ColorExtractor} />
            <Route path="/tools/file-size-calculator" component={FileSizeCalculator} />
            <Route path="/tools/print-size-calculator" component={PrintSizeCalculator} />
            <Route path="/tools/logo-dimensions" component={LogoDimensions} />
            <Route path="/tools/vector-simplifier" component={VectorSimplifier} />
            <Route path="/tools/aspect-ratio-calculator" component={AspectRatioCalculator} />
            <Route path="/tools/font-to-vector" component={FontToVector} />
            <Route path="/tools/image-resizer" component={ImageResizer} />
            <Route path="/tools/image-compressor" component={ImageCompressor} />
            <Route path="/tools/image-cropper" component={ImageCropper} />
            <Route path="/tools/image-rotator" component={ImageRotator} />
            <Route path="/tools/image-filter" component={ImageFilter} />
            <Route path="/tools/image-watermark" component={ImageWatermark} />
            <Route path="/tools/image-border" component={ImageBorder} />
            <Route path="/tools/color-palette-extractor" component={ColorPaletteExtractor} />
            <Route path="/tools/image-to-base64" component={ImageToBase64} />
            <Route path="/tools/image-comparison" component={ImageComparison} />
            <Route path="/tools/add-text-to-image" component={AddTextToImage} />
            <Route path="/tools/make-round-image" component={MakeRoundImage} />
            <Route path="/tools/ai-image-generator" component={AIImageGenerator} />
            <Route path="/tools/remove-background" component={RemoveBackgroundTool} />
            <Route path="/tools/pdf-to-jpg" component={PDFToJPG} />
            <Route path="/tools/image-upscale" component={ImageUpscale} />
            <Route path="/tools/remove-watermark" component={RemoveWatermark} />
            <Route path="/tools/image-to-text" component={ImageToText} />
            <Route path="/tools/remove-objects" component={RemoveObjects} />
            <Route path="/tools/profile-photo-maker" component={ProfilePhotoMaker} />
            <Route path="/tools/blur-background" component={BlurBackground} />
            <Route path="/tools/colorize-photo" component={ColorizePhoto} />
            <Route path="/tools/combine-images" component={CombineImages} />
            <Route path="/tools/make-background-transparent" component={MakeBackgroundTransparent} />
            <Route path="/tools/file-to-svg" component={FileToSVG} />
            <Route path="/tools/translate-image" component={TranslateImage} />
            <Route path="/tools/postable-image" component={PostableImage} />
            <Route path="/tools/collage-maker" component={CollageMaker} />
            <Route path="/tools/chart-maker" component={ChartMaker} />
            <Route path="/tools/image-splitter" component={ImageSplitter} />
            <Route path="/tools/merge-pdf" component={MergePDF} />
            <Route path="/tools/split-pdf" component={SplitPDF} />
            <Route path="/tools/jpg-to-pdf" component={JPGToPDF} />
            <Route path="/tools/compress-pdf" component={CompressPDF} />
            <Route path="/tools/protect-pdf" component={ProtectPDF} />
            <Route path="/tools/rotate-pdf" component={RotatePDF} />
            <Route path="/tools/edit-pdf" component={EditPDF} />
            <Route path="/tools/pdf-to-word" component={PDFToWord} />
            <Route path="/tools/change-background" component={ChangeBackground} />
            <Route path="/tools/word-to-pdf" component={WordToPDF} />
            <Route path="/tools/unlock-pdf" component={UnlockPDF} />
            <Route path="/tools/pdf-to-excel" component={PDFToExcel} />
            <Route path="/tools/pdf-to-powerpoint" component={PDFToPowerpoint} />
            <Route path="/tools/png-to-pdf" component={PNGToPDF} />
            <Route path="/tools/epub-to-pdf" component={EPUBToPDF} />
            <Route path="/tools/crop-pdf" component={CropPDF} />
            <Route path="/tools/pdf-translator" component={PDFTranslator} />
            <Route path="/tools/powerpoint-to-pdf" component={PowerpointToPDF} />
            <Route path="/tools/pdf-to-epub" component={PDFToEPUB} />
            <Route path="/tools/pdf-to-png" component={PDFToPNG} />
            <Route path="/tools/delete-pdf-pages" component={DeletePDFPages} />
            <Route path="/tools/url-to-pdf" component={URLToPDF} />
            <Route path="/tools/rearrange-pdf" component={RearrangePDF} />
            <Route path="/tools/extract-images-pdf" component={ExtractImagesPDF} />
            <Route path="/tools/esign-pdf" component={ESignPDF} />
            <Route path="/tools/create-pdf" component={CreatePDF} />
            <Route path="/tools/pdf-watermark-remover" component={PDFWatermarkRemover} />
            <Route path="/tools/pdf-to-csv" component={PDFToCSV} />
            <Route path="/tools/add-page-numbers-pdf" component={AddPageNumbersPDF} />
            <Route path="/tools/add-watermark-pdf" component={AddWatermarkPDF} />
            <Route path="/tools/images-to-pdf" component={ImagesToPDF} />
            <Route path="/tools/heic-to-pdf" component={HEICToPDF} />
            <Route path="/tools/add-text-pdf" component={AddTextPDF} />
            <Route path="/tools/annotate-pdf" component={AnnotatePDF} />
            <Route path="/tools/tiff-to-pdf" component={TIFFToPDF} />
            <Route path="/tools/mobi-to-pdf" component={MOBIToPDF} />
            <Route path="/tools/pdf-to-mobi" component={PDFToMOBI} />
            <Route path="/tools/pdf-to-tiff" component={PDFToTIFF} />
            <Route path="/tools/azw3-to-pdf" component={AZW3ToPDF} />
            <Route path="/tools/webp-to-pdf" component={WEBPToPDF} />
            <Route path="/tools/pdf-to-azw3" component={PDFToAZW3} />
            <Route path="/tools/ms-outlook-to-pdf" component={MSOutlookToPDF} />
            <Route path="/tools/pdf-to-text" component={PDFToText} />
            <Route path="/tools/gif-to-pdf" component={GIFToPDF} />
            <Route path="/tools/extract-text-pdf" component={ExtractTextPDF} />
            <Route path="/tools/eps-to-pdf" component={EPSToPDF} />
            <Route path="/tools/webp-to-jpg" component={WEBPtoJPG} />
            <Route path="/tools/jpg-to-png" component={JPGtoPNG} />
            <Route path="/tools/svg-to-png" component={SVGtoPNG} />
            <Route path="/tools/tiff-to-jpg" component={TIFFtoJPG} />
            <Route path="/tools/png-to-gif" component={PNGtoGIF} />
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
