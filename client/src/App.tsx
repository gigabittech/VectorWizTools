import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { ModalsProvider } from '@mantine/modals';
import { theme, darkTheme } from './lib/theme';
import { ColorSchemeProvider, useColorScheme } from './lib/color-scheme';
import Layout from "@/components/layout/Layout";
import NotFound from "@/pages/not-found";
import Homepage from "@/pages/homepage";
import Tools from "@/pages/tools";
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
import FontToVector from "@/pages/tools/font-to-vector";

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Homepage} />
        <Route path="/tools" component={Tools} />
        <Route path="/tools/dpi-calculator" component={DPICalculator} />
        <Route path="/tools/turnaround-estimator" component={TurnaroundEstimator} />
        <Route path="/tools/vector-checker" component={VectorChecker} />
        <Route path="/tools/format-converter" component={FormatConverter} />
        <Route path="/tools/color-extractor" component={ColorExtractor} />
        <Route path="/tools/file-size-calculator" component={FileSizeCalculator} />
        <Route path="/tools/print-size-calculator" component={PrintSizeCalculator} />
        <Route path="/tools/logo-dimensions" component={LogoDimensions} />
        <Route path="/tools/vector-simplifier" component={VectorSimplifier} />
        <Route path="/tools/aspect-ratio-calculator" component={AspectRatioCalculator} />
        <Route path="/tools/font-to-vector" component={FontToVector} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
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
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
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
