import { Wrench, Mail, Phone, MapPin } from "lucide-react";
import { Link } from "wouter";

export default function Footer() {
  const services = [
    { label: "Logo Vectorization", href: "https://vectorwiz.com/logo-vectorization" },
    { label: "Image to Vector", href: "https://vectorwiz.com/image-to-vector" },
    { label: "PDF to Vector", href: "https://vectorwiz.com/pdf-to-vector" },
    { label: "DXF Conversion", href: "https://vectorwiz.com/dxf-conversion" },
    { label: "Vector Line Drawing", href: "https://vectorwiz.com/vector-line-drawing" },
    { label: "Vector Art Conversion", href: "https://vectorwiz.com/vector-art-conversion" },
  ];

  const company = [
    { label: "About Us", href: "https://vectorwiz.com/about" },
    { label: "How It Works", href: "https://vectorwiz.com/how-it-works" },
    { label: "Portfolio", href: "https://vectorwiz.com/portfolio" },
    { label: "Pricing", href: "https://vectorwiz.com/pricing" },
    { label: "FAQ", href: "https://vectorwiz.com/faq" },
    { label: "Blog", href: "https://vectorwiz.com/blog" },
  ];

  const support = [
    { label: "Contact Us", href: "https://vectorwiz.com/contact" },
    { label: "Customer Support", href: "https://vectorwiz.com/support" },
    { label: "Order Status", href: "https://vectorwiz.com/order-status" },
    { label: "Refund Policy", href: "https://vectorwiz.com/refund-policy" },
    { label: "Terms of Service", href: "https://vectorwiz.com/terms" },
    { label: "Privacy Policy", href: "https://vectorwiz.com/privacy" },
  ];

  return (
    <footer className="bg-gray-900 text-white" data-testid="main-footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center space-x-3 mb-6" data-testid="footer-logo-link">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Wrench className="h-5 w-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold text-white">VectorWiz</span>
                <span className="text-xs text-blue-400 font-medium">Portal</span>
              </div>
            </Link>
            <p className="text-gray-400 text-sm mb-6 leading-relaxed">
              Professional vector conversion services with 11+ years of experience. 
              Transform your raster images into crisp, scalable vectors delivered by expert designers.
            </p>
            
            {/* Contact Info */}
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Mail className="h-4 w-4 text-blue-400 flex-shrink-0" />
                <a 
                  href="mailto:support@vectorwiz.com" 
                  className="text-gray-400 hover:text-white text-sm transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="contact-email"
                >
                  support@vectorwiz.com
                </a>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="h-4 w-4 text-blue-400 flex-shrink-0" />
                <a 
                  href="tel:+1-555-0123" 
                  className="text-gray-400 hover:text-white text-sm transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="contact-phone"
                >
                  +1 (555) 012-3456
                </a>
              </div>
              <div className="flex items-start space-x-3">
                <MapPin className="h-4 w-4 text-blue-400 flex-shrink-0 mt-0.5" />
                <span className="text-gray-400 text-sm leading-relaxed">
                  123 Vector Street<br />
                  Design City, DC 12345
                </span>
              </div>
            </div>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-6">Services</h3>
            <ul className="space-y-3">
              {services.map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white text-sm transition-colors duration-200"
                    data-testid={`footer-service-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-6">Company</h3>
            <ul className="space-y-3">
              {company.map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white text-sm transition-colors duration-200"
                    data-testid={`footer-company-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-6">Support</h3>
            <ul className="space-y-3">
              {support.map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white text-sm transition-colors duration-200"
                    data-testid={`footer-support-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-gray-400 text-sm">
              © 2024 VectorWiz. All rights reserved.
            </div>
            
            {/* Quick Links */}
            <div className="flex flex-wrap items-center space-x-6">
              <a 
                href="https://vectorwiz.com/terms" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white text-sm transition-colors"
                data-testid="footer-terms-link"
              >
                Terms
              </a>
              <a 
                href="https://vectorwiz.com/privacy" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white text-sm transition-colors"
                data-testid="footer-privacy-link"
              >
                Privacy
              </a>
              <a 
                href="https://vectorwiz.com/cookies" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white text-sm transition-colors"
                data-testid="footer-cookies-link"
              >
                Cookies
              </a>
              <a 
                href="https://vectorwiz.com/#order-now" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
                data-testid="footer-start-order-link"
              >
                Start Order
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}