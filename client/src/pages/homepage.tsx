import { Link } from "wouter";
import { Button, Paper, Title, Badge, Container } from "@mantine/core";
import {
  Calculator,
  Clock,
  Search,
  Repeat,
  Palette,
  HardDrive,
  Ruler,
  Monitor,
  Zap,
  Maximize,
  Type,
  FileText,
  Wrench,
} from "lucide-react";
import { useState } from "react";
import QuoteRequestForm from "@/components/QuoteRequestForm";
import { Dialog, DialogContent } from "@/components/ui/dialog";

export default function Homepage() {
  const [quoteDialogOpen, setQuoteDialogOpen] = useState(false);

  const tools = [
    {
      icon: Calculator,
      title: "DPI Calculator",
      description: "Calculate optimal DPI for print projects",
      href: "/dpi-calculator",
      color: "blue",
    },
    {
      icon: Clock,
      title: "Turnaround Estimator",
      description: "Get accurate delivery time estimates",
      href: "/turnaround-estimator",
      color: "purple",
    },
    {
      icon: Search,
      title: "Vector Checker",
      description: "Verify if files are vector or raster",
      href: "/vector-checker",
      color: "green",
    },
    {
      icon: Repeat,
      title: "Format Converter",
      description: "Convert between image formats",
      href: "/format-converter",
      color: "blue",
    },
    {
      icon: Palette,
      title: "Color Extractor",
      description: "Extract colors from images",
      href: "/color-extractor",
      color: "purple",
    },
    {
      icon: HardDrive,
      title: "File Size Calculator",
      description: "Calculate estimated file sizes",
      href: "/file-size-calculator",
      color: "orange",
    },
    {
      icon: Ruler,
      title: "Print Size Calculator",
      description: "Calculate maximum print dimensions",
      href: "/print-size-calculator",
      color: "green",
    },
    {
      icon: Monitor,
      title: "Logo Dimensions",
      description: "Get logo sizes for all platforms",
      href: "/logo-dimensions",
      color: "pink",
    },
    {
      icon: Zap,
      title: "Vector Simplifier",
      description: "Optimize SVG files for web",
      href: "/vector-simplifier",
      color: "yellow",
    },
    {
      icon: Maximize,
      title: "Aspect Ratio Calculator",
      description: "Calculate and resize proportionally",
      href: "/aspect-ratio-calculator",
      color: "teal",
    },
    {
      icon: Type,
      title: "Font to Vector",
      description: "Convert text to vector graphics",
      href: "/font-to-vector",
      color: "red",
    },
  ];

  return (
    <div className="bg-gradient-to-br from-background via-muted/30 to-background">
      {/* Hero Section */}
      <section style={{ backgroundColor: "#06183C" }} className="text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="text-center max-w-4xl mx-auto">
            <Badge
              variant="light"
              color="green"
              size="lg"
              className="mb-6 sm:mb-8 text-sm sm:text-base"
              data-testid="badge-tools"
            >
              Free Professional Vector Tools
            </Badge>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold mb-6 sm:mb-8 leading-tight" data-testid="heading-main">
              VectorWiz Tools
              <span className="block mt-2 text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-400">
                Professional Design Resources
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-blue-100 mb-8 sm:mb-10 leading-relaxed max-w-3xl mx-auto" data-testid="text-hero-description">
              Free tools to help you prepare, analyze, and optimize your vector graphics projects.
              Perfect for designers, print shops, and businesses.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center">
              <Link href="/tools">
                <Button
                  size="lg"
                  className="bg-[#0B9F47] hover:bg-[#0B9F47]/90 text-white w-full sm:w-auto px-8 py-4 text-lg font-semibold"
                  data-testid="button-browse-tools"
                >
                  <Wrench className="mr-2 h-5 w-5" />
                  Browse All Tools
                </Button>
              </Link>

              <Button
                onClick={() => setQuoteDialogOpen(true)}
                variant="outline"
                size="lg"
                className="border-white text-white hover:bg-white/10 w-full sm:w-auto px-8 py-4 text-lg"
                data-testid="button-request-quote"
              >
                <FileText className="mr-2 h-5 w-5" />
                Request Quote
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Tools */}
      <Container size="xl" className="py-16 sm:py-20">
        <div className="text-center mb-12">
          <Title order={2} className="text-3xl sm:text-4xl font-bold mb-4" data-testid="heading-tools">
            Our Free Tools
          </Title>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Professional-grade tools to streamline your design workflow
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tools.map((tool, index) => {
            const Icon = tool.icon;
            return (
              <Link key={index} href={tool.href}>
                <Paper
                  withBorder
                  shadow="md"
                  className="p-6 h-full hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer"
                  data-testid={`tool-card-${index}`}
                >
                  <div className={`w-12 h-12 bg-${tool.color}-100 dark:bg-${tool.color}-900/30 rounded-xl flex items-center justify-center mb-4`}>
                    <Icon className={`h-6 w-6 text-${tool.color}-600`} />
                  </div>
                  <Title order={3} size="h4" className="mb-2">
                    {tool.title}
                  </Title>
                  <p className="text-sm text-muted-foreground">{tool.description}</p>
                </Paper>
              </Link>
            );
          })}
        </div>

        <div className="text-center mt-12">
          <Link href="/tools">
            <Button
              size="lg"
              variant="outline"
              className="border-[#0B9F47] text-[#0B9F47] hover:bg-[#0B9F47]/10"
              data-testid="button-view-all-tools"
            >
              View All Tools
            </Button>
          </Link>
        </div>
      </Container>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <Container size="md" className="text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4" data-testid="heading-cta">
            Need Professional Vector Conversion?
          </h2>
          <p className="text-lg sm:text-xl mb-8 text-blue-100">
            Our expert team can handle your vector conversion projects with 11+ years of experience.
          </p>

          <Button
            onClick={() => setQuoteDialogOpen(true)}
            size="lg"
            className="bg-[#0B9F47] hover:bg-[#0B9F47]/90 text-white px-8 py-4 text-lg font-semibold"
            data-testid="button-cta-quote"
          >
            <FileText className="mr-2 h-5 w-5" />
            Request a Quote
          </Button>
        </Container>
      </section>

      {/* Quote Request Dialog */}
      <Dialog open={quoteDialogOpen} onOpenChange={setQuoteDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <QuoteRequestForm />
        </DialogContent>
      </Dialog>
    </div>
  );
}
