import { Mail, MapPin, Phone, Facebook, Instagram, Download } from "lucide-react";
import { SiX, SiPinterest, SiLinkedin } from "react-icons/si";

const LOCATIONS = [
  { text: "United States", url: "https://vectorwiz.com/usa-clipping-path-service/" },
  { text: "Australia", url: "https://vectorwiz.com/australia-clipping-path-service/" },
  { text: "New Zealand", url: "https://vectorwiz.com/new-zealand-clipping-path-service/" },
  { text: "United Kingdom", url: "https://vectorwiz.com/united-kingdom-clipping-path-service/" },
  { text: "Canada", url: "https://vectorwiz.com/canada-clipping-path-service/" },
  { text: "Italy", url: "https://vectorwiz.com/italy-clipping-path-service/" },
  { text: "Denmark", url: "https://vectorwiz.com/denmark-clipping-path-service/" },
];

const VECTOR_SERVICES = [
  { text: "Vector Silhouette Service", url: "https://vectorwiz.com/vector-silhouette-service/" },
  { text: "Vector Line Drawing", url: "https://vectorwiz.com/vector-line-drawing/" },
  { text: "Vector Art Conversion", url: "https://vectorwiz.com/vector-art-conversion-service/" },
  { text: "Vector Logo Conversion", url: "https://vectorwiz.com/vector-logo-conversion-service/" },
  { text: "Badge Vector Conversion", url: "https://vectorwiz.com/badge-vector-conversion/" },
  { text: "Pets Vector Conversion", url: "https://vectorwiz.com/pets-vector-conversion/" },
  { text: "Vehicles Vector Conversion", url: "https://vectorwiz.com/vehicles-vector-conversion/" },
  { text: "JPG to Vector Conversion", url: "https://vectorwiz.com/jpg-to-vector-conversion/" },
  { text: "Image to Vector Conversion", url: "https://vectorwiz.com/image-to-vector-conversion/" },
  { text: "PDF to Vector Conversion", url: "https://vectorwiz.com/convert-pdf-to-vector-file/" },
  { text: "AI Image to Vector Conversion", url: "https://vectorwiz.com/ai-image-to-vector-conversion/" },
];

const OTHER_SERVICES = [
  { text: "Clipping Path", url: "https://vectorwiz.com/clipping-path-service/" },
  { text: "Background Removal", url: "https://vectorwiz.com/background-removal-service/" },
  { text: "Image Masking", url: "https://vectorwiz.com/image-masking-service/" },
  { text: "Photo Retouching", url: "https://vectorwiz.com/professional-photo-retouching-service/" },
  { text: "Logo Design", url: "https://vectorwiz.com/logo-design/" },
  { text: "Shadow", url: "https://vectorwiz.com/shadow-adding-service/" },
  { text: "Color Change", url: "https://vectorwiz.com/photoshop-color-change-service/" },
  { text: "Ghost Mannequin", url: "https://vectorwiz.com/ghost-mannequin-service/" },
  { text: "Multi Clipping Path Service", url: "https://vectorwiz.com/multi-clipping-path-service/" },
  { text: "eCommerce Image Editing Partner", url: "https://vectorwiz.com/ecommerce-image-editing-service/" },
];

const BOTTOM_LINKS = [
  { text: "About", url: "https://vectorwiz.com/about/" },
  { text: "Portfolio", url: "https://vectorwiz.com/portfolio/" },
  { text: "Insights", url: "https://vectorwiz.com/insights/" },
  { text: "Privacy", url: "https://vectorwiz.com/privacy-policy/" },
  { text: "Terms", url: "https://vectorwiz.com/terms-and-conditions/" },
  { text: "Sitemap", url: "https://vectorwiz.com/sitemap_index.xml" },
  { text: "Profiles", url: "https://vectorwiz.com/online-profiles/" },
];

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      className="text-white pt-20 pb-5 px-5 lg:px-10 overflow-hidden font-sans bg-[#06193C]"
      data-testid="main-footer"
    >
      <div className="max-w-7xl mx-auto">
        {/* Main Sections Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-[35px] mb-16">
          
          {/* Column 1: Locations */}
          <div className="flex flex-col">
            <h3 className="text-[20px] font-light leading-[1.4] mb-4 text-[#FFFFFF]">Locations</h3>
            <ul className="space-y-[12px] mb-6">
              {LOCATIONS.map((loc, idx) => (
                <li key={idx}>
                  <a
                    href={loc.url}
                    className="text-[#FFFFFF80] hover:text-white text-[15px] transition-colors duration-300"
                  >
                    {loc.text}
                  </a>
                </li>
              ))}
            </ul>
            <div className="flex flex-col items-start gap-4">
              <a
                href="https://www.google.com/search?sca_esv=f233e2a091c16e55&hl=en&authuser=0&sxsrf=ANbL-n77QcuW_57HKE8hFmBzX1-rOK3h4w:1772087054528&kgmid=/g/11mkhzl788&q=VectorWiz&shndl=30&source=sh/x/loc/uni/m1/1&kgs=32ddd1d11324767b&shem=shrtsdl&utm_source=shrtsdl,sh/x/loc/uni/m1/1#lrd=0x862c106857159955:0xee8e2245d4fb9636,3,,,,"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center bg-[#10A342] border border-[#10A342] text-white px-[25px] py-[12px] rounded-full text-[13px] font-bold tracking-wide transition-all duration-300 hover:bg-white hover:text-[#10A342]"
              >
                REVIEW US ON GOOGLE
              </a>
              <a
                href="https://www.trustpilot.com/evaluate/vectorwiz.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center bg-transparent border border-[#00B67A] text-[#00B67A] px-[25px] py-[12px] rounded-full text-[13px] font-bold tracking-wide transition-all duration-300 hover:bg-[#00B67A] hover:text-white"
              >
                REVIEW US ON TRUSTPILOT
              </a>
            </div>
          </div>

          {/* Column 2: Vector Conversion Services */}
          <div>
            <h3 className="text-[20px] font-light leading-[1.4] mb-4 text-[#FFFFFF]">
              <a href="https://vectorwiz.com/vector-conversion-services/" className="hover:text-white transition-colors">
                Vector Conversion Services
              </a>
            </h3>
            <ul className="space-y-[12px]">
              {VECTOR_SERVICES.map((service, idx) => (
                <li key={idx}>
                  <a
                    href={service.url}
                    className="text-[#FFFFFF80] hover:text-white text-[15px] transition-colors duration-300"
                  >
                    {service.text}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Other Services */}
          <div>
            <h3 className="text-[20px] font-light leading-[1.4] mb-4 text-[#FFFFFF]">
              <a href="https://vectorwiz.com/services/" className="hover:text-white transition-colors">
                Other Services
              </a>
            </h3>
            <ul className="space-y-[12px]">
              {OTHER_SERVICES.map((service, idx) => (
                <li key={idx}>
                  <a
                    href={service.url}
                    className="text-[#FFFFFF80] hover:text-white text-[15px] transition-colors duration-300"
                  >
                    {service.text}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Offices */}
          <div className="space-y-6">
            <div>
              <h3 className="text-[20px] font-light leading-[1.4] mb-4 text-[#FFFFFF]">Wyoming Office</h3>
              <ul className="space-y-[12px]">
                <li className="flex items-start gap-2 text-[#FFFFFF80]">
                  <MapPin className="h-[18px] w-[18px] mt-[5px]" />
                  <span className="text-[15px] leading-[1.5]">1309 Coffeen Ave STE 1200, Sheridan, WY 82801, USA.</span>
                </li>
                <li>
                  <a href="tel:9012490909" className="flex items-center gap-2 text-[#FFFFFF80] hover:text-white text-[15px] transition-colors duration-300">
                    <Phone className="h-[18px] w-[18px]" />
                    <span>+1 901-249-0909</span>
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-[20px] font-light leading-[1.4] mb-4 text-[#FFFFFF]">Dhaka Office</h3>
              <ul className="space-y-[12px]">
                <li>
                  <a
                    href="https://www.google.com.bd/maps/place/Gigabit+Tech+Studio/@23.8068437,90.4265009,18z/data=!3m1!4b1!4m6!3m5!1s0x3755b86633cbd889:0xba858098958135d9!8m2!3d23.8068412!4d90.4275952!16s%2Fg%2F11cnb9vmtm?hl=en"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-2 text-[#FFFFFF80] hover:text-white transition-colors duration-300"
                  >
                    <MapPin className="h-[18px] w-[18px] mt-[5px]" />
                    <span className="text-[15px] leading-[1.5]">889, Suite A9, Bashundhara Apollo Link Road, Vatara, Dhaka 1229, Bangladesh</span>
                  </a>
                </li>
                <li>
                  <a href="tel:01708519767" className="flex items-center gap-2 text-[#FFFFFF80] hover:text-white text-[15px] transition-colors duration-300">
                    <Phone className="h-[18px] w-[18px]" />
                    <span>+880 1708 519767</span>
                  </a>
                </li>
              </ul>
            </div>

            <a
              href="https://vectorwiz.com/wp-content/uploads/2026/04/VectorWiz-Company-Profile.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center bg-transparent border border-[#00B67A] text-white hover:bg-[#00B67A] px-[15px] py-[10px] rounded-[30px] text-[15px] transition-all duration-300 gap-3"
            >
              VectorWiz Company Profile
              <Download className="h-5 w-5" />
            </a>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-[10px] pt-4 border-t border-transparent">
          {/* Copyright */}
          <p className="text-[#FFFFFF80] text-[14px] leading-[24px]">
            Copyright © {currentYear} VectorWiz · All rights reserved.
          </p>

          {/* Social Icons */}
          <div className="flex items-center gap-[6px]">
            {[
              { icon: Facebook, url: "https://www.facebook.com/VectorWizard", label: "Facebook" },
              { icon: SiLinkedin, url: "https://www.linkedin.com/company/vectorwiz/", label: "Linkedin" },
              { icon: Instagram, url: "https://www.instagram.com/vectorwiz/", label: "Instagram" },
              { icon: SiX, url: "https://twitter.com/vectorwizrd", label: "Twitter" },
              { icon: SiPinterest, url: "https://www.pinterest.com/vectorwiz", label: "Pinterest" },
            ].map((social, idx) => (
              <a
                key={idx}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#0B9F47] text-white hover:bg-[#20448B] p-2 rounded-[30px] transition-all duration-300 flex items-center justify-center w-8 h-8"
                aria-label={social.label}
              >
                <social.icon className="h-4 w-4" />
              </a>
            ))}
            <a
              href="https://www.trustpilot.com/review/vectorwiz.com"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#0B9F47] text-white hover:bg-[#20448B] p-2 rounded-[30px] transition-all duration-300 flex items-center justify-center w-8 h-8"
              aria-label="Trustpilot"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 60.89" className="h-4 w-4 fill-current">
                <path d="M64,23.27H39.56L32,0,24.44,23.27,0,23.25,19.79,37.64,12.22,60.89,32,46.52,51.78,60.89,44.23,37.64Z" />
              </svg>
            </a>
          </div>

          {/* Footer Links */}
          <div className="flex flex-wrap justify-center lg:justify-end gap-[20px]">
            {BOTTOM_LINKS.map((link, idx) => (
              <a
                key={idx}
                href={link.url}
                className="text-[#FFFFFF80] hover:text-white text-[14px] leading-[24px] transition-colors duration-300"
              >
                {link.text}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
