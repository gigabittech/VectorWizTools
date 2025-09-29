import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import DPICalculator from "@/components/tools/DPICalculator";
import TurnaroundEstimator from "@/components/tools/TurnaroundEstimator";
import VectorChecker from "@/components/tools/VectorChecker";
import BeforeAfterSlider from "@/components/tools/BeforeAfterSlider";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calculator, Clock, Search, Eye, Plus } from "lucide-react";
import { Link } from "wouter";

export default function Tools() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !user) {
      setLocation("/login");
    }
  }, [user, isLoading, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-white font-bold">V</span>
          </div>
          <p className="text-muted-foreground">Loading tools...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Redirecting
  }

  return (
    <div className="bg-gradient-to-br from-background to-muted">
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" data-testid="tools-page">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Professional Tools</h1>
              <p className="text-muted-foreground">
                Free tools to help you prepare and optimize your vector projects
              </p>
            </div>
            
            <Link href="/order/new">
              <Button className="gradient-primary" data-testid="start-new-order">
                <Plus className="mr-2 h-4 w-4" />
                Start New Order
              </Button>
            </Link>
          </div>
        </div>

        <Tabs defaultValue="dpi-calculator" className="space-y-8">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="dpi-calculator" className="flex items-center space-x-2" data-testid="dpi-tab">
              <Calculator className="h-4 w-4" />
              <span>DPI Calculator</span>
            </TabsTrigger>
            <TabsTrigger value="turnaround-estimator" className="flex items-center space-x-2" data-testid="turnaround-tab">
              <Clock className="h-4 w-4" />
              <span>Turnaround Estimator</span>
            </TabsTrigger>
            <TabsTrigger value="vector-checker" className="flex items-center space-x-2" data-testid="vector-checker-tab">
              <Search className="h-4 w-4" />
              <span>Vector Checker</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dpi-calculator">
            <div className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Calculator className="h-5 w-5 text-blue-600" />
                    <span>DPI Calculator</span>
                  </CardTitle>
                  <p className="text-muted-foreground">
                    Calculate optimal DPI for your print projects and determine if vectorization is needed
                  </p>
                </CardHeader>
                <CardContent>
                  <DPICalculator />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="turnaround-estimator">
            <div className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Clock className="h-5 w-5 text-purple-600" />
                    <span>Turnaround Estimator</span>
                  </CardTitle>
                  <p className="text-muted-foreground">
                    Get accurate delivery estimates based on service type, complexity, and current queue status
                  </p>
                </CardHeader>
                <CardContent>
                  <TurnaroundEstimator />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="vector-checker">
            <div className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Search className="h-5 w-5 text-emerald-600" />
                    <span>Vector Checker</span>
                  </CardTitle>
                  <p className="text-muted-foreground">
                    Upload your files to instantly verify if they're true vectors or raster images
                  </p>
                </CardHeader>
                <CardContent>
                  <VectorChecker />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Before/After Showcase */}
        <div className="mt-16">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold mb-2 flex items-center justify-center space-x-2">
              <Eye className="h-6 w-6" />
              <span>See the Difference</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Transform your raster images into crisp, scalable vectors that look perfect at any size
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <BeforeAfterSlider
              beforeImage="https://images.unsplash.com/photo-1611224923853-80b023f02d71?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=300"
              afterImage="https://images.unsplash.com/photo-1558655146-364adaf1fcc9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=300"
              beforeAlt="Pixelated raster logo showing quality loss when scaled"
              afterAlt="Crisp vector logo maintaining quality at any scale"
              title="Logo Vectorization"
              description="Transform pixelated logos into crisp, scalable vectors that maintain quality at any size."
            />

            <BeforeAfterSlider
              beforeImage="https://images.unsplash.com/photo-1550745165-9bc0b252726f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=300"
              afterImage="https://images.unsplash.com/photo-1542744173-8e7e53415bb0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=300"
              beforeAlt="Low resolution artwork with visible pixels and artifacts"
              afterAlt="Clean vector artwork with smooth lines and perfect curves"
              title="Image to Vector"
              description="Convert complex images into clean vector graphics perfect for professional use."
            />
          </div>
        </div>

        {/* DPI Guidelines Reference */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>DPI Guidelines Reference</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg">
                <h3 className="font-semibold text-emerald-700 dark:text-emerald-300 mb-2">300+ DPI</h3>
                <p className="text-sm text-emerald-600 dark:text-emerald-400">
                  Excellent for professional printing, magazines, and marketing materials
                </p>
              </div>
              <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                <h3 className="font-semibold text-blue-700 dark:text-blue-300 mb-2">150-300 DPI</h3>
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  Good for general printing, posters, and large format displays
                </p>
              </div>
              <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg">
                <h3 className="font-semibold text-amber-700 dark:text-amber-300 mb-2">72-150 DPI</h3>
                <p className="text-sm text-amber-600 dark:text-amber-400">
                  Fair for web use but may appear pixelated when printed
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
