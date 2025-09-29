import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import Navigation from "@/components/layout/Navigation";
import VectorChecker from "@/components/tools/VectorChecker";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ArrowLeft, Search } from "lucide-react";
import { Link } from "wouter";

export default function VectorCheckerPage() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  // Vector checker tool is publicly accessible - no authentication check needed

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-white font-bold">V</span>
          </div>
          <p className="text-muted-foreground">Loading vector checker...</p>
        </div>
      </div>
    );
  }

  // Vector checker works for both authenticated and guest users

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <Navigation />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8" data-testid="vector-checker-page">
        <div className="mb-8">
          <Link href="/tools">
            <Button variant="ghost" className="mb-4" data-testid="back-to-tools">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Tools
            </Button>
          </Link>
          
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
              <Search className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Vector Checker</h1>
              <p className="text-muted-foreground">
                Upload your files to instantly verify if they're true vectors or raster images
              </p>
            </div>
          </div>
        </div>

        <VectorChecker />

        {/* Additional Information */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Why Use Vector Checker?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-3">Benefits of Vector Graphics:</h3>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• Infinite scalability without quality loss</li>
                  <li>• Smaller file sizes for simple graphics</li>
                  <li>• Perfect for logos and illustrations</li>
                  <li>• Editable individual elements</li>
                  <li>• Sharp printing at any resolution</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold mb-3">When to Vectorize:</h3>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• Logo design and branding</li>
                  <li>• Business cards and stationery</li>
                  <li>• Large format printing (banners, signs)</li>
                  <li>• T-shirt and apparel printing</li>
                  <li>• Web graphics that need to scale</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
