import { useState } from "react";
import ToolLayout from "@/components/tools/shared/ToolLayout";
import ProcessingIndicator, { ProcessingStatus } from "@/components/tools/shared/ProcessingIndicator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { FileText, Download, Printer, Save, Undo, Redo, Bold, Italic, Underline as UnderlineIcon, List, ListOrdered, AlignLeft, AlignCenter, AlignRight, Quote, Type } from "lucide-react";
import { useEditor, EditorContent, Extension } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import Link from "@tiptap/extension-link";
import { TextStyle } from "@tiptap/extension-text-style";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { cn } from "@/lib/utils";

// Custom FontSize Extension
const FontSize = Extension.create<{ types: string[] }>({
  name: 'fontSize',
  addOptions() {
    return {
      types: ['textStyle'],
    }
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: element => element.style.fontSize,
            renderHTML: attributes => {
              if (!attributes.fontSize) {
                return {}
              }
              return {
                style: `font-size: ${attributes.fontSize}`,
              }
            },
          },
        },
      },
    ]
  },
  addCommands() {
    return {
      setFontSize: fontSize => ({ chain }) => {
        return chain()
          .setMark('textStyle', { fontSize })
          .run()
      },
      unsetFontSize: () => ({ chain }) => {
        return chain()
          .setMark('textStyle', { fontSize: null })
          .removeEmptyTextStyle()
          .run()
      },
    }
  },
})

export default function CreatePDF() {
  const [status, setStatus] = useState<ProcessingStatus>("idle");
  const [title, setTitle] = useState("Untitled Document");
  const { toast } = useToast();

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      FontSize,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Highlight,
      Link.configure({
        openOnClick: false,
      }),
    ],
    content: `
      <h1>Start writing your document...</h1>
      <p>This is a professional document editor. You can use <strong>bold</strong>, <em>italic</em>, <u>underline</u>, and more.</p>
      <ul>
        <li>Bullet points work seamlessly</li>
        <li>Paragraph alignment is supported</li>
      </ul>
    `,
    editorProps: {
      attributes: {
        class: "prose prose-sm sm:prose-base lg:prose-lg xl:prose-2xl focus:outline-none min-h-full",
      },
    },
  });

  const handleCreatePDF = async () => {
    if (!editor) return;
    setStatus("processing");

    try {
      const element = document.getElementById("document-canvas");
      if (!element) throw new Error("Document canvas not found");

      // Set scale for better quality
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/jpeg", 1.0);
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      // Handle multi-page if height exceeds A4
      let heightLeft = pdfHeight;
      let position = 0;
      const pageHeight = pdf.internal.pageSize.getHeight();

      pdf.addImage(imgData, "JPEG", 0, position, pdfWidth, pdfHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, "JPEG", 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`${title.replace(/\s+/g, "_")}.pdf`);
      setStatus("success");
      toast({
        title: "Success",
        description: "PDF document created and downloaded.",
      });
    } catch (error) {
      console.error(error);
      setStatus("error");
      toast({
        title: "Error",
        description: "Failed to create PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setTimeout(() => setStatus("idle"), 3000);
    }
  };

  if (!editor) return null;

  return (
    <ToolLayout
      title="Create PDF"
      description="Professional Word Processor for PDF Creation."
      category="PDF Tools"
      keywords={["create pdf", "online document editor", "word to pdf", "google docs clone", "rich text to pdf"]}
      howToSteps={[
        { name: "Write", text: "Write and format your content using the rich text editor." },
        { name: "Format", text: "Use the toolbar for bold, italic, lists, and alignment." },
        { name: "Preview", text: "Your content stays in a real A4-styled document view." },
        { name: "Export", text: "Click 'Create PDF' to generate a professional document." },
      ]}
    >
      <div className="flex flex-col min-h-screen bg-gray-50/50 -m-6 md:-m-12">
        {/* Professional Editor Toolbar */}
        <div className="sticky top-0 z-50 bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between shadow-sm flex-wrap gap-4">
          <div className="flex items-center gap-4 flex-1 min-w-[300px]">
            <div className="flex items-center gap-2 px-2 border-r pr-4">
              <div className="bg-emerald-600 p-1.5 rounded-lg shadow-sm">
                <FileText className="h-4 w-4 text-white" />
              </div>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="border-none focus-visible:ring-0 focus-visible:ring-offset-0 font-bold text-gray-800 h-8 md:text-base text-sm bg-transparent"
              />
            </div>

            {/* Formatting Tools */}
            <div className="flex items-center gap-1 bg-gray-50/50 border border-gray-200 rounded-xl p-1 shadow-sm">
              <div className="flex items-center gap-0.5 px-1 border-r border-gray-200 mr-1">
                 <ToolbarButton
                   active={editor.isActive("bold")}
                   onClick={() => editor.chain().focus().toggleBold().run()}
                   icon={Bold}
                   tooltip="Bold"
                 />
                 <ToolbarButton
                   active={editor.isActive("italic")}
                   onClick={() => editor.chain().focus().toggleItalic().run()}
                   icon={Italic}
                   tooltip="Italic"
                 />
                 <ToolbarButton
                   active={editor.isActive("underline")}
                   onClick={() => editor.chain().focus().toggleUnderline().run()}
                   icon={UnderlineIcon}
                   tooltip="Underline"
                 />
              </div>

              {/* Font Size Controls */}
              <div className="flex items-center gap-1 px-1 border-r border-gray-200 mr-1">
                 <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50"
                    onClick={() => {
                       const currentSize = (editor.getAttributes('textStyle').fontSize || '16px').replace('px', '');
                       const nextSize = Math.max(8, parseInt(currentSize) - 2);
                       editor.chain().focus().setFontSize(`${nextSize}px`).run();
                    }}
                 >
                    <span className="text-lg font-medium">−</span>
                 </Button>
                 <div className="min-w-[2.5rem] text-center font-mono text-[11px] font-bold text-gray-600">
                    {(editor.getAttributes('textStyle').fontSize || '16px').replace('px', '')}
                 </div>
                 <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50"
                    onClick={() => {
                       const currentSize = (editor.getAttributes('textStyle').fontSize || '16px').replace('px', '');
                       const nextSize = Math.min(72, parseInt(currentSize) + 2);
                       editor.chain().focus().setFontSize(`${nextSize}px`).run();
                    }}
                 >
                    <span className="text-lg font-medium">+</span>
                 </Button>
              </div>

              <div className="flex items-center gap-0.5 px-1">
                <ToolbarButton
                  active={editor.isActive({ textAlign: "left" })}
                  onClick={() => editor.chain().focus().setTextAlign("left").run()}
                  icon={AlignLeft}
                  tooltip="Align Left"
                />
                <ToolbarButton
                  active={editor.isActive({ textAlign: "center" })}
                  onClick={() => editor.chain().focus().setTextAlign("center").run()}
                  icon={AlignCenter}
                  tooltip="Align Center"
                />
                <ToolbarButton
                  active={editor.isActive({ textAlign: "right" })}
                  onClick={() => editor.chain().focus().setTextAlign("right").run()}
                  icon={AlignRight}
                  tooltip="Align Right"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
             <Button
                variant="outline"
                size="sm"
                className="gap-2 text-gray-600"
                onClick={() => editor.chain().focus().undo().run()}
             >
                <Undo className="h-4 w-4" />
             </Button>
             <Button
                variant="outline"
                size="sm"
                className="gap-2 text-gray-600"
                onClick={() => editor.chain().focus().redo().run()}
             >
                <Redo className="h-4 w-4" />
             </Button>
             <div className="w-[1px] h-6 bg-gray-200 mx-2" />
             <Button
                onClick={handleCreatePDF}
                disabled={status === "processing"}
                className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg gap-2"
             >
                {status === "processing" ? (
                   "Processing..."
                ) : (
                   <>
                      <Download className="h-4 w-4" /> Create PDF
                   </>
                )}
             </Button>
          </div>
        </div>

        {/* Processing State */}
        {status !== "idle" && (
           <div className="fixed bottom-8 right-8 z-[60] w-80 animate-in slide-in-from-bottom-5">
              <ProcessingIndicator
                 status={status}
                 message="Converting your document..."
                 successMessage="PDF generated successfully!"
              />
           </div>
        )}

        {/* Document Editing Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-12 flex justify-center custom-scrollbar bg-neutral-100/80">
          <div
            className="bg-white shadow-[0_10px_40px_rgba(0,0,0,0.08),0_0_1px_rgba(0,0,0,0.1)] min-h-[29.7cm] p-[2.5cm] w-full max-w-[21.6cm] transition-all rounded-sm border border-neutral-200"
            id="document-canvas"
          >
            <div className="document-editor">
              <EditorContent editor={editor} />
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .document-editor .ProseMirror {
          min-height: 25cm;
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
          line-height: 1.6;
          color: #1a202c;
        }
        .document-editor .ProseMirror h1 {
          font-size: 2.5rem;
          font-weight: 800;
          margin-bottom: 1.5rem;
          color: #111827;
        }
        .document-editor .ProseMirror p {
          margin-bottom: 1.25rem;
        }
        .document-editor .ProseMirror ul, 
        .document-editor .ProseMirror ol {
          margin-bottom: 1.25rem;
          padding-left: 1.5rem;
        }
        .document-editor .ProseMirror li {
          margin-bottom: 0.5rem;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }
      `}</style>
    </ToolLayout>
  );
}

function ToolbarButton({ active, onClick, icon: Icon, tooltip }: { active: boolean, onClick: () => void, icon: any, tooltip: string }) {
  return (
    <Button
       variant={active ? "secondary" : "ghost"}
       size="icon"
       className={cn(
          "h-8 w-8 transition-colors",
          active ? "bg-emerald-100 text-emerald-700" : "text-gray-600 hover:bg-gray-100"
       )}
       onClick={onClick}
       title={tooltip}
    >
       <Icon className="h-4 w-4" />
    </Button>
  );
}

function Separator() {
  return <div className="w-[1px] h-4 bg-gray-300 mx-1" />;
}


