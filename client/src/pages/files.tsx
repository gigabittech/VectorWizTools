import { useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import Navigation from "@/components/layout/Navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { File } from "@shared/schema";
import { FileText, Download, Eye, Upload } from "lucide-react";
import { Link } from "wouter";

const fileKindLabels = {
  SOURCE: "Source File",
  UPLOAD: "Upload",
  PROOF: "Proof",
  FINAL: "Final",
};

const fileKindStyles = {
  SOURCE: "bg-blue-100 text-blue-700",
  UPLOAD: "bg-gray-100 text-gray-700",
  PROOF: "bg-amber-100 text-amber-700",
  FINAL: "bg-emerald-100 text-emerald-700",
};

export default function Files() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  const { data: files = [], isLoading: filesLoading, error } = useQuery<File[]>({
    queryKey: ["/api/files"],
    select: (data: any) => data.files || [],
  });

  useEffect(() => {
    if (!isLoading && !user) {
      setLocation("/login");
    }
  }, [user, isLoading, setLocation]);

  if (isLoading || filesLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted">
        <Navigation />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-6">
            <Skeleton className="h-8 w-64" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <Skeleton className="h-6 w-32 mb-4" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-3/4" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!user) {
    return null; // Redirecting
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted">
        <Navigation />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardContent className="p-12 text-center">
              <h1 className="text-2xl font-bold mb-2">Error Loading Files</h1>
              <p className="text-muted-foreground mb-6">
                Failed to load your files. Please try again later.
              </p>
              <Button onClick={() => window.location.reload()}>
                Retry
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" data-testid="files-page">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Your Files</h1>
            <p className="text-muted-foreground">
              Manage and download your uploaded files and final deliverables
            </p>
          </div>
          
          <Link href="/order/new">
            <Button className="gradient-primary" data-testid="upload-new-files">
              <Upload className="mr-2 h-4 w-4" />
              Upload New Files
            </Button>
          </Link>
        </div>

        {files.length === 0 ? (
          <Card data-testid="no-files">
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">No files yet</h3>
              <p className="text-muted-foreground mb-6">
                Start by uploading files through an order or project
              </p>
              <Link href="/order/new">
                <Button className="gradient-primary">Create Your First Order</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="files-grid">
            {files.map((file) => (
              <Card key={file.id} className="card-hover" data-testid={`file-${file.id}`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                      <FileText className="h-6 w-6 text-blue-600" />
                    </div>
                    <Badge 
                      className={fileKindStyles[file.kind]}
                      data-testid={`file-kind-${file.id}`}
                    >
                      {fileKindLabels[file.kind]}
                    </Badge>
                  </div>
                  
                  <h3 className="font-semibold mb-2 truncate" data-testid={`file-name-${file.id}`}>
                    {file.name}
                  </h3>
                  
                  <div className="space-y-1 text-sm text-muted-foreground mb-4">
                    <p data-testid={`file-size-${file.id}`}>
                      Size: {formatFileSize(file.size)}
                    </p>
                    <p data-testid={`file-type-${file.id}`}>
                      Type: {file.mime}
                    </p>
                    <p data-testid={`file-date-${file.id}`}>
                      Uploaded: {new Date(file.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      data-testid={`preview-file-${file.id}`}
                    >
                      <Eye className="mr-1 h-3 w-3" />
                      Preview
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      data-testid={`download-file-${file.id}`}
                    >
                      <Download className="mr-1 h-3 w-3" />
                      Download
                    </Button>
                  </div>
                  
                  {file.orderId && (
                    <div className="mt-4 pt-4 border-t">
                      <Link href={`/orders/${file.orderId}`}>
                        <Button variant="ghost" size="sm" className="w-full text-primary">
                          View Order
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
