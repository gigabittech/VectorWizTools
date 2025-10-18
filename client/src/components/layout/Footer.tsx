import { Mail, MapPin, Phone, Facebook, Instagram, Star } from "lucide-react";
import { SiX, SiPinterest } from "react-icons/si";
import { Link } from "wouter";

export default function Footer() {
  return (
    <footer
      className="text-white"
      style={{ background: "linear-gradient(75deg, #06183C 0%, #20448B 100%)" }}
      data-testid="main-footer"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">

          {/* Pages */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Pages</h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="https://vectorwiz.com/about/"
                  className="text-gray-300 hover:text-white text-sm transition-colors"
                  data-testid="footer-about"
                >
                  About
                </a>
              </li>
              <li>
                <a
                  href="https://vectorwiz.com/services/"
                  className="text-gray-300 hover:text-white text-sm transition-colors"
                  data-testid="footer-services"
                >
                  Services
                </a>
              </li>
              <li>
                <Link
                  href="/"
                  className="text-gray-300 hover:text-white text-sm transition-colors"
                  data-testid="footer-tools"
                >
                  Free Tools
                </Link>
              </li>
              <li>
                <a
                  href="https://vectorwiz.com/online-profiles/"
                  className="text-gray-300 hover:text-white text-sm transition-colors"
                  data-testid="footer-profiles"
                >
                  Profiles
                </a>
              </li>
            </ul>
          </div>

          {/* Locations */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Locations</h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="https://vectorwiz.com/usa-clipping-path-service/"
                  className="text-gray-300 hover:text-white text-sm transition-colors"
                  data-testid="footer-location-usa"
                >
                  United States
                </a>
              </li>
              <li>
                <a
                  href="https://vectorwiz.com/australia-clipping-path-service/"
                  className="text-gray-300 hover:text-white text-sm transition-colors"
                  data-testid="footer-location-australia"
                >
                  Australia
                </a>
              </li>
              <li>
                <a
                  href="https://vectorwiz.com/new-zealand-clipping-path-service/"
                  className="text-gray-300 hover:text-white text-sm transition-colors"
                  data-testid="footer-location-new-zealand"
                >
                  New Zealand
                </a>
              </li>
              <li>
                <a
                  href="https://vectorwiz.com/united-kingdom-clipping-path-service/"
                  className="text-gray-300 hover:text-white text-sm transition-colors"
                  data-testid="footer-location-uk"
                >
                  United Kingdom
                </a>
              </li>
              <li>
                <a
                  href="https://vectorwiz.com/canada-clipping-path-service/"
                  className="text-gray-300 hover:text-white text-sm transition-colors"
                  data-testid="footer-location-canada"
                >
                  Canada
                </a>
              </li>
              <li>
                <a
                  href="https://vectorwiz.com/germany-clipping-path-service/"
                  className="text-gray-300 hover:text-white text-sm transition-colors"
                  data-testid="footer-location-germany"
                >
                  Germany
                </a>
              </li>
              <li>
                <a
                  href="https://vectorwiz.com/france-clipping-path-service/"
                  className="text-gray-300 hover:text-white text-sm transition-colors"
                  data-testid="footer-location-france"
                >
                  France
                </a>
              </li>
              <li>
                <a
                  href="https://vectorwiz.com/netherlands-clipping-path-service/"
                  className="text-gray-300 hover:text-white text-sm transition-colors"
                  data-testid="footer-location-netherlands"
                >
                  Netherlands
                </a>
              </li>
            </ul>
          </div>

          {/* More Locations + Services Part 1 */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">More Locations</h3>
            <ul className="space-y-2 mb-6">
              <li>
                <a
                  href="https://vectorwiz.com/italy-clipping-path-service/"
                  className="text-gray-300 hover:text-white text-sm transition-colors"
                  data-testid="footer-location-italy"
                >
                  Italy
                </a>
              </li>
              <li>
                <a
                  href="https://vectorwiz.com/sweden-clipping-path-service/"
                  className="text-gray-300 hover:text-white text-sm transition-colors"
                  data-testid="footer-location-sweden"
                >
                  Sweden
                </a>
              </li>
              <li>
                <a
                  href="https://vectorwiz.com/denmark-clipping-path-service/"
                  className="text-gray-300 hover:text-white text-sm transition-colors"
                  data-testid="footer-location-denmark"
                >
                  Denmark
                </a>
              </li>
              <li>
                <a
                  href="https://vectorwiz.com/ireland-clipping-path-service/"
                  className="text-gray-300 hover:text-white text-sm transition-colors"
                  data-testid="footer-location-ireland"
                >
                  Ireland
                </a>
              </li>
            </ul>

            <h3 className="text-lg font-semibold text-white mb-4">Vector Services</h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="https://vectorwiz.com/vector-silhouette-service/"
                  className="text-gray-300 hover:text-white text-sm transition-colors"
                  data-testid="footer-service-silhouette"
                >
                  Vector Silhouette
                </a>
              </li>
              <li>
                <a
                  href="https://vectorwiz.com/vector-line-drawing/"
                  className="text-gray-300 hover:text-white text-sm transition-colors"
                  data-testid="footer-service-line-drawing"
                >
                  Vector Line Drawing
                </a>
              </li>
              <li>
                <a
                  href="https://vectorwiz.com/vector-art-conversion-service/"
                  className="text-gray-300 hover:text-white text-sm transition-colors"
                  data-testid="footer-service-art-conversion"
                >
                  Vector Art Conversion
                </a>
              </li>
              <li>
                <a
                  href="https://vectorwiz.com/vector-logo-conversion-service/"
                  className="text-gray-300 hover:text-white text-sm transition-colors"
                  data-testid="footer-service-logo-conversion"
                >
                  Vector Logo Conversion
                </a>
              </li>
            </ul>
          </div>

          {/* Services Part 2 */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">More Services</h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="https://vectorwiz.com/badge-vector-conversion/"
                  className="text-gray-300 hover:text-white text-sm transition-colors"
                  data-testid="footer-service-badge"
                >
                  Badge Vector Conversion
                </a>
              </li>
              <li>
                <a
                  href="https://vectorwiz.com/pets-vector-conversion/"
                  className="text-gray-300 hover:text-white text-sm transition-colors"
                  data-testid="footer-service-pets"
                >
                  Pets Vector Conversion
                </a>
              </li>
              <li>
                <a
                  href="https://vectorwiz.com/vehicles-vector-conversion/"
                  className="text-gray-300 hover:text-white text-sm transition-colors"
                  data-testid="footer-service-vehicles"
                >
                  Vehicles Vector Conversion
                </a>
              </li>
              <li>
                <a
                  href="https://vectorwiz.com/jpg-to-vector-conversion/"
                  className="text-gray-300 hover:text-white text-sm transition-colors"
                  data-testid="footer-service-jpg-to-vector"
                >
                  JPG to Vector Conversion
                </a>
              </li>
              <li>
                <a
                  href="https://vectorwiz.com/image-to-vector-conversion/"
                  className="text-gray-300 hover:text-white text-sm transition-colors"
                  data-testid="footer-service-image-to-vector"
                >
                  Image to Vector
                </a>
              </li>
              <li>
                <a
                  href="https://vectorwiz.com/ecommerce-image-editing-service/"
                  className="text-gray-300 hover:text-white text-sm transition-colors"
                  data-testid="footer-service-ecommerce"
                >
                  eCommerce Image Editing
                </a>
              </li>
              <li>
                <a
                  href="https://vectorwiz.com/clipping-path-service/"
                  className="text-gray-300 hover:text-white text-sm transition-colors"
                  data-testid="footer-service-clipping-path"
                >
                  Clipping Path Services
                </a>
              </li>
              <li>
                <a
                  href="https://vectorwiz.com/background-removal-service/"
                  className="text-gray-300 hover:text-white text-sm transition-colors"
                  data-testid="footer-service-background-removal"
                >
                  Background Removal
                </a>
              </li>
              <li>
                <a
                  href="https://vectorwiz.com/image-masking-service/"
                  className="text-gray-300 hover:text-white text-sm transition-colors"
                  data-testid="footer-service-image-masking"
                >
                  Image Masking
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Additional Services Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mt-8 pt-8 border-t border-white/10">
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Image Services</h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="https://vectorwiz.com/professional-photo-retouching-service/"
                  className="text-gray-300 hover:text-white text-sm transition-colors"
                  data-testid="footer-service-photo-retouching"
                >
                  Photo Retouching
                </a>
              </li>
              <li>
                <a
                  href="https://vectorwiz.com/logo-design/"
                  className="text-gray-300 hover:text-white text-sm transition-colors"
                  data-testid="footer-service-logo-design"
                >
                  Logo Design
                </a>
              </li>
              <li>
                <a
                  href="https://vectorwiz.com/shadow-adding-service/"
                  className="text-gray-300 hover:text-white text-sm transition-colors"
                  data-testid="footer-service-shadow-adding"
                >
                  Shadow Adding
                </a>
              </li>
              <li>
                <a
                  href="https://vectorwiz.com/photoshop-color-change-service/"
                  className="text-gray-300 hover:text-white text-sm transition-colors"
                  data-testid="footer-service-color-change"
                >
                  Color Change
                </a>
              </li>
              <li>
                <a
                  href="https://vectorwiz.com/ghost-mannequin-service/"
                  className="text-gray-300 hover:text-white text-sm transition-colors"
                  data-testid="footer-service-ghost-mannequin"
                >
                  Ghost Mannequin
                </a>
              </li>
              <li>
                <a
                  href="https://vectorwiz.com/multi-clipping-path-service/"
                  className="text-gray-300 hover:text-white text-sm transition-colors"
                  data-testid="footer-service-multi-clipping"
                >
                  Multi Clipping Path
                </a>
              </li>
              <li>
                <a
                  href="https://vectorwiz.com/convert-pdf-to-vector-image-guide/"
                  className="text-gray-300 hover:text-white text-sm transition-colors"
                  data-testid="footer-service-pdf-to-vector"
                >
                  PDF to Vector
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Info - Wyoming */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Wyoming Office</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-[#0B9F47] flex-shrink-0 mt-0.5" />
                <p className="text-gray-300 text-sm">
                  1309 Coffeen Ave STE 1200<br />
                  Sheridan, WY 82801, USA
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-[#0B9F47] flex-shrink-0" />
                <a
                  href="tel:+19012490909"
                  className="text-gray-300 hover:text-white text-sm transition-colors"
                  data-testid="contact-phone-wyoming"
                >
                  +1 901-249-0909
                </a>
              </div>
            </div>
          </div>

          {/* Contact Info - Dhaka */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Dhaka Office</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-[#0B9F47] flex-shrink-0 mt-0.5" />
                <p className="text-gray-300 text-sm">
                  889, Suite A9, Bashundhara<br />
                  Apollo Link Road, Vatara<br />
                  Dhaka 1229, Bangladesh
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-[#0B9F47] flex-shrink-0" />
                <a
                  href="tel:+8801708519767"
                  className="text-gray-300 hover:text-white text-sm transition-colors"
                  data-testid="contact-phone-dhaka"
                >
                  +880 1708 519767
                </a>
              </div>
            </div>
          </div>

          {/* Email */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Contact Us</h3>
            <div className="flex items-center gap-2">
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

        {/* Bottom Bar */}
        <div className="border-t border-white/10 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-gray-300 text-sm" data-testid="footer-copyright">
              © 2025 VectorWiz. All rights reserved.
            </div>

            {/* Legal Links */}
            <div className="flex flex-wrap items-center gap-6">
              <a
                href="https://vectorwiz.com/privacy-policy/"
                className="text-gray-300 hover:text-white text-sm transition-colors"
                data-testid="footer-privacy-link"
              >
                Privacy Policy
              </a>
              <a
                href="https://vectorwiz.com/terms-and-conditions/"
                className="text-gray-300 hover:text-white text-sm transition-colors"
                data-testid="footer-terms-link"
              >
                Terms & Conditions
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
