import { RichTextEditor, Link } from '@mantine/tiptap';
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import { useEffect } from 'react';
import { Text } from '@mantine/core';
import {
    Plus,
    Trash2,
    Columns,
    Rows,
    CheckSquare,
    Square
} from 'lucide-react';

interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    label?: string;
}

export function CustomRichTextEditor({ value, onChange, label }: RichTextEditorProps) {
    const editor = useEditor({
        extensions: [
            StarterKit,
            Underline,
            Link,
            Highlight,
            TextAlign.configure({ types: ['heading', 'paragraph'] }),
            Table.configure({
                resizable: true,
            }),
            TableRow,
            TableHeader,
            TableCell,
        ],
        content: value,
        onUpdate({ editor }) {
            onChange(editor.getHTML());
        },
    });

    // Sync value if changed from outside
    useEffect(() => {
        if (editor && value !== editor.getHTML()) {
            editor.commands.setContent(value);
        }
    }, [value, editor]);

    if (!editor) return null;

    return (
        <div className="space-y-1">
            {label && <Text size="sm" fw={500} mb={4}>{label}</Text>}
            <RichTextEditor editor={editor} className="overflow-hidden border border-gray-200 rounded-lg shadow-sm focus-within:ring-2 focus-within:ring-green-500/20 focus-within:border-green-500 transition-all bg-white font-sans">
                <RichTextEditor.Toolbar sticky stickyOffset={0}>
                    <RichTextEditor.ControlsGroup>
                        <RichTextEditor.Bold />
                        <RichTextEditor.Italic />
                        <RichTextEditor.Underline />
                        <RichTextEditor.Strikethrough />
                        <RichTextEditor.Highlight />
                        <RichTextEditor.ClearFormatting />
                    </RichTextEditor.ControlsGroup>

                    <RichTextEditor.ControlsGroup>
                        <RichTextEditor.H1 />
                        <RichTextEditor.H2 />
                        <RichTextEditor.H3 />
                        <RichTextEditor.H4 />
                    </RichTextEditor.ControlsGroup>

                    <RichTextEditor.ControlsGroup>
                        <RichTextEditor.BulletList />
                        <RichTextEditor.OrderedList />
                    </RichTextEditor.ControlsGroup>

                    <RichTextEditor.ControlsGroup>
                        <RichTextEditor.Link />
                        <RichTextEditor.Unlink />
                    </RichTextEditor.ControlsGroup>

                    <RichTextEditor.ControlsGroup>
                        <RichTextEditor.AlignLeft />
                        <RichTextEditor.AlignCenter />
                        <RichTextEditor.AlignJustify />
                        <RichTextEditor.AlignRight />
                    </RichTextEditor.ControlsGroup>

                    <RichTextEditor.ControlsGroup>
                        <RichTextEditor.Control
                            onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
                            aria-label="Insert table"
                            title="Insert table"
                        >
                            <Plus size={16} />
                        </RichTextEditor.Control>
                        <RichTextEditor.Control
                            onClick={() => editor.chain().focus().addColumnAfter().run()}
                            title="Add column after"
                        >
                            <Columns size={16} />
                        </RichTextEditor.Control>
                        <RichTextEditor.Control
                            onClick={() => editor.chain().focus().addRowAfter().run()}
                            title="Add row after"
                        >
                            <Rows size={16} />
                        </RichTextEditor.Control>
                        <RichTextEditor.Control
                            onClick={() => editor.chain().focus().deleteTable().run()}
                            title="Delete table"
                            className="text-red-500 hover:bg-red-50"
                        >
                            <Trash2 size={16} />
                        </RichTextEditor.Control>
                    </RichTextEditor.ControlsGroup>
                </RichTextEditor.Toolbar>

                <RichTextEditor.Content className="min-h-[200px]" />
            </RichTextEditor>
        </div>
    );
}
