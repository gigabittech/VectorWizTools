/**
 * AI Image Generation Service
 * Supports multiple providers: OpenAI DALL-E, Stability AI, Replicate
 */

interface GenerateImageOptions {
  prompt: string;
  model: "dall-e-3" | "dall-e-2" | "stable-diffusion";
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
      return await generateWithOpenAI({ prompt, model, size, quality, style, n });
    
    case "stable-diffusion":
      return await generateWithStabilityAI({ prompt, size });
    
    default:
      throw new Error(`Unsupported model: ${model}`);
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

