import { Accordion, Title, Container, Paper } from "@mantine/core";
import { HelpCircle } from "lucide-react";
import { motion } from "framer-motion";

interface FAQItem {
    question: string;
    answer: string;
}

interface FAQSectionProps {
    faqs: FAQItem[];
}

export default function FAQSection({ faqs }: FAQSectionProps) {
    if (!faqs || faqs.length === 0) return null;

    return (
        <motion.section
            className="py-16 px-4 bg-white/50 backdrop-blur-sm mt-12"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
        >
            <Container size="lg">
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center p-3 bg-green-100 rounded-full mb-4">
                        <HelpCircle className="h-6 w-6 text-green-600" />
                    </div>
                    <Title order={2} className="text-3xl font-bold mb-4">
                        Frequently Asked Questions
                    </Title>
                    <p className="text-gray-600 max-w-2xl mx-auto">
                        Find answers to common questions about using our tools and getting the best results.
                    </p>
                </div>

                <Paper withBorder shadow="sm" radius="lg" className="overflow-hidden bg-white">
                    <Accordion variant="separated" radius="md" chevronPosition="right">
                        {faqs.map((faq, index) => (
                            <Accordion.Item key={index} value={`faq-${index}`} className="border-b last:border-b-0">
                                <Accordion.Control className="hover:bg-gray-50 transition-colors py-4">
                                    <span className="font-semibold text-gray-800">{faq.question}</span>
                                </Accordion.Control>
                                <Accordion.Panel className="text-gray-600 leading-relaxed pb-6">
                                    {faq.answer}
                                </Accordion.Panel>
                            </Accordion.Item>
                        ))}
                    </Accordion>
                </Paper>
            </Container>
        </motion.section>
    );
}
