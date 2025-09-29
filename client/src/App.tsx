import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "./lib/auth";
import { WebSocketProvider } from "./lib/websocket";
import NotFound from "@/pages/not-found";
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

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
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
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
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
  );
}

export default App;
