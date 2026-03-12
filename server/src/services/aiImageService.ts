import { GoogleGenerativeAI } from "@google/generative-ai";
import axios from "axios";

interface GenerateImageOptions {
  prompt: string;
  model: "dall-e-3" | "dall-e-2" | "stable-diffusion" | "free-model" | "gemini";
  size?: string;
  quality?: "standard" | "hd";
  style?: "vivid" | "natural";
  n?: number; // Number of images (for dall-e-2)
}

interface ImageGenerationResult {
  imageUrl?: string;
  images?: Array<{ url: string }>;
  error?: string;
}

export async function generateAIImage(options: GenerateImageOptions): Promise<ImageGenerationResult> {
  const { prompt, model, size, quality, style, n } = options;

  // Validate prompt
  if (!prompt || prompt.trim().length < 10) {
    throw new Error("Prompt must be at least 10 characters long");
  }

  // Route to appropriate provider
  switch (model) {
    case "dall-e-3":
    case "dall-e-2":
      try {
        return await generateWithOpenAI({ prompt, model, size, quality, style, n });
      } catch (error) {
        console.error("OpenAI failed, falling back to Gemini:", error);
        return await generateWithGemini({ prompt, size });
      }

    case "gemini":
      return await generateWithGemini({ prompt, size });

    case "stable-diffusion":
      return await generateWithFreeModel({ prompt, size });
    // return await generateWithStabilityAI({ prompt, size });                     

    case "free-model":
      return await generateWithFreeModel({ prompt, size });

    default:
      // Default to Gemini if model not recognized
      return await generateWithGemini({ prompt, size });
  }
}

/**
 * Generate image using OpenAI DALL-E
 */
async function generateWithOpenAI(options: {
  prompt: string;
  model: "dall-e-3" | "dall-e-2";
  size?: string;
  quality?: "standard" | "hd";
  style?: "vivid" | "natural";
  n?: number;
}): Promise<ImageGenerationResult> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OpenAI API key not configured. Please set OPENAI_API_KEY environment variable.");
  }

  const { prompt, model, size = "1024x1024", quality, style, n = 1 } = options;

  try {
    // Prepare request body based on model version
    const requestBody: any = {
      model,
      prompt: prompt.substring(0, model === "dall-e-3" ? 4000 : 1000), // DALL-E 3 has longer prompt limit
      n: model === "dall-e-2" ? Math.min(n || 1, 10) : 1, // DALL-E 3 only supports n=1
      size: model === "dall-e-3" ? size : (size === "1792x1024" || size === "1024x1792" ? "1024x1024" : size), // DALL-E 2 only supports 256x256, 512x512, 1024x1024
    };

    if (model === "dall-e-3") {
      if (quality) requestBody.quality = quality;
      if (style) requestBody.style = style;
    }

    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();

    // DALL-E 3 returns single image, DALL-E 2 returns array
    if (model === "dall-e-3" && data.data?.[0]?.url) {
      return {
        imageUrl: data.data[0].url,
      };
    } else if (model === "dall-e-2" && data.data) {
      return {
        images: data.data.map((item: any) => ({ url: item.url })),
        imageUrl: data.data[0]?.url, // First image as primary
      };
    }

    throw new Error("Unexpected response format from OpenAI");
  } catch (error: any) {
    console.error("OpenAI image generation error:", error);
    throw new Error(error.message || "Failed to generate image with OpenAI");
  }
}

/**
 * Generate image using Stability AI (Stable Diffusion)
 */
async function generateWithStabilityAI(options: {
  prompt: string;
  size?: string;
}): Promise<ImageGenerationResult> {
  const apiKey = process.env.STABILITY_AI_API_KEY;

  if (!apiKey) {
    throw new Error("Stability AI API key not configured. Please set STABILITY_AI_API_KEY environment variable.");
  }

  const { prompt, size = "1024x1024" } = options;

  try {
    // Parse size
    const [width, height] = size.split("x").map(Number);

    const response = await fetch("https://api.stability.ai/v2beta/stable-image/generate/core", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Accept": "image/*",
      },
      body: JSON.stringify({
        prompt,
        width,
        height,
        output_format: "png",
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Stability AI API error: ${response.statusText} - ${errorText}`);
    }

    // Stability AI returns the image directly as binary
    const imageBlob = await response.blob();

    // Convert blob to data URL for frontend
    // In production, you'd want to upload to cloud storage and return URL
    const arrayBuffer = await imageBlob.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    const dataUrl = `data:image/png;base64,${base64}`;

    return {
      imageUrl: dataUrl,
    };
  } catch (error: any) {
    console.error("Stability AI image generation error:", error);
    throw new Error(error.message || "Failed to generate image with Stability AI");
  }
}

/**
 * Fallback: Generate using Replicate API (alternative option)
 */
export async function generateWithReplicate(prompt: string, size?: string): Promise<ImageGenerationResult> {
  const apiKey = process.env.REPLICATE_API_TOKEN;

  if (!apiKey) {
    throw new Error("Replicate API token not configured. Please set REPLICATE_API_TOKEN environment variable.");
  }

  try {
    const response = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Token ${apiKey}`,
      },
      body: JSON.stringify({
        version: "ac732df83cea7fff18b8472768c88ada041de7502955442690ea9d36e55e08e38", // Stable Diffusion v2.1
        input: {
          prompt,
          width: 1024,
          height: 1024,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Replicate API error: ${response.statusText}`);
    }

    const data = await response.json();

    // Replicate returns a prediction that needs to be polled
    // This is a simplified version - in production, implement polling
    return {
      imageUrl: data.output?.[0] || data.urls?.get,
    };
  } catch (error: any) {
    console.error("Replicate image generation error:", error);
    throw new Error(error.message || "Failed to generate image with Replicate");
  }
}

async function generateWithFreeModel(options: {
  prompt: string;
  size?: string;
}): Promise<ImageGenerationResult> {
  const { prompt, size = "1024x1024" } = options;

  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  // Size → aspectRatio mapping
  const aspectRatioMap: Record<string, string> = {
    "1024x1024": "1:1",
    "1792x1024": "16:9",
    "1024x1792": "9:16",
  };
  const aspectRatio = aspectRatioMap[size] || "1:1";

  // Imagen 4 API endpoint (Imagen 3 shut down হয়ে গেছে)
  const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${apiKey}`;

  const body = {
    instances: [{ prompt }],
    parameters: {
      sampleCount: 1,
      aspectRatio,
      personGeneration: "ALLOW_ADULT",
      safetyFilterLevel: "BLOCK_MEDIUM_AND_ABOVE",
    },
  };

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error("Gemini Imagen API error:", errText);
    throw new Error(`Gemini API error ${response.status}: ${errText}`);
  }

  const data = await response.json();

  // Response format: data.predictions[].bytesBase64Encoded
  if (!data.predictions || data.predictions.length === 0) {
    console.error("Empty predictions from Gemini:", JSON.stringify(data));
    throw new Error("No image returned from Gemini API");
  }

  const prediction = data.predictions[0];
  const base64 = prediction.bytesBase64Encoded;
  const mimeType = prediction.mimeType || "image/png";

  if (!base64) {
    console.error("No bytesBase64Encoded in prediction:", JSON.stringify(prediction));
    throw new Error("No image bytes in Gemini response");
  }

  console.log(`✅ Gemini image generated: ${mimeType}, base64 length: ${base64.length}`);

  return { imageUrl: `data:${mimeType};base64,${base64}` };
}



/**
 * Generate image using Google Gemini (Imagen 3/4)
 */
async function generateWithGemini(options: {
  prompt: string;
  size?: string;
}): Promise<ImageGenerationResult> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("Gemini API key not configured. Please set GEMINI_API_KEY environment variable.");
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);

    // Try multiple model names as availability varies by region and API key
    const modelNames = [
      "imagen-3.0-generate-001",
      "imagen-3.0-fast-generate-001",
      "imagen-3.0-v1",
      "gemini-2.5-flash-image",
      "imagen-4.0-generate-001"
    ];
    let lastError = "";

    for (const modelName of modelNames) {
      try {
        console.log(`Trying Gemini model: ${modelName}`);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(options.prompt);
        const response = await result.response;

        const candidates = response.candidates;
        if (candidates && candidates.length > 0) {
          const content = candidates[0].content;
          if (content && content.parts && content.parts.length > 0) {
            const part = content.parts[0];
            if (part.inlineData) {
              const base64Image = part.inlineData.data;
              const mimeType = part.inlineData.mimeType || "image/png";
              return {
                imageUrl: `data:${mimeType};base64,${base64Image}`,
              };
            }
          }
        }
      } catch (e: any) {
        lastError = e.message;
        console.warn(`Failed with ${modelName}: ${e.message}`);
        continue; // Try next model
      }
    }

    throw new Error(lastError || "Gemini did not return an image in the expected format.");
  } catch (error: any) {
    console.error("Gemini image generation error:", error);
    throw new Error(error.message || "Failed to generate image with Gemini");
  }
}

