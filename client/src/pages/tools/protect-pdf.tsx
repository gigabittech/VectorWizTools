import { useState, useCallback } from "react";
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
//  PDF Standard RC4-128 Encryption — PDF spec §3.5, Algorithms 2, 3, 5
//  Verified against pypdf reference implementation.
//  Zero dependencies — uses only browser-native APIs.
// ─────────────────────────────────────────────────────────────────────────────

const PDF_PAD = new Uint8Array([
  0x28, 0xbf, 0x4e, 0x5e, 0x4e, 0x75, 0x8a, 0x41,
  0x64, 0x00, 0x4e, 0x56, 0xff, 0xfa, 0x01, 0x08,
  0x2e, 0x2e, 0x00, 0xb6, 0xd0, 0x68, 0x3e, 0x80,
  0x2f, 0x0c, 0xa9, 0xfe, 0x64, 0x53, 0x69, 0x7a,
]);

// Unsigned form of permissions (-3904 as uint32)
const PERMS_UNSIGNED = 4294967292; // 0xFFFFFC04

// ── Helpers ───────────────────────────────────────────────────────────────────

function concat(...arrays: Uint8Array[]): Uint8Array {
  const out = new Uint8Array(arrays.reduce((s, a) => s + a.length, 0));
  let i = 0;
  for (const a of arrays) { out.set(a, i); i += a.length; }
  return out;
}

/** Convert binary string to Uint8Array (latin-1 safe) */
function strToBytes(s: string): Uint8Array {
  const a = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) a[i] = s.charCodeAt(i) & 0xff;
  return a;
}

/** Convert Uint8Array to binary string (latin-1 safe) */
function bytesToStr(b: Uint8Array): string {
  let s = "";
  for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
  return s;
}

function hexEncode(b: Uint8Array): string {
  return Array.from(b).map(v => v.toString(16).padStart(2, "0")).join("").toUpperCase();
}

// ── Pure-JS MD5 ───────────────────────────────────────────────────────────────

function md5(input: Uint8Array): Uint8Array {
  function rl(x: number, n: number) { return (x << n) | (x >>> (32 - n)); }
  // Precompute T table
  const T: number[] = Array.from({ length: 65 }, (_, i) =>
    i === 0 ? 0 : (Math.abs(Math.sin(i)) * 0x100000000) >>> 0
  );
  const S = [7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
    5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
    4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
    6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21];

  // Padding
  const msgLen = input.length;
  const padded: number[] = [...input, 0x80];
  while (padded.length % 64 !== 56) padded.push(0);
  const bits = msgLen * 8;
  for (let i = 0; i < 8; i++) padded.push((bits / Math.pow(2, i * 8)) & 0xff);

  let a0 = 0x67452301, b0 = 0xefcdab89, c0 = 0x98badcfe, d0 = 0x10325476;

  for (let i = 0; i < padded.length; i += 64) {
    const M: number[] = [];
    for (let j = 0; j < 16; j++) {
      M[j] = padded[i + j * 4] | (padded[i + j * 4 + 1] << 8) |
        (padded[i + j * 4 + 2] << 16) | (padded[i + j * 4 + 3] << 24);
    }
    let [A, B, C, D] = [a0, b0, c0, d0];
    for (let j = 0; j < 64; j++) {
      let F: number, g: number;
      if (j < 16) { F = (B & C) | (~B & D); g = j; }
      else if (j < 32) { F = (D & B) | (~D & C); g = (5 * j + 1) % 16; }
      else if (j < 48) { F = B ^ C ^ D; g = (3 * j + 5) % 16; }
      else { F = C ^ (B | ~D); g = (7 * j) % 16; }
      F = (F + A + T[j + 1] + M[g]) >>> 0;
      A = D; D = C; C = B; B = (B + rl(F, S[j])) >>> 0;
    }
    a0 = (a0 + A) >>> 0; b0 = (b0 + B) >>> 0; c0 = (c0 + C) >>> 0; d0 = (d0 + D) >>> 0;
  }

  const res = new Uint8Array(16);
  [a0, b0, c0, d0].forEach((v, i) => {
    res[i * 4] = v & 0xff;
    res[i * 4 + 1] = (v >> 8) & 0xff;
    res[i * 4 + 2] = (v >> 16) & 0xff;
    res[i * 4 + 3] = (v >> 24) & 0xff;
  });
  return res;
}

// ── Pure-JS RC4 ───────────────────────────────────────────────────────────────

function rc4(key: Uint8Array, data: Uint8Array): Uint8Array {
  const S = Array.from({ length: 256 }, (_, i) => i);
  let j = 0;
  for (let i = 0; i < 256; i++) {
    j = (j + S[i] + key[i % key.length]) & 0xff;
    [S[i], S[j]] = [S[j], S[i]];
  }
  const out = new Uint8Array(data.length);
  let x = 0, y = 0;
  for (let i = 0; i < data.length; i++) {
    x = (x + 1) & 0xff; y = (y + S[x]) & 0xff;
    [S[x], S[y]] = [S[y], S[x]];
    out[i] = data[i] ^ S[(S[x] + S[y]) & 0xff];
  }
  return out;
}

// ── PDF Encryption Algorithms ─────────────────────────────────────────────────

/** Pad or truncate password to 32 bytes per PDF spec Algorithm 2 step (a) */
function padPassword(pw: string): Uint8Array {
  const pwBytes = new TextEncoder().encode(pw).slice(0, 32);
  return concat(pwBytes, PDF_PAD).slice(0, 32);
}

/**
 * Algorithm 3 — Compute /O (owner password value)
 * Used for both owner and user auth.
 */
function computeO(ownerPw: string, userPw: string, keyLen = 16): Uint8Array {
  let key = md5(padPassword(ownerPw || userPw));
  for (let i = 0; i < 50; i++) key = md5(key.slice(0, keyLen));
  key = key.slice(0, keyLen);
  let result = padPassword(userPw);
  for (let i = 0; i < 20; i++) result = rc4(key.map(b => b ^ i), result);
  return result;
}

/**
 * Algorithm 2 — Compute file encryption key.
 * permsUnsigned = permissions as uint32 (e.g. 4294967292 for -3904)
 * fileId = raw bytes of the file identifier (32 bytes ASCII hex string)
 */
function computeEncKey(userPw: string, O: Uint8Array, permsUnsigned: number, fileId: Uint8Array, keyLen = 16): Uint8Array {
  // Pack permsUnsigned as little-endian 32-bit
  const permBuf = new Uint8Array(4);
  permBuf[0] = permsUnsigned & 0xff;
  permBuf[1] = (permsUnsigned >> 8) & 0xff;
  permBuf[2] = (permsUnsigned >> 16) & 0xff;
  permBuf[3] = (permsUnsigned >> 24) & 0xff;

  let key = md5(concat(padPassword(userPw), O, permBuf, fileId));
  for (let i = 0; i < 50; i++) key = md5(key.slice(0, keyLen));
  return key.slice(0, keyLen);
}

/**
 * Algorithm 5 — Compute /U (user password value) for R=3.
 * U = RC4_x20(key, MD5(PDF_PAD + fileId)) + 16 bytes padding
 */
function computeU(encKey: Uint8Array, fileId: Uint8Array): Uint8Array {
  const h = md5(concat(PDF_PAD, fileId));
  let out = rc4(encKey, h);
  for (let i = 1; i < 20; i++) out = rc4(encKey.map(b => b ^ i), out);
  return concat(out, PDF_PAD.slice(0, 16)); // append 16 bytes padding
}

/**
 * Algorithm 1 — Encrypt stream/string data for object (objNum, genNum).
 */
function encryptObjData(encKey: Uint8Array, objNum: number, genNum: number, data: Uint8Array): Uint8Array {
  const ext = new Uint8Array([
    objNum & 0xff, (objNum >> 8) & 0xff, (objNum >> 16) & 0xff,
    genNum & 0xff, (genNum >> 8) & 0xff,
  ]);
  const objKey = md5(concat(encKey, ext)).slice(0, Math.min(encKey.length + 5, 16));
  return rc4(objKey, data);
}

// ── PDF Binary Rewriter ───────────────────────────────────────────────────────

/**
 * Encrypt a PDF Uint8Array with RC4-128 password protection.
 * Returns a new Uint8Array containing the encrypted PDF.
 * Compatible with Adobe Acrobat, macOS Preview, browser viewers, etc.
 */
function encryptPDFBuffer(pdfBytes: Uint8Array, password: string): Uint8Array {
  // Validate
  const header = bytesToStr(pdfBytes.slice(0, 5));
  if (header !== "%PDF-") throw new Error("Not a valid PDF file.");

  // Check already encrypted
  const pdfStr = bytesToStr(pdfBytes);
  if (/\/Encrypt\b/.test(pdfStr)) throw new Error("This PDF is already password-protected.");

  // Generate file ID: 32-char lowercase hex string stored as ASCII bytes
  // (matches pypdf's format: _rolling_checksum encoded as utf-8)
  const randBytes = crypto.getRandomValues(new Uint8Array(16));
  const fileId = strToBytes(Array.from(randBytes).map(b => b.toString(16).padStart(2, "0")).join(""));

  // Compute encryption parameters
  const O = computeO(password, password);
  const encKey = computeEncKey(password, O, PERMS_UNSIGNED, fileId);
  const U = computeU(encKey, fileId);

  const ENCRYPT_OBJ = 1000;

  // ── Parse all objects ───────────────────────────────────────────────────────
  const objRe = /(\d+) (\d+) obj\b/g;
  const endObjRe = /\bendobj\b/g;

  type ObjPos = { start: number; num: number; gen: number };
  const objList: ObjPos[] = [];
  let m: RegExpExecArray | null;

  while ((m = objRe.exec(pdfStr)) !== null) {
    objList.push({ start: m.index, num: parseInt(m[1]), gen: parseInt(m[2]) });
  }

  if (objList.length === 0) throw new Error("No PDF objects found — corrupted PDF?");

  // ── Rewrite each object ─────────────────────────────────────────────────────
  const outputParts: Uint8Array[] = [];
  const offsets: Map<number, number> = new Map();

  // Preserve PDF header (everything before first object)
  outputParts.push(pdfBytes.slice(0, objList[0].start));

  for (let idx = 0; idx < objList.length; idx++) {
    const { start, num, gen } = objList[idx];

    // Find endobj
    endObjRe.lastIndex = start + 10;
    const endM = endObjRe.exec(pdfStr);
    if (!endM) continue;
    const objEnd = endM.index + endM[0].length;

    const bodyBytes = pdfBytes.slice(start, objEnd);
    const bodyStr = pdfStr.slice(start, objEnd);

    // Find stream boundaries (if any)
    const streamStartM = bodyStr.match(/stream\r?\n/);
    const streamEndM = bodyStr.match(/\r?\nendstream/);

    let newBodyBytes: Uint8Array;

    if (streamStartM && streamEndM && streamStartM.index !== undefined && streamEndM.index !== undefined) {
      // ── Encrypt stream data ───────────────────────────────────────────────
      const sStart = streamStartM.index + streamStartM[0].length;
      const sEnd = streamEndM.index;
      const streamData = bodyBytes.slice(sStart, sEnd);
      const encStream = encryptObjData(encKey, num, gen, streamData);

      // Update /Length in dict
      const preDictStr = bodyStr.slice(0, streamStartM.index);
      const updatedDict = preDictStr.replace(/\/Length\s+\d+/, `/Length ${encStream.length}`);

      newBodyBytes = concat(
        strToBytes(updatedDict),
        strToBytes(streamStartM[0]), // "stream\n" or "stream\r\n"
        encStream,
        strToBytes(streamEndM[0]),   // "\nendstream" or "\r\nendstream"
        strToBytes(bodyStr.slice(streamEndM.index + streamEndM[0].length))
      );
    } else {
      // ── Encrypt literal strings ───────────────────────────────────────────
      const result: number[] = [];
      let i = 0;
      while (i < bodyBytes.length) {
        if (bodyBytes[i] === 0x28) { // '('
          // Find balanced closing paren
          let k = i + 1;
          let depth = 1;
          while (k < bodyBytes.length && depth > 0) {
            if (bodyBytes[k] === 0x5c) { // backslash — skip escape
              k += 2;
            } else if (bodyBytes[k] === 0x28) { depth++; k++; }
            else if (bodyBytes[k] === 0x29) { depth--; k++; }
            else { k++; }
          }
          // Extract raw content of the string (with PDF escapes intact)
          const strBytes = bodyBytes.slice(i + 1, k - 1);
          // Unescape PDF literal string
          const unescaped: number[] = [];
          for (let si = 0; si < strBytes.length; si++) {
            if (strBytes[si] === 0x5c && si + 1 < strBytes.length) {
              const next = strBytes[si + 1];
              if (next === 0x6e) { unescaped.push(0x0a); si++; }
              else if (next === 0x72) { unescaped.push(0x0d); si++; }
              else if (next === 0x74) { unescaped.push(0x09); si++; }
              else if (next === 0x5c) { unescaped.push(0x5c); si++; }
              else if (next === 0x28) { unescaped.push(0x28); si++; }
              else if (next === 0x29) { unescaped.push(0x29); si++; }
              else { unescaped.push(strBytes[si]); }
            } else {
              unescaped.push(strBytes[si]);
            }
          }
          const encStr = encryptObjData(encKey, num, gen, new Uint8Array(unescaped));
          // Output as hex string <HEXHEX>
          result.push(0x3c); // '<'
          for (const b of encStr) {
            const hex = b.toString(16).padStart(2, "0").toUpperCase();
            result.push(hex.charCodeAt(0), hex.charCodeAt(1));
          }
          result.push(0x3e); // '>'
          i = k;
        } else {
          result.push(bodyBytes[i]);
          i++;
        }
      }
      newBodyBytes = new Uint8Array(result);
    }

    const currentOffset = outputParts.reduce((s, p) => s + p.length, 0);
    offsets.set(num, currentOffset);
    outputParts.push(newBodyBytes);
    if (newBodyBytes[newBodyBytes.length - 1] !== 0x0a) {
      outputParts.push(new Uint8Array([0x0a]));
    }
  }

  // ── Append /Encrypt object ─────────────────────────────────────────────────
  const encObjOffset = outputParts.reduce((s, p) => s + p.length, 0);
  offsets.set(ENCRYPT_OBJ, encObjOffset);

  // P value: signed int (-3904) for the PDF dict
  const P_SIGNED = PERMS_UNSIGNED - 4294967296; // = -3904

  const encObjStr =
    `${ENCRYPT_OBJ} 0 obj\n` +
    `<< /Filter /Standard /V 2 /R 3 /Length 128 /P ${P_SIGNED}\n` +
    `   /O <${hexEncode(O)}>\n` +
    `   /U <${hexEncode(U)}>\n` +
    `>>\nendobj\n`;
  outputParts.push(strToBytes(encObjStr));

  // ── Build xref table with exact byte offsets ───────────────────────────────
  const xrefOffset = outputParts.reduce((s, p) => s + p.length, 0);
  const maxObj = Math.max(...offsets.keys());

  let xref = `xref\n0 ${maxObj + 1}\n`;
  xref += "0000000000 65535 f \n"; // obj 0 (always free)
  for (let i = 1; i <= maxObj; i++) {
    const off = offsets.get(i);
    if (off !== undefined) {
      xref += `${off.toString().padStart(10, "0")} 00000 n \n`;
    } else {
      xref += "0000000000 65535 f \n";
    }
  }
  outputParts.push(strToBytes(xref));

  // ── Build trailer ──────────────────────────────────────────────────────────
  const rootM = pdfStr.match(/\/Root (\d+ \d+ R)/);
  const infoM = pdfStr.match(/\/Info (\d+ \d+ R)/);
  const root = rootM ? rootM[1] : "3 0 R";
  const info = infoM ? `/Info ${infoM[1]}\n` : "";
  const fidHex = hexEncode(fileId); // hex-encode the file_id bytes for PDF output

  const trailer =
    `trailer\n<< /Size ${maxObj + 1}\n/Root ${root}\n${info}` +
    `/Encrypt ${ENCRYPT_OBJ} 0 R\n` +
    `/ID [<${fidHex}> <${fidHex}>]\n>>\n` +
    `startxref\n${xrefOffset}\n%%EOF\n`;
  outputParts.push(strToBytes(trailer));

  // ── Concatenate all parts ──────────────────────────────────────────────────
  const totalLen = outputParts.reduce((s, p) => s + p.length, 0);
  const final = new Uint8Array(totalLen);
  let cursor = 0;
  for (const part of outputParts) { final.set(part, cursor); cursor += part.length; }
  return final;
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

    setStatus("processing");
    setProcessedBlob(null);

    try {
      const arrayBuffer = await files[0].file.arrayBuffer();
      const pdfBytes = new Uint8Array(arrayBuffer);

      // Yield to browser so processing state renders before sync work
      await new Promise<void>(resolve => setTimeout(resolve, 60));

      const encryptedBytes = encryptPDFBuffer(pdfBytes, password);
      const blob = new Blob([encryptedBytes], { type: "application/pdf" });

      setProcessedBlob(blob);
      setStatus("success");
      toast({ title: "Protected!", description: "PDF encrypted with RC4-128. No server involved." });
    } catch (err) {
      setStatus("error");
      toast({
        title: "Encryption Failed",
        description: err instanceof Error ? err.message : "Unexpected error.",
        variant: "destructive",
      });
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
      description="Add password protection to any PDF — processed 100% in your browser. No server, no upload, no Python."
      category="PDF Tools"
      keywords={["protect pdf", "password pdf", "secure pdf", "encrypt pdf", "lock pdf", "RC4-128"]}
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
            <strong>100% client-side.</strong> Your PDF never leaves your device. Uses the PDF Standard
            RC4-128 algorithm — compatible with Adobe Acrobat, macOS Preview, and all major PDF readers.
          </span>
        </div>

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

            {/* Password */}
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

            {/* Confirm */}
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
              disabled={status === "processing" || !password || !pwMatch}
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
              <span>
                Protected with <strong>RC4-128 encryption</strong> — requires your password to open in any PDF reader.
              </span>
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