import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Check } from "lucide-react";

interface DownloadButtonProps {
  onClick: () => void | Promise<void>;
  disabled?: boolean;
  filename?: string;
  children?: React.ReactNode;
  className?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
}

export default function DownloadButton({
  onClick,
  disabled = false,
  filename,
  children,
  className,
  variant = "default",
  size = "default",
}: DownloadButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  const handleClick = async () => {
    setIsDownloading(true);
    try {
      await onClick();
      setDownloaded(true);
      setTimeout(() => setDownloaded(false), 2000);
    } catch (error) {
      console.error("Download failed:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Button
      onClick={handleClick}
      disabled={disabled || isDownloading}
      className={className}
      variant={variant}
      size={size}
      data-testid="download-button"
    >
      {downloaded ? (
        <>
          <Check className="h-4 w-4 mr-2" />
          Downloaded!
        </>
      ) : (
        <>
          <Download className="h-4 w-4 mr-2" />
          {children || (filename ? `Download ${filename}` : "Download")}
        </>
      )}
    </Button>
  );
}
