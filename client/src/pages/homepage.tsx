import { Link } from "wouter";
import { Button, Paper, Title, Badge } from "@mantine/core";
import { 
  ArrowRight, 
  Upload, 
  Palette, 
  Download, 
  CheckCircle, 
  Star,
  Clock,
  Shield,
  Users,
  Zap
} from "lucide-react";

export default function Homepage() {
  const services = [
    {
      title: "Image to Vector",
      description: "Transform raster images into scalable vector graphics",
      price: "Starting at $15",
      features: ["High-quality conversion", "Multiple formats", "Fast turnaround"]
    },
    {
      title: "Logo Vectorization", 
      description: "Professional logo conversion for brand materials",
      price: "Starting at $25",
      features: ["Brand consistency", "Scalable output", "Multiple variants"]
    },
    {
      title: "PDF to Vector",
      description: "Convert PDF graphics to editable vector files",
      price: "Starting at $20",
      features: ["Preserve layouts", "Editable text", "Layer separation"]
    }
  ];

  const steps = [
    {
      step: "1",
      title: "Upload Your Files",
      description: "Upload your images, logos, or PDF files through our secure platform",
      icon: Upload
    },
    {
      step: "2", 
      title: "Expert Conversion",
      description: "Our skilled designers manually convert your files to perfect vectors",
      icon: Palette
    },
    {
      step: "3",
      title: "Download Results",
      description: "Receive your high-quality vector files in your preferred format",
      icon: Download
    }
  ];

  const features = [
    {
      icon: CheckCircle,
      title: "100% Manual Process",
      description: "Every vector is hand-crafted by professional designers"
    },
    {
      icon: Clock,
      title: "Fast Turnaround",
      description: "Most orders completed within 24-48 hours"
    },
    {
      icon: Shield,
      title: "Quality Guarantee",
      description: "Free revisions until you're completely satisfied"
    },
    {
      icon: Users,
      title: "Expert Team",
      description: "11+ years of experience in vector conversion"
    }
  ];

  return (
    <div className="bg-gradient-to-br from-background via-muted/30 to-background">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-900 via-blue-800 to-purple-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-28">
          <div className="text-center max-w-4xl mx-auto">
            <Badge 
              variant="light" 
              color="green" 
              size="lg"
              className="mb-6 sm:mb-8 text-sm sm:text-base" 
              data-testid="badge-professional"
            >
              Professional Vector Conversion Services
            </Badge>
            
            <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold mb-6 sm:mb-8 leading-tight" data-testid="heading-main">
              Transform Your Images Into
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-400 block mt-2">
                Perfect Vectors
              </span>
            </h1>
            
            <p className="text-lg sm:text-xl lg:text-2xl text-blue-100 mb-8 sm:mb-10 leading-relaxed max-w-3xl mx-auto px-4 sm:px-0" data-testid="text-hero-description">
              Professional vector conversion services with 11+ years of experience. 
              Get high-quality, scalable vectors from any image format.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center">
              <Button 
                component={Link} 
                href="/order/new"
                size="lg" 
                color="green"
                className="w-full sm:w-auto px-8 py-4 text-lg font-semibold"
                data-testid="button-start-order"
              >
                Start Your Order
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              
              <Button 
                component={Link}
                href="/tools"
                variant="outline" 
                size="lg" 
                className="w-full sm:w-auto border-blue-300 text-white hover:bg-blue-800/50 px-8 py-4 text-lg"
                data-testid="button-free-tools"
              >
                Free Tools
                <Zap className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 sm:py-20 lg:py-28 bg-gradient-to-br from-muted/50 to-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 sm:mb-20">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-6" data-testid="heading-how-it-works">
              How It Works
            </h2>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Simple 3-step process to get professional vector graphics
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-10">
            {steps.map((step, index) => {
              const IconComponent = step.icon;
              return (
                <Paper key={index} withBorder shadow="md" className="text-center p-8 lg:p-10 h-full hover:shadow-lg transition-shadow" data-testid={`card-step-${step.step}`}>
                  <div className="space-y-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto">
                      <IconComponent className="h-8 w-8 text-white" />
                    </div>
                    <Title order={3} className="text-xl font-bold">
                      <span className="text-green-600 text-2xl font-bold mr-2">{step.step}</span>
                      {step.title}
                    </Title>
                    <p className="text-muted-foreground leading-relaxed">{step.description}</p>
                  </div>
                </Paper>
              );
            })}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-12 sm:py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4" data-testid="heading-services">
              Our Services
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto px-4 sm:px-0">
              Professional vector conversion for all your design needs
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {services.map((service, index) => (
              <Paper key={index} withBorder shadow="lg" className="hover:shadow-xl transition-shadow p-6 lg:p-8 h-full flex flex-col" data-testid={`card-service-${index}`}>
                <div className="space-y-4 flex-grow">
                  <div className="space-y-3">
                    <Title order={3} className="text-lg sm:text-xl font-bold">{service.title}</Title>
                    <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base">{service.description}</p>
                    <div className="text-xl sm:text-2xl font-bold text-green-600">{service.price}</div>
                  </div>
                  
                  <ul className="space-y-2">
                    {service.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start text-gray-600 dark:text-gray-300 text-sm sm:text-base">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <Button 
                  component={Link}
                  href="/order/new"
                  className="w-full bg-blue-600 hover:bg-blue-700 mt-6"
                  size="md"
                  data-testid={`button-order-${index}`}
                >
                  Order Now
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Paper>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 sm:py-16 lg:py-24 bg-gray-50 dark:bg-gray-900/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4" data-testid="heading-why-choose">
              Why Choose VectorWiz?
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto px-4 sm:px-0">
              Professional quality and service you can trust
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <div key={index} className="text-center" data-testid={`feature-${index}`}>
                  <div className="w-14 sm:w-16 h-14 sm:h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <IconComponent className="h-6 sm:h-8 w-6 sm:w-8 text-white" />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-2">{feature.title}</h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-16 lg:py-24 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 sm:mb-6" data-testid="heading-cta">
            Ready to Get Started?
          </h2>
          <p className="text-lg sm:text-xl mb-6 sm:mb-8 text-blue-100 px-4 sm:px-0">
            Join thousands of satisfied customers who trust VectorWiz for their vector conversion needs.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center px-4 sm:px-0">
            <Button 
              component={Link}
              href="/order/new"
              size="lg" 
              color="green"
              className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold"
              data-testid="button-cta-order"
            >
              Start Your Order Now
              <ArrowRight className="ml-2 h-4 sm:h-5 w-4 sm:w-5" />
            </Button>
            
            <Button 
              component={Link}
              href="/signup"
              variant="outline" 
              size="lg" 
              className="w-full sm:w-auto border-white text-white hover:bg-white hover:text-blue-600 px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg"
              data-testid="button-cta-signup"
            >
              Create Account
              <Users className="ml-2 h-4 sm:h-5 w-4 sm:w-5" />
            </Button>
          </div>
          
          <div className="mt-6 sm:mt-8 text-sm text-blue-200 px-4 sm:px-0">
            Already have an account? 
            <Link href="/login" className="text-white font-semibold hover:underline ml-1" data-testid="link-login">
              Sign in here
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}