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

// ═════════════════════════════════════════════════════════════════════════════
//  PDF AES-128 Encryption  —  PDF 1.6 spec §3.5  (V=4, R=4)
//
//  Key insight (verified against pikepdf/qpdf):
//  - File key  : MD5(padPw + O + P_u32_LE + fileId)  × 50 rounds  → 16 bytes
//  - Object key: MD5(fileKey + objNum_3LE + genNum_2LE + b"sAlT")  → 16 bytes
//  - Stream/string AES-128-CBC uses the OBJECT key, NOT the file key
//  - SubtleCrypto AES-CBC auto-adds PKCS7, so we feed it already-padded data
//    and strip the extra block it appends.
//
//  All algorithms verified byte-for-byte against pikepdf reference output.
// ═════════════════════════════════════════════════════════════════════════════

// ── Constants ─────────────────────────────────────────────────────────────────

const PDF_PAD = new Uint8Array([
  0x28, 0xBF, 0x4E, 0x5E, 0x4E, 0x75, 0x8A, 0x41,
  0x64, 0x00, 0x4E, 0x56, 0xFF, 0xFA, 0x01, 0x08,
  0x2E, 0x2E, 0x00, 0xB6, 0xD0, 0x68, 0x3E, 0x80,
  0x2F, 0x0C, 0xA9, 0xFE, 0x64, 0x53, 0x69, 0x7A,
]);

// P = -1028  →  u32 = 0xFFFFFBFC = 4294966268
// Allows printing + accessibility; disables editing/copying/annotations
const PERMS_UINT32 = 4294966268;
const P_SIGNED = -1028;

// ── Utilities ─────────────────────────────────────────────────────────────────

function concat(...arrays: Uint8Array[]): Uint8Array {
  const total = arrays.reduce((s, a) => s + a.length, 0);
  const out = new Uint8Array(total);
  let off = 0;
  for (const a of arrays) { out.set(a, off); off += a.length; }
  return out;
}

function u32le(n: number): Uint8Array {
  return new Uint8Array([n & 0xFF, (n >>> 8) & 0xFF, (n >>> 16) & 0xFF, (n >>> 24) & 0xFF]);
}

function hexOf(b: Uint8Array): string {
  return Array.from(b).map(v => v.toString(16).padStart(2, "0")).join("").toUpperCase();
}

/** PDF binary ↔ string (latin-1, lossless for binary data) */
function b2s(b: Uint8Array): string {
  let s = ""; for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i]); return s;
}
function s2b(s: string): Uint8Array {
  const a = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) a[i] = s.charCodeAt(i) & 0xFF;
  return a;
}

// ── Pure-JS MD5 ───────────────────────────────────────────────────────────────

function md5(input: Uint8Array): Uint8Array {
  const rl = (x: number, n: number) => (x << n) | (x >>> (32 - n));
  const T = Array.from({ length: 65 }, (_, i) => i === 0 ? 0 : (Math.abs(Math.sin(i)) * 0x100000000) >>> 0);
  const S = [7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
    5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
    4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
    6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21];
  const ml = input.length;
  const pd = [...input, 0x80];
  while (pd.length % 64 !== 56) pd.push(0);
  const bits = ml * 8;
  for (let i = 0; i < 8; i++) pd.push((bits / Math.pow(2, i * 8)) & 0xFF);
  let a0 = 0x67452301, b0 = 0xEFCDAB89, c0 = 0x98BADCFE, d0 = 0x10325476;
  for (let i = 0; i < pd.length; i += 64) {
    const M: number[] = [];
    for (let j = 0; j < 16; j++) M[j] = pd[i + j * 4] | (pd[i + j * 4 + 1] << 8) | (pd[i + j * 4 + 2] << 16) | (pd[i + j * 4 + 3] << 24);
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
    res[i * 4] = v & 0xFF; res[i * 4 + 1] = (v >> 8) & 0xFF; res[i * 4 + 2] = (v >> 16) & 0xFF; res[i * 4 + 3] = (v >> 24) & 0xFF;
  });
  return res;
}

// ── Pure-JS RC4 ───────────────────────────────────────────────────────────────

function rc4(key: Uint8Array, data: Uint8Array): Uint8Array {
  const S = Array.from({ length: 256 }, (_, i) => i);
  let j = 0;
  for (let i = 0; i < 256; i++) { j = (j + S[i] + key[i % key.length]) & 0xFF;[S[i], S[j]] = [S[j], S[i]]; }
  const out = new Uint8Array(data.length); let x = 0, y = 0;
  for (let i = 0; i < data.length; i++) {
    x = (x + 1) & 0xFF; y = (y + S[x]) & 0xFF;[S[x], S[y]] = [S[y], S[x]];
    out[i] = data[i] ^ S[(S[x] + S[y]) & 0xFF];
  }
  return out;
}

// ── PDF Key Derivation ────────────────────────────────────────────────────────

function padPassword(pw: string): Uint8Array {
  const pwb = new TextEncoder().encode(pw).slice(0, 32);
  return concat(pwb, PDF_PAD).slice(0, 32);
}

/** Algorithm 3: /O entry */
function computeO(ownerPw: string, userPw: string): Uint8Array {
  let key = md5(padPassword(ownerPw || userPw));
  for (let i = 0; i < 50; i++) key = md5(key.slice(0, 16));
  key = key.slice(0, 16);
  let result = padPassword(userPw);
  for (let i = 0; i < 20; i++) result = rc4(key.map(b => b ^ i), result);
  return result;
}

/** Algorithm 2: file encryption key (no 0xFF bytes — verified against pikepdf) */
function computeFileKey(userPw: string, O: Uint8Array, permsU32: number, fileId: Uint8Array): Uint8Array {
  const data = concat(padPassword(userPw), O, u32le(permsU32), fileId);
  let key = md5(data);
  for (let i = 0; i < 50; i++) key = md5(key.slice(0, 16));
  return key.slice(0, 16);
}

/** Algorithm 5: /U entry */
function computeU(fileKey: Uint8Array, fileId: Uint8Array): Uint8Array {
  const h = md5(concat(PDF_PAD, fileId));
  let out = rc4(fileKey, h);
  for (let i = 1; i < 20; i++) out = rc4(fileKey.map(b => b ^ i), out);
  return concat(out, new Uint8Array(16));
}

/**
 * Algorithm 3.1a: per-object AES key.
 * objectKey = MD5(fileKey + objNum_3LE + genNum_2LE + b"sAlT")[:16]
 * This is required for V=4 AES (verified byte-for-byte against pikepdf/qpdf).
 */
function computeObjectKey(fileKey: Uint8Array, objNum: number, genNum: number): Uint8Array {
  const ext = new Uint8Array([
    objNum & 0xFF, (objNum >> 8) & 0xFF, (objNum >> 16) & 0xFF,
    genNum & 0xFF, (genNum >> 8) & 0xFF,
    0x73, 0x41, 0x6C, 0x54,  // b"sAlT"
  ]);
  return md5(concat(fileKey, ext)).slice(0, 16);
}

// ── AES-128-CBC via SubtleCrypto ──────────────────────────────────────────────

/**
 * Encrypt with AES-128-CBC.
 * SubtleCrypto always appends its own PKCS7 block, so we:
 *   1. Manually PKCS7-pad the input to a 16-byte boundary
 *   2. Let SubtleCrypto encrypt it (it adds another 16-byte pad block)
 *   3. Strip the extra 16 bytes SubtleCrypto appended
 * Output: 16-byte IV prepended to ciphertext (PDF spec requirement)
 */
async function aesEncrypt(key: Uint8Array, plaintext: Uint8Array): Promise<Uint8Array> {
  // Manual PKCS7 padding
  const padLen = 16 - (plaintext.length % 16);
  const padded = new Uint8Array(plaintext.length + padLen);
  padded.set(plaintext);
  padded.fill(padLen, plaintext.length);

  const iv = crypto.getRandomValues(new Uint8Array(16));

  const cryptoKey = await crypto.subtle.importKey(
    "raw", key, { name: "AES-CBC" }, false, ["encrypt"]
  );
  // SubtleCrypto adds its own PKCS7 on top of our padded input
  const cipherWithExtraPad = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-CBC", iv }, cryptoKey, padded)
  );
  // Strip the extra 16-byte block SubtleCrypto added
  const ciphertext = cipherWithExtraPad.slice(0, cipherWithExtraPad.length - 16);

  return concat(iv, ciphertext);
}

// ── PDF Object Parsing ────────────────────────────────────────────────────────

interface PdfObj { num: number; gen: number; start: number; end: number; }

function parsePdfObjects(pdfBytes: Uint8Array): PdfObj[] {
  const str = b2s(pdfBytes);
  const re = /^(\d+) +(\d+) +obj\b/gm;
  const endRe = /\bendobj\b/g;
  const objects: PdfObj[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(str)) !== null) {
    endRe.lastIndex = m.index + m[0].length;
    const em = endRe.exec(str);
    if (!em) continue;
    objects.push({
      num: parseInt(m[1], 10), gen: parseInt(m[2], 10),
      start: m.index, end: em.index + em[0].length
    });
  }
  return objects;
}

// ── Literal String Decoder ────────────────────────────────────────────────────

function decodeLiteralStr(raw: Uint8Array): Uint8Array {
  const out: number[] = []; let i = 0;
  while (i < raw.length) {
    if (raw[i] === 0x5C && i + 1 < raw.length) {
      const n = raw[i + 1];
      if (n === 0x6E) { out.push(0x0A); i += 2; }
      else if (n === 0x72) { out.push(0x0D); i += 2; }
      else if (n === 0x74) { out.push(0x09); i += 2; }
      else if (n === 0x62) { out.push(0x08); i += 2; }
      else if (n === 0x66) { out.push(0x0C); i += 2; }
      else if (n === 0x5C) { out.push(0x5C); i += 2; }
      else if (n === 0x28) { out.push(0x28); i += 2; }
      else if (n === 0x29) { out.push(0x29); i += 2; }
      else if (n >= 0x30 && n <= 0x37) {
        let oct = String.fromCharCode(n); let skip = 2;
        if (i + 2 < raw.length && raw[i + 2] >= 0x30 && raw[i + 2] <= 0x37) {
          oct += String.fromCharCode(raw[i + 2]); skip = 3;
          if (i + 3 < raw.length && raw[i + 3] >= 0x30 && raw[i + 3] <= 0x37) {
            oct += String.fromCharCode(raw[i + 3]); skip = 4;
          }
        }
        out.push(parseInt(oct, 8)); i += skip;
      } else if (n === 0x0A || n === 0x0D) {
        i += 2; if (n === 0x0D && i < raw.length && raw[i] === 0x0A) i++;
      } else { out.push(n); i += 2; }
    } else { out.push(raw[i]); i++; }
  }
  return new Uint8Array(out);
}

// ── Encrypt All Strings in Non-Stream Body ────────────────────────────────────

async function encryptStrings(bodyBytes: Uint8Array, objKey: Uint8Array): Promise<Uint8Array> {
  const result: number[] = []; let i = 0;
  while (i < bodyBytes.length) {
    const b = bodyBytes[i];

    // Literal string  (...)
    if (b === 0x28) {
      let k = i + 1, depth = 1;
      while (k < bodyBytes.length && depth > 0) {
        if (bodyBytes[k] === 0x5C) { k += 2; continue; }
        if (bodyBytes[k] === 0x28) depth++;
        else if (bodyBytes[k] === 0x29) depth--;
        k++;
      }
      const raw = bodyBytes.slice(i + 1, k - 1);
      const decoded = decodeLiteralStr(raw);
      if (decoded.length > 0) {
        const enc = await aesEncrypt(objKey, decoded);
        result.push(0x3C);
        for (const byte of enc) {
          const h = byte.toString(16).padStart(2, "0").toUpperCase();
          result.push(h.charCodeAt(0), h.charCodeAt(1));
        }
        result.push(0x3E);
      } else { result.push(0x3C, 0x3E); }
      i = k; continue;
    }

    // Hex string  <...>  (but NOT <<)
    if (b === 0x3C && i + 1 < bodyBytes.length && bodyBytes[i + 1] !== 0x3C) {
      let k = i + 1;
      while (k < bodyBytes.length && bodyBytes[k] !== 0x3E) k++;
      const hexStr = b2s(bodyBytes.slice(i + 1, k)).replace(/\s/g, "");
      if (hexStr.length > 0 && /^[0-9A-Fa-f]+$/.test(hexStr)) {
        const norm = hexStr.length % 2 !== 0 ? hexStr + "0" : hexStr;
        const decoded = new Uint8Array(norm.match(/.{2}/g)!.map(h => parseInt(h, 16)));
        const enc = await aesEncrypt(objKey, decoded);
        result.push(0x3C);
        for (const byte of enc) {
          const h = byte.toString(16).padStart(2, "0").toUpperCase();
          result.push(h.charCodeAt(0), h.charCodeAt(1));
        }
        result.push(0x3E);
      } else {
        for (let x = i; x <= k; x++) result.push(bodyBytes[x]);
      }
      i = k + 1; continue;
    }

    result.push(b); i++;
  }
  return new Uint8Array(result);
}

// ── Encrypt One PDF Object ────────────────────────────────────────────────────

async function encryptObject(
  bodyBytes: Uint8Array, fileKey: Uint8Array, objNum: number, genNum: number
): Promise<Uint8Array> {
  const objKey = computeObjectKey(fileKey, objNum, genNum);
  const bodyStr = b2s(bodyBytes);

  // Detect stream
  const streamStartM = bodyStr.match(/\bstream\r?\n/);
  const streamEndM = bodyStr.match(/[\r\n]endstream\b/);

  if (streamStartM?.index !== undefined && streamEndM?.index !== undefined) {
    const sStart = streamStartM.index + streamStartM[0].length;
    const sEnd = streamEndM.index + 1; // +1 for leading \r or \n
    const streamData = bodyBytes.slice(sStart, sEnd);
    if (streamData.length === 0) return bodyBytes;

    const encStream = await aesEncrypt(objKey, streamData);

    const prePart = bodyStr.slice(0, streamStartM.index);
    const updatedPre = prePart.replace(/\/Length\s+\d+/, `/Length ${encStream.length}`);
    const postPart = bodyStr.slice(streamEndM.index);

    return concat(
      s2b(updatedPre),
      s2b(streamStartM[0]),
      encStream,
      s2b(postPart)
    );
  }

  // No stream — encrypt literal/hex strings
  return encryptStrings(bodyBytes, objKey);
}

// ── Main Encryption Entry Point ───────────────────────────────────────────────

async function encryptPDF(pdfBytes: Uint8Array, password: string): Promise<Uint8Array> {
  if (b2s(pdfBytes.slice(0, 5)) !== "%PDF-")
    throw new Error("Not a valid PDF file.");
  if (/\/Encrypt\b/.test(b2s(pdfBytes)))
    throw new Error("This PDF is already password-protected.");

  const fileId = crypto.getRandomValues(new Uint8Array(16));
  const O = computeO(password, password);
  const fileKey = computeFileKey(password, O, PERMS_UINT32, fileId);
  const U = computeU(fileKey, fileId);

  const objects = parsePdfObjects(pdfBytes);
  if (objects.length === 0) throw new Error("No PDF objects found — corrupted PDF?");
  objects.sort((a, b) => a.start - b.start);

  const ENCRYPT_NUM = Math.max(...objects.map(o => o.num)) + 1;

  const parts: Uint8Array[] = [];
  const offsets = new Map<number, number>();

  parts.push(pdfBytes.slice(0, objects[0].start));

  for (const obj of objects) {
    const { num, gen, start, end } = obj;
    const bodyBytes = pdfBytes.slice(start, end);
    const encrypted = await encryptObject(bodyBytes, fileKey, num, gen);

    offsets.set(num, parts.reduce((s, p) => s + p.length, 0));
    parts.push(encrypted);
    const last = encrypted[encrypted.length - 1];
    if (last !== 0x0A && last !== 0x0D) parts.push(new Uint8Array([0x0A]));
  }

  // /Encrypt object (V=4, R=4, AES-128)
  const encObjOff = parts.reduce((s, p) => s + p.length, 0);
  offsets.set(ENCRYPT_NUM, encObjOff);
  const encDictStr =
    `${ENCRYPT_NUM} 0 obj\n` +
    `<< /Filter /Standard /V 4 /R 4 /Length 128 /P ${P_SIGNED}\n` +
    `   /O <${hexOf(O)}>\n` +
    `   /U <${hexOf(U)}>\n` +
    `   /StmF /StdCF /StrF /StdCF\n` +
    `   /CF << /StdCF << /AuthEvent /DocOpen /CFM /AESV2 /Length 16 >> >>\n` +
    `>>\nendobj\n`;
  parts.push(s2b(encDictStr));

  // xref
  const xrefOff = parts.reduce((s, p) => s + p.length, 0);
  const maxObj = Math.max(...offsets.keys());
  let xref = `xref\n0 ${maxObj + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= maxObj; i++) {
    const off = offsets.get(i);
    xref += off !== undefined
      ? `${off.toString().padStart(10, "0")} 00000 n \n`
      : "0000000000 65535 f \n";
  }
  parts.push(s2b(xref));

  // trailer
  const pdfStr = b2s(pdfBytes);
  const rootM = pdfStr.match(/\/Root\s+(\d+\s+\d+\s+R)/);
  const infoM = pdfStr.match(/\/Info\s+(\d+\s+\d+\s+R)/);
  const root = rootM ? rootM[1].replace(/\s+/g, " ") : "1 0 R";
  const info = infoM ? `/Info ${infoM[1].replace(/\s+/g, " ")}\n` : "";
  const fidHex = hexOf(fileId);

  const trailer =
    `trailer\n<< /Size ${maxObj + 1}\n/Root ${root}\n${info}` +
    `/Encrypt ${ENCRYPT_NUM} 0 R\n` +
    `/ID [<${fidHex}><${fidHex}>]\n>>\n` +
    `startxref\n${xrefOff}\n%%EOF\n`;
  parts.push(s2b(trailer));

  const total = parts.reduce((s, p) => s + p.length, 0);
  const out = new Uint8Array(total);
  let cursor = 0;
  for (const p of parts) { out.set(p, cursor); cursor += p.length; }
  return out;
}

// ═════════════════════════════════════════════════════════════════════════════
//  Password Strength
// ═════════════════════════════════════════════════════════════════════════════

function getStrength(pw: string) {
  if (!pw) return { label: "", color: "bg-gray-200", width: "0%" };
  if (pw.length < 6) return { label: "Weak", color: "bg-red-500", width: "25%" };
  const score = [/[A-Z]/, /[a-z]/, /[0-9]/, /[^A-Za-z0-9]/].filter(r => r.test(pw)).length;
  if (pw.length >= 12 && score >= 3) return { label: "Strong", color: "bg-green-500", width: "100%" };
  if (score >= 2) return { label: "Good", color: "bg-blue-500", width: "75%" };
  return { label: "Fair", color: "bg-yellow-500", width: "50%" };
}

// ═════════════════════════════════════════════════════════════════════════════
//  React Component
// ═════════════════════════════════════════════════════════════════════════════

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
      await new Promise<void>(r => setTimeout(r, 60));
      const encryptedBytes = await encryptPDF(new Uint8Array(arrayBuffer), password);
      const blob = new Blob([encryptedBytes], { type: "application/pdf" });
      setProcessedBlob(blob);
      setStatus("success");
      toast({ title: "Protected!", description: "PDF encrypted with AES-128. No server involved." });
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
      description="Add AES-128 password protection to any PDF — 100% in your browser. No server, no upload."
      category="PDF Tools"
      keywords={["protect pdf", "password pdf", "secure pdf", "encrypt pdf", "lock pdf", "AES-128"]}
      howToSteps={[
        { name: "Upload PDF", text: "Select the PDF file you want to protect." },
        { name: "Set Password", text: "Enter and confirm a strong password." },
        { name: "Protect", text: "Click Protect PDF — AES-128 encryption runs fully in your browser." },
        { name: "Download", text: "Download and open with your password in any PDF viewer." },
      ]}
    >
      <div className="space-y-6">

        <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-800">
          <Info className="h-4 w-4 mt-0.5 shrink-0 text-blue-500" />
          <span>
            <strong>100% client-side.</strong> Your PDF never leaves your device.
            Uses <strong>AES-128 (PDF 1.6)</strong> — compatible with Adobe Acrobat,
            macOS Preview, Chrome, Edge, and all major PDF readers.
          </span>
        </div>

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
              disabled={status === "processing" || !password || !pwMatch}
            >
              {status === "processing" ? "Encrypting…" : "Protect PDF"}
            </Button>
          </div>
        )}

        {status !== "idle" && (
          <ProcessingIndicator
            status={status}
            message="Encrypting PDF in your browser…"
            successMessage="PDF encrypted and protected — ready to download!"
            errorMessage="Encryption failed. The PDF may be malformed or already encrypted."
          />
        )}

        {processedBlob && (
          <div className="backdrop-blur-md bg-white/70 border border-white/40 rounded-xl p-6 space-y-3">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <ShieldCheck className="h-4 w-4 text-[#0B9F47]" />
              <span>
                Protected with <strong>AES-128 encryption</strong> — requires your password to open.
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