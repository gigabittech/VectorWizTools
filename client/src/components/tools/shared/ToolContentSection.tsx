import DOMPurify from 'dompurify';
import { Container, Title, Text, Stack, Box } from "@mantine/core";
import { motion } from "framer-motion";

interface ToolContentSectionProps {
    contents: {
        h1Title?: string | null;
        introContent?: string | null;
        howToUse?: string | null;
        features?: string | null;
        bottomContent?: string | null;
    };
}

export default function ToolContentSection({ contents }: ToolContentSectionProps) {
    if (!contents) return null;

    const { h1Title, introContent, howToUse, features, bottomContent } = contents;

    // If all fields are empty, don't render anything
    if (!h1Title && !introContent && !howToUse && !features && !bottomContent) {
        return null;
    }

    const sanitizeAndRender = (content: string | null | undefined) => {
        if (!content) return null;
        return <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content) }} />;
    };

    return (
        <motion.section
            className="py-16 px-4 mt-5 mb-5 overflow-hidden relative"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
        >
            {/* Background Accents */}
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-green-100/30 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-blue-100/30 rounded-full blur-3xl pointer-events-none" />

            <Container size="lg" className="relative z-10">
                <Stack gap="xl">
                    {/* Main Title Section */}
                    {(h1Title || introContent) && (
                        <div className="text-center">
                            {h1Title && (
                                <div className="text-2xl md:text-3xl font-extrabold text-[#06183C] leading-tight mb-2">
                                    {sanitizeAndRender(h1Title)}
                                </div>
                            )}

                            {introContent && (
                                <div className="text-lg text-gray-600 leading-relaxed max-w-3xl mx-auto">
                                    {sanitizeAndRender(introContent)}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Integrated Content Sections */}
                    <div className="prose prose-lg prose-slate max-w-none 
                        prose-headings:text-[#06183C] prose-headings:font-bold
                        prose-a:text-[#0B9F47] prose-a:no-underline hover:prose-a:underline
                        prose-strong:text-[#06183C] prose-strong:font-semibold
                        prose-img:rounded-2xl prose-img:shadow-lg
                        prose-table:border prose-table:border-gray-200 prose-table:rounded-xl prose-table:overflow-hidden
                        prose-thead:bg-gray-50 prose-th:px-6 prose-th:py-4 prose-th:text-[#06183C]
                        prose-td:px-2 prose-td:py-4 prose-td:text-gray-600 prose-td:border-t prose-td:border-gray-100
                        prose-ul:list-disc prose-ul:pl-6 prose-ol:list-decimal prose-ol:pl-6
                        prose-li:my-0.5 prose-li:text-gray-600
                        ">
                        {/* How To Use */}
                        {howToUse && (
                            <Box className="mb-8">
                                {sanitizeAndRender(howToUse)}
                            </Box>
                        )}

                        {/* Features Wrapper with optional spacing */}
                        {features && (
                            <div className="mb-5">
                                {sanitizeAndRender(features)}
                            </div>
                        )}

                        {/* Bottom Content */}
                        {bottomContent && (
                            <Box className="mt-2 pt-0 border-t border-gray-100">
                                {sanitizeAndRender(bottomContent)}
                            </Box>
                        )}
                    </div>
                </Stack>
            </Container>
        </motion.section>
    );
}
