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
      try {
        return await generateWithGemini({ prompt, size });
      } catch (error: any) {
        if (error.message.includes("paid plan") || error.message.includes("quota")) {
          console.log("Gemini requires paid plan, falling back to Free Model (Pollinations)...");
          return await generateWithPollinations({ prompt, size });
        }
        throw error;
      }

    case "stable-diffusion":
      return await generateWithPollinations({ prompt, size });

    case "free-model":
      return await generateWithPollinations({ prompt, size });

    default:
      // Default to Pollinations if model not recognized
      return await generateWithPollinations({ prompt, size });
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

/**
 * Generate using Pollinations.ai (Truly FREE, no API key required)
 * This is the best fallback for free users
 */
async function generateWithPollinations(options: {
  prompt: string;
  size?: string;
}): Promise<ImageGenerationResult> {
  const { prompt, size = "1024x1024" } = options;

  // Parse size
  const [width, height] = size.split("x").map(Number);

  // Pollinations.ai simple URL generation
  const seed = Math.floor(Math.random() * 1000000);
  const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${width || 1024}&height=${height || 1024}&seed=${seed}&nologo=true`;

  console.log(`✅ Success with Pollinations AI: ${imageUrl}`);

  return { imageUrl };
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
      "imagen-3.0-fast-generate-001"
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


/**
 * Analyze an image using Google Gemini (OCR / Text Extraction)
 * Direct API Call Implementation for Maximum Reliability
 */

export async function analyzeImage(imageBuffer: Buffer, mimeType: string): Promise<{ text: string }> {
  const apiKey = process.env.GEMINI_API_KEY || "";

  if (!apiKey.trim()) {
    throw new Error("GEMINI_API_KEY is not set in environment variables.");
  }

  const supportedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  const mediaType = supportedTypes.includes(mimeType) ? mimeType : "image/jpeg";

  console.log(`[OCR] GEMINI_API_KEY found: ${apiKey.substring(0, 12)}...`);

  // ✅ আপনার API key এ verified available models
  const models = [
    "gemini-2.0-flash",
    "gemini-2.0-flash-001",
    "gemini-2.5-flash",
  ];

  let lastError = "";

  for (const model of models) {
    try {
      console.log(`[OCR] Trying: ${model}`);

      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey.trim()}`,
        {
          contents: [{
            parts: [
              {
                inline_data: {
                  mime_type: mediaType,
                  data: imageBuffer.toString("base64"),
                }
              },
              {
                text: `You are a precise OCR engine. Extract ALL visible text from this image exactly as it appears.

Rules:
- Preserve original line breaks and paragraph structure
- Keep all punctuation, numbers, special characters exactly as shown
- Do NOT add commentary, explanations, or markdown formatting
- Do NOT correct spelling mistakes — extract text exactly as-is
- If handwritten, transcribe as accurately as possible
- Output ONLY the raw extracted text, nothing else`
              }
            ]
          }],
          generationConfig: {
            temperature: 0,
            maxOutputTokens: 4096,
          }
        },
        {
          headers: { "Content-Type": "application/json" },
          timeout: 60000,
        }
      );

      const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (text?.trim()) {
        console.log(`[OCR] ✅ Success with ${model}! ${text.length} chars extracted.`);
        return { text: text.trim() };
      }

      lastError = `${model} returned empty response`;

    } catch (error: any) {
      const status = error.response?.status;
      lastError = error.response?.data?.error?.message || error.message;
      console.warn(`[OCR] ❌ ${model} failed (${status}): ${lastError}`);

      if (status === 400 || status === 403) {
        throw new Error(`Gemini API Error (${status}): ${lastError}`);
      }

      continue;
    }
  }

  throw new Error(`OCR failed. Last error: ${lastError}`);
}

/**
 * Translate text within an image using Google Gemini
 * Handles both OCR and translation to any target language
 */
export async function translateImage(
  imageBuffer: Buffer,
  mimeType: string,
  targetLanguage: string
): Promise<{ text: string; translatedText: string }> {
  const apiKey = process.env.GEMINI_API_KEY || "";

  if (!apiKey.trim()) {
    throw new Error("GEMINI_API_KEY is not set in environment variables.");
  }

  const supportedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  const mediaType = supportedTypes.includes(mimeType) ? mimeType : "image/jpeg";

  const models = [
    "gemini-2.0-flash",
    "gemini-2.0-flash-001",
    "gemini-2.0-flash-lite",
    "gemini-2.0-flash-lite-001",
    "gemini-2.5-flash",
  ];

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  let lastError = "";

  for (const model of models) {
    // প্রতিটা model এ ২ বার try করবে (overload হলে একটু wait করে)
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        console.log(`[Translate] Trying: ${model} | Attempt: ${attempt} -> Target: ${targetLanguage}`);

        const response = await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey.trim()}`,
          {
            contents: [{
              parts: [
                {
                  inline_data: {
                    mime_type: mediaType,
                    data: imageBuffer.toString("base64"),
                  }
                },
                {
                  text: `You are a professional polyglot translator and OCR engine.

1. Extract ALL visible text from this image exactly as it appears.
2. Translate the extracted text into ${targetLanguage}.

Output your response in valid JSON format:
{
  "original_text": "the raw extracted text with line breaks",
  "translated_text": "the high-quality translation into ${targetLanguage}"
}

Rules:
- Preserve structural integrity and meaning.
- Maintain original line breaks in original_text.
- Do NOT include any explanations or commentary outside the JSON.`
                }
              ]
            }],
            generationConfig: {
              temperature: 0.1,
              maxOutputTokens: 8192,
              response_mime_type: "application/json",
            }
          },
          {
            headers: { "Content-Type": "application/json" },
            timeout: 60000,
          }
        );

        const resultText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (resultText?.trim()) {
          try {
            const parsed = JSON.parse(resultText);
            if (parsed.original_text && parsed.translated_text) {
              console.log(`[Translate] ✅ Success with ${model}!`);
              return {
                text: parsed.original_text,
                translatedText: parsed.translated_text
              };
            }
          } catch (e) {
            console.warn("[Translate] JSON parse failed, returning raw text as fallback");
            return {
              text: resultText.trim(),
              translatedText: resultText.trim()
            };
          }
        }

        lastError = `${model} returned empty response`;
        break; // empty response হলে next model try করো

      } catch (error: any) {
        const status = error.response?.status;
        lastError = error.response?.data?.error?.message || error.message;
        console.warn(`[Translate] ❌ ${model} attempt ${attempt} failed (${status}): ${lastError}`);

        // 400/403 = key বা request problem, retry করে লাভ নেই
        if (status === 400 || status === 403) {
          throw new Error(`Gemini API Error (${status}): ${lastError}`);
        }

        // 503/429/overload = wait করে retry
        if (status === 503 || status === 429 || lastError.includes("high demand") || lastError.includes("overload")) {
          if (attempt === 1) {
            console.log(`[Translate] Server busy, waiting 3s before retry...`);
            await sleep(3000); // ৩ সেকেন্ড wait করে আবার try
            continue;
          }
          // attempt 2 ও fail হলে next model এ যাও
          break;
        }

        break;
      }
    }
  }

  throw new Error(`সব model busy আছে। একটু পরে আবার try করুন।`);
}