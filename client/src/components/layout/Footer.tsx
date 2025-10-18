import { Mail } from "lucide-react";
import { Link } from "wouter";

export default function Footer() {
  return (
    <footer
      className="text-white"
      style={{ backgroundColor: "#06183C" }}
      data-testid="main-footer"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="lg:col-span-2">
            <a href="https://vectorwiz.com/" className="inline-block mb-6" data-testid="footer-logo-link">
              <img
                src="https://vectorwiz.com/wp-content/uploads/2023/02/VectorWiz-New-Logo-04.svg"
                alt="VectorWiz"
                className="h-12"
              />
            </a>
            <p className="text-gray-300 text-sm mb-6 leading-relaxed max-w-md">
              Professional vector conversion services with 11+ years of experience.
              Transform your raster images into crisp, scalable vectors delivered by expert designers.
            </p>

            {/* Contact Info */}
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Mail className="h-4 w-4 text-[#0B9F47] flex-shrink-0" />
                <a
                  href="mailto:orders@vectorwiz.com"
                  className="text-gray-300 hover:text-white text-sm transition-colors"
                  data-testid="contact-email"
                >
                  orders@vectorwiz.com
                </a>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-6">Quick Links</h3>
            <ul className="space-y-3">
              <li>
                <a
                  href="https://vectorwiz.com/"
                  className="text-gray-300 hover:text-white text-sm transition-colors duration-200"
                  data-testid="footer-home"
                >
                  Home
                </a>
              </li>
              <li>
                <a
                  href="https://vectorwiz.com/services"
                  className="text-gray-300 hover:text-white text-sm transition-colors duration-200"
                  data-testid="footer-services"
                >
                  Services
                </a>
              </li>
              <li>
                <a
                  href="https://vectorwiz.com/contact/"
                  className="text-gray-300 hover:text-white text-sm transition-colors duration-200"
                  data-testid="footer-contact"
                >
                  Contact
                </a>
              </li>
              <li>
                <Link
                  href="/tools"
                  className="text-gray-300 hover:text-white text-sm transition-colors duration-200"
                  data-testid="footer-tools"
                >
                  Tools
                </Link>
              </li>
            </ul>
          </div>

          {/* Tools */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-6">Popular Tools</h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/tools/vector-checker"
                  className="text-gray-300 hover:text-white text-sm transition-colors duration-200"
                  data-testid="footer-tool-vector-checker"
                >
                  Vector Checker
                </Link>
              </li>
              <li>
                <Link
                  href="/tools/dpi-calculator"
                  className="text-gray-300 hover:text-white text-sm transition-colors duration-200"
                  data-testid="footer-tool-dpi-calculator"
                >
                  DPI Calculator
                </Link>
              </li>
              <li>
                <Link
                  href="/tools/format-converter"
                  className="text-gray-300 hover:text-white text-sm transition-colors duration-200"
                  data-testid="footer-tool-format-converter"
                >
                  Format Converter
                </Link>
              </li>
              <li>
                <Link
                  href="/tools/color-extractor"
                  className="text-gray-300 hover:text-white text-sm transition-colors duration-200"
                  data-testid="footer-tool-color-extractor"
                >
                  Color Extractor
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-700 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-gray-400 text-sm">
              © 2025 VectorWiz. All rights reserved.
            </div>

            {/* Quick Links */}
            <div className="flex flex-wrap items-center gap-6">
              <a
                href="https://vectorwiz.com/privacy"
                className="text-gray-400 hover:text-white text-sm transition-colors"
                data-testid="footer-privacy-link"
              >
                Privacy Policy
              </a>
              <a
                href="https://vectorwiz.com/terms"
                className="text-gray-400 hover:text-white text-sm transition-colors"
                data-testid="footer-terms-link"
              >
                Terms of Service
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
