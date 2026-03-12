export async function convertPptxToPdf(file: File): Promise<Blob> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/tools/api/tools/pptx-to-pdf", {
        method: "POST",
        body: formData,
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to convert PPTX to PDF");
    }

    return await response.blob();
}
