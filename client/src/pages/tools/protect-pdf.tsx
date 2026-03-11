import { useState, useCallback, useEffect, useRef } from "react";
import ToolLayout from "@/components/tools/shared/ToolLayout";
import FileUploader, { UploadedFile } from "@/components/tools/shared/FileUploader";
import ProcessingIndicator, { ProcessingStatus } from "@/components/tools/shared/ProcessingIndicator";
import DownloadButton from "@/components/tools/shared/DownloadButton";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { downloadFile } from "@/lib/fileUtils";
import { Lock, Eye, EyeOff, ShieldCheck, Info } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
//  Load pdf-lib dynamically from CDN
// ─────────────────────────────────────────────────────────────────────────────

declare global {
  interface Window {
    PDFLib: any;
  }
}

function usePdfLib() {
  const [ready, setReady] = useState(false);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (window.PDFLib) { setReady(true); return; }
    if (loadedRef.current) return;
    loadedRef.current = true;
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js";
    script.onload = () => setReady(true);
    script.onerror = () => console.error("Failed to load pdf-lib");
    document.head.appendChild(script);
  }, []);

  return ready;
}

// ─────────────────────────────────────────────────────────────────────────────
//  Password Strength Helper
// ─────────────────────────────────────────────────────────────────────────────

function getStrength(pw: string) {
  if (!pw) return { label: "", color: "bg-gray-200", width: "0%" };
  if (pw.length < 6) return { label: "Weak", color: "bg-red-500", width: "25%" };
  const score = [/[A-Z]/, /[a-z]/, /[0-9]/, /[^A-Za-z0-9]/].filter(r => r.test(pw)).length;
  if (pw.length >= 12 && score >= 3) return { label: "Strong", color: "bg-green-500", width: "100%" };
  if (score >= 2) return { label: "Good", color: "bg-blue-500", width: "75%" };
  return { label: "Fair", color: "bg-yellow-500", width: "50%" };
}

// ─────────────────────────────────────────────────────────────────────────────
//  React Component
// ─────────────────────────────────────────────────────────────────────────────

export default function ProtectPDF() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [status, setStatus] = useState<ProcessingStatus>("idle");
  const [password, setPassword] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [processedBlob, setProcessedBlob] = useState<Blob | null>(null);
  const { toast } = useToast();
  const pdfLibReady = usePdfLib();

  const strength = getStrength(password);
  const pwMatch = password === confirmPw;

  const handleFilesSelected = useCallback((uploaded: UploadedFile[]) => {
    setFiles(uploaded);
    setProcessedBlob(null);
    setStatus("idle");
  }, []);

  const handleProtect = async () => {
    if (!files.length) {
      toast({ title: "No File", description: "Please upload a PDF file.", variant: "destructive" });
      return;
    }
    if (!password) {
      toast({ title: "Password Required", description: "Please enter a password.", variant: "destructive" });
      return;
    }
    if (!pwMatch) {
      toast({ title: "Passwords Don't Match", description: "Both passwords must be identical.", variant: "destructive" });
      return;
    }
    if (!pdfLibReady || !window.PDFLib) {
      toast({ title: "Not Ready", description: "PDF library is still loading. Please wait a moment.", variant: "destructive" });
      return;
    }

    setStatus("processing");
    setProcessedBlob(null);

    try {
      const { PDFDocument } = window.PDFLib;
      const arrayBuffer = await files[0].file.arrayBuffer();

      const pdfDoc = await PDFDocument.load(arrayBuffer);

      const encryptedPdfBytes = await pdfDoc.save({
        userPassword: password,
        ownerPassword: password,
        permissions: {
          printing: "highResolution",
          modifying: false,
          copying: false,
          annotating: false,
          fillingForms: false,
          contentAccessibility: true,
          documentAssembly: false,
        },
      });

      const blob = new Blob([encryptedPdfBytes], { type: "application/pdf" });
      setProcessedBlob(blob);
      setStatus("success");
      toast({ title: "Protected!", description: "PDF password-protected successfully. No server involved." });
    } catch (err: any) {
      setStatus("error");
      let msg = err instanceof Error ? err.message : "Unexpected error.";
      if (msg.toLowerCase().includes("encrypt") || msg.toLowerCase().includes("password")) {
        msg = "This PDF is already password-protected.";
      } else if (msg.toLowerCase().includes("invalid")) {
        msg = "Invalid or corrupted PDF file.";
      }
      toast({ title: "Protection Failed", description: msg, variant: "destructive" });
    }
  };

  const handleDownload = () => {
    if (!processedBlob || !files.length) return;
    const base = files[0].file.name.replace(/\.[^/.]+$/, "");
    downloadFile(processedBlob, `${base}_protected.pdf`);
  };

  return (
    <ToolLayout
      title="Protect PDF"
      description="Add password protection to any PDF — processed 100% in your browser. No server, no upload."
      category="PDF Tools"
      keywords={["protect pdf", "password pdf", "secure pdf", "encrypt pdf", "lock pdf"]}
      howToSteps={[
        { name: "Upload PDF", text: "Select a PDF file to protect." },
        { name: "Set Password", text: "Enter and confirm your desired password." },
        { name: "Protect", text: "Click Protect PDF — encryption runs fully in your browser." },
        { name: "Download", text: "Download the protected PDF and open it in any PDF reader." },
      ]}
    >
      <div className="space-y-6">

        {/* Info banner */}
        <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-800">
          <Info className="h-4 w-4 mt-0.5 shrink-0 text-blue-500" />
          <span>
            <strong>100% client-side.</strong> Your PDF never leaves your device. Compatible with
            Adobe Acrobat, macOS Preview, and all major PDF readers.
          </span>
        </div>

        {/* Library loading indicator */}
        {!pdfLibReady && (
          <div className="text-sm text-gray-500 text-center py-2 animate-pulse">
            Loading PDF engine…
          </div>
        )}

        {/* Upload */}
        <div className="backdrop-blur-md bg-white/70 border border-white/40 rounded-xl p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Lock className="h-5 w-5 text-[#0B9F47]" />
            Upload PDF
          </h2>
          <FileUploader
            accept="application/pdf"
            maxFiles={1}
            maxSize={100 * 1024 * 1024}
            onFilesSelected={handleFilesSelected}
            multiple={false}
            allowedTypes={["application/pdf"]}
          />
        </div>

        {/* Password settings */}
        {files.length > 0 && (
          <div className="backdrop-blur-md bg-white/70 border border-white/40 rounded-xl p-6 space-y-5">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-[#0B9F47]" />
              Set Password
            </h2>

            <div>
              <Label className="mb-1 block">Password</Label>
              <div className="relative">
                <Input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter a strong password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {password && (
                <div className="mt-2 space-y-1">
                  <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${strength.color}`}
                      style={{ width: strength.width }}
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    Strength: <span className="font-semibold">{strength.label}</span>
                  </p>
                </div>
              )}
            </div>

            <div>
              <Label className="mb-1 block">Confirm Password</Label>
              <Input
                type={showPw ? "text" : "password"}
                value={confirmPw}
                onChange={e => setConfirmPw(e.target.value)}
                placeholder="Re-enter your password"
                className={confirmPw && !pwMatch ? "border-red-400 focus:ring-red-400" : ""}
              />
              {confirmPw && (
                <p className={`text-xs mt-1 ${pwMatch ? "text-green-600" : "text-red-500"}`}>
                  {pwMatch ? "✓ Passwords match" : "✗ Passwords do not match"}
                </p>
              )}
            </div>

            <Button
              onClick={handleProtect}
              className="w-full bg-[#0B9F47] hover:bg-[#0B9F47]/90 text-white"
              size="lg"
              disabled={status === "processing" || !password || !pwMatch || !pdfLibReady}
            >
              {status === "processing" ? "Encrypting…" : "Protect PDF"}
            </Button>
          </div>
        )}

        {/* Status */}
        {status !== "idle" && (
          <ProcessingIndicator
            status={status}
            message="Encrypting PDF in your browser…"
            successMessage="PDF encrypted and protected — ready to download!"
            errorMessage="Encryption failed. The PDF may be malformed or already encrypted."
          />
        )}

        {/* Download */}
        {processedBlob && (
          <div className="backdrop-blur-md bg-white/70 border border-white/40 rounded-xl p-6 space-y-3">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <ShieldCheck className="h-4 w-4 text-[#0B9F47]" />
              <span>Password-protected — requires your password to open in any PDF reader.</span>
            </div>
            <DownloadButton
              onClick={handleDownload}
              className="w-full bg-[#0B9F47] hover:bg-[#0B9F47]/90 text-white"
            >
              Download Protected PDF
            </DownloadButton>
          </div>
        )}
      </div>
    </ToolLayout>
  );
}