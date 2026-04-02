import { useLocation } from "wouter";
import QuoteRequestForm from "@/components/QuoteRequestForm";
import { useEffect } from "react";

export default function EmbedQuoteForm() {
  const [location] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  
  const theme = (searchParams.get("theme") as "light" | "dark") || "dark";
  const primaryColor = searchParams.get("color") || "#0B9F47";
  const hiddenFields = searchParams.get("hide")?.split(",") || [];
  const padding = searchParams.get("padding") || "32";
  const margin = searchParams.get("margin") || "0";
  const radius = searchParams.get("radius") || "12";
  const cssBase64 = searchParams.get("css") || "";
  
  let customCss = "";
  if (cssBase64) {
    try {
      customCss = atob(cssBase64);
    } catch (e) {
      console.error("Failed to decode custom CSS", e);
    }
  }

  // Apply theme to body background if needed
  useEffect(() => {
    document.body.style.backgroundColor = theme === "light" ? "#ffffff" : "transparent";
    return () => {
      document.body.style.backgroundColor = "";
    };
  }, [theme]);

  return (
    <div className={`min-h-screen ${theme === 'light' ? 'bg-white' : 'bg-transparent'} p-0 m-0`}>
      {customCss && <style dangerouslySetInnerHTML={{ __html: customCss }} />}
      <QuoteRequestForm 
        theme={theme}
        primaryColor={primaryColor}
        hiddenFields={hiddenFields}
        padding={padding}
        margin={margin}
        radius={radius}
        isEmbedded={true}
      />
    </div>
  );
}
