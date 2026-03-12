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

  const encodedPrompt = encodeURIComponent(prompt);
  const parts = size.split("x");
  const width = parts[0] || "1024";
  const height = parts[1] || "1024";

  const pollinationUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&nologo=true&seed=${Math.floor(Math.random() * 1000000)}`;

  try {
    const response = await axios.get(pollinationUrl, {
      responseType: 'arraybuffer',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'image/png,image/jpeg,image/*',
      },
      timeout: 60000,
      maxRedirects: 5,
    });

    const rawContentType = response.headers['content-type'] || 'image/png';
    const mimeType = rawContentType.split(';')[0].trim();

    // ⚠️ Critical check: যদি image না আসে তাহলে error throw করো
    if (!mimeType.startsWith('image/')) {
      const responseText = Buffer.from(response.data as ArrayBuffer).toString('utf-8').substring(0, 200);
      console.error("Non-image response from Pollinations:", responseText);
      throw new Error(`Expected image but got: ${mimeType}`);
    }

    // ⚠️ Check minimum size (valid image হলে কমপক্ষে 1KB হবে)
    const dataBuffer = Buffer.from(response.data as ArrayBuffer);
    if (dataBuffer.length < 1024) {
      console.error("Response too small, likely an error:", dataBuffer.toString('utf-8'));
      throw new Error("Response too small to be a valid image");
    }

    const base64 = dataBuffer.toString('base64');
    const dataUrl = `data:${mimeType};base64,${base64}`;

    console.log(`✅ Image generated: ${mimeType}, size: ${dataBuffer.length} bytes`);

    return { imageUrl: dataUrl };

  } catch (error: any) {
    console.error("Free model generation error:", error.message);
    throw new Error(`Image generation failed: ${error.message}`);
  }
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

