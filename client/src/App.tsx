import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "./lib/auth";
import { WebSocketProvider } from "./lib/websocket";
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { ModalsProvider } from '@mantine/modals';
import { theme, darkTheme } from './lib/theme';
import { ColorSchemeProvider, useColorScheme } from './lib/color-scheme';
import Layout from "@/components/layout/Layout";
import NotFound from "@/pages/not-found";
import Homepage from "@/pages/homepage";
import Dashboard from "@/pages/dashboard";
import Login from "@/pages/login";
import Signup from "@/pages/signup";
import Orders from "@/pages/orders";
import OrderDetail from "@/pages/order/[id]";
import NewOrder from "@/pages/order/new";
import Files from "@/pages/files";
import Tools from "@/pages/tools";
import DPICalculator from "@/pages/tools/dpi-calculator";
import TurnaroundEstimator from "@/pages/tools/turnaround-estimator";
import VectorChecker from "@/pages/tools/vector-checker";
import AdminPage from "@/pages/admin";

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Homepage} />
        <Route path="/login" component={Login} />
        <Route path="/signup" component={Signup} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/orders" component={Orders} />
        <Route path="/orders/:id" component={OrderDetail} />
        <Route path="/order/new" component={NewOrder} />
        <Route path="/files" component={Files} />
        <Route path="/tools" component={Tools} />
        <Route path="/tools/dpi-calculator" component={DPICalculator} />
        <Route path="/tools/turnaround-estimator" component={TurnaroundEstimator} />
        <Route path="/tools/vector-checker" component={VectorChecker} />
        <Route path="/admin" component={AdminPage} />
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
          <AuthProvider>
            <WebSocketProvider>
              <TooltipProvider>
                <Toaster />
                <Router />
              </TooltipProvider>
            </WebSocketProvider>
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
