export interface ImageAnalysisResult {
  width: number;
  height: number;
  resolutionScore: number;
  colorScore: number;
  detailScore: number;
  backgroundScore: number;
  objectCountScore: number;
  qualityScore: number;
  finalScore: number;
  complexityTier: "SIMPLE" | "MEDIUM" | "COMPLEX";
  analysisData: {
    uniqueColors: number;
    avgBrightness: number;
    hasTransparency: boolean;
    edgeDensity: number;
    colorVariance: number;
  };
}

export interface QuickEstimate {
  estimatedPrice: number;
  complexityTier: "SIMPLE" | "MEDIUM" | "COMPLEX";
  processingTime: string;
}

export async function analyzeImage(file: File): Promise<ImageAnalysisResult> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    if (!ctx) {
      reject(new Error("Could not get canvas context"));
      return;
    }

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      try {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const analysis = performAnalysis(imageData, canvas.width, canvas.height);
        resolve(analysis);
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error("Failed to load image"));
    };

    img.src = URL.createObjectURL(file);
  });
}

function performAnalysis(
  imageData: ImageData,
  width: number,
  height: number
): ImageAnalysisResult {
  const pixels = imageData.data;
  const totalPixels = width * height;

  const resolutionScore = calculateResolutionScore(width, height);
  
  const colorAnalysis = analyzeColors(pixels);
  const colorScore = calculateColorScore(colorAnalysis.uniqueColors, colorAnalysis.colorVariance);
  
  const detailScore = calculateDetailScore(pixels, width, height);
  
  const backgroundScore = calculateBackgroundScore(pixels, width, height);
  
  const objectCountScore = estimateObjectCount(pixels, width, height);
  
  const qualityScore = calculateQualityScore(
    colorAnalysis.avgBrightness,
    colorAnalysis.colorVariance
  );

  const weightedScores = {
    resolution: resolutionScore * 0.15,
    color: colorScore * 0.20,
    detail: detailScore * 0.25,
    background: backgroundScore * 0.15,
    objectCount: objectCountScore * 0.15,
    quality: qualityScore * 0.10,
  };

  const finalScore = Math.round(
    Object.values(weightedScores).reduce((sum, score) => sum + score, 0)
  );

  let complexityTier: "SIMPLE" | "MEDIUM" | "COMPLEX";
  if (finalScore <= 30) {
    complexityTier = "SIMPLE";
  } else if (finalScore <= 60) {
    complexityTier = "MEDIUM";
  } else {
    complexityTier = "COMPLEX";
  }

  return {
    width,
    height,
    resolutionScore,
    colorScore,
    detailScore,
    backgroundScore,
    objectCountScore,
    qualityScore,
    finalScore,
    complexityTier,
    analysisData: {
      uniqueColors: colorAnalysis.uniqueColors,
      avgBrightness: colorAnalysis.avgBrightness,
      hasTransparency: colorAnalysis.hasTransparency,
      edgeDensity: colorAnalysis.edgeDensity,
      colorVariance: colorAnalysis.colorVariance,
    },
  };
}

function calculateResolutionScore(width: number, height: number): number {
  const totalPixels = width * height;
  
  if (totalPixels < 500 * 500) return 10;
  if (totalPixels < 1000 * 1000) return 30;
  if (totalPixels < 2000 * 2000) return 50;
  if (totalPixels < 4000 * 4000) return 75;
  return 100;
}

function analyzeColors(pixels: Uint8ClampedArray) {
  const colorMap = new Map<string, number>();
  let totalBrightness = 0;
  let hasTransparency = false;
  let colorVariance = 0;

  const sampleRate = Math.max(1, Math.floor(pixels.length / (4 * 10000)));

  for (let i = 0; i < pixels.length; i += 4 * sampleRate) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    const a = pixels[i + 3];

    if (a < 255) hasTransparency = true;

    const colorKey = `${Math.floor(r / 16)},${Math.floor(g / 16)},${Math.floor(b / 16)}`;
    colorMap.set(colorKey, (colorMap.get(colorKey) || 0) + 1);

    const brightness = (r + g + b) / 3;
    totalBrightness += brightness;
  }

  const sampledPixels = pixels.length / (4 * sampleRate);
  const avgBrightness = totalBrightness / sampledPixels;

  let brightnessVariance = 0;
  for (let i = 0; i < pixels.length; i += 4 * sampleRate) {
    const brightness = (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;
    brightnessVariance += Math.pow(brightness - avgBrightness, 2);
  }
  colorVariance = Math.sqrt(brightnessVariance / sampledPixels);

  const edgeDensity = calculateEdgeDensity(pixels);

  return {
    uniqueColors: colorMap.size,
    avgBrightness,
    hasTransparency,
    edgeDensity,
    colorVariance,
  };
}

function calculateColorScore(uniqueColors: number, colorVariance: number): number {
  let score = 0;

  if (uniqueColors < 10) score += 10;
  else if (uniqueColors < 50) score += 30;
  else if (uniqueColors < 200) score += 50;
  else if (uniqueColors < 500) score += 75;
  else score += 100;

  if (colorVariance < 30) score = Math.min(score, 40);
  else if (colorVariance < 60) score = Math.min(score, 70);

  return Math.min(100, score);
}

function calculateDetailScore(
  pixels: Uint8ClampedArray,
  width: number,
  height: number
): number {
  const edgeDensity = calculateEdgeDensity(pixels);

  if (edgeDensity < 0.1) return 20;
  if (edgeDensity < 0.25) return 40;
  if (edgeDensity < 0.5) return 60;
  if (edgeDensity < 0.75) return 80;
  return 100;
}

function calculateEdgeDensity(pixels: Uint8ClampedArray): number {
  let edgeCount = 0;
  const sampleRate = Math.max(1, Math.floor(pixels.length / (4 * 5000)));
  const threshold = 30;

  for (let i = 0; i < pixels.length - 4; i += 4 * sampleRate) {
    const current = (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;
    const next = (pixels[i + 4] + pixels[i + 5] + pixels[i + 6]) / 3;

    if (Math.abs(current - next) > threshold) {
      edgeCount++;
    }
  }

  return edgeCount / (pixels.length / (4 * sampleRate));
}

function calculateBackgroundScore(
  pixels: Uint8ClampedArray,
  width: number,
  height: number
): number {
  const cornerSamples: number[] = [];
  const sampleSize = Math.min(50, Math.floor(width / 10), Math.floor(height / 10));

  const regions = [
    { x: 0, y: 0 },
    { x: width - sampleSize, y: 0 },
    { x: 0, y: height - sampleSize },
    { x: width - sampleSize, y: height - sampleSize },
  ];

  for (const region of regions) {
    let totalSimilarity = 0;
    let count = 0;

    for (let dy = 0; dy < sampleSize; dy += 5) {
      for (let dx = 0; dx < sampleSize; dx += 5) {
        const x = Math.min(region.x + dx, width - 1);
        const y = Math.min(region.y + dy, height - 1);
        const i = (y * width + x) * 4;

        if (i < pixels.length - 3) {
          const brightness = (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;
          totalSimilarity += brightness;
          count++;
        }
      }
    }

    if (count > 0) {
      cornerSamples.push(totalSimilarity / count);
    }
  }

  const avgCorner = cornerSamples.reduce((a, b) => a + b, 0) / cornerSamples.length;
  const variance = cornerSamples.reduce((sum, val) => sum + Math.pow(val - avgCorner, 2), 0) / cornerSamples.length;

  if (variance < 100) return 20;
  if (variance < 500) return 40;
  if (variance < 1000) return 60;
  if (variance < 2000) return 80;
  return 100;
}

function estimateObjectCount(
  pixels: Uint8ClampedArray,
  width: number,
  height: number
): number {
  const sampleRate = Math.max(1, Math.floor(width * height / 10000));
  let transitionCount = 0;
  const threshold = 40;

  for (let y = 0; y < height; y += sampleRate) {
    for (let x = 0; x < width - 1; x += sampleRate) {
      const i = (y * width + x) * 4;
      const current = (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;
      const next = (pixels[i + 4] + pixels[i + 5] + pixels[i + 6]) / 3;

      if (Math.abs(current - next) > threshold) {
        transitionCount++;
      }
    }
  }

  const normalizedCount = transitionCount / ((width / sampleRate) * (height / sampleRate));

  if (normalizedCount < 0.05) return 10;
  if (normalizedCount < 0.15) return 30;
  if (normalizedCount < 0.30) return 50;
  if (normalizedCount < 0.50) return 75;
  return 100;
}

function calculateQualityScore(avgBrightness: number, colorVariance: number): number {
  let score = 100;

  if (avgBrightness < 50 || avgBrightness > 200) score -= 20;
  
  if (colorVariance < 20) score -= 30;
  else if (colorVariance > 100) score -= 10;

  return Math.max(0, score);
}

export function getQuickEstimate(
  analysis: ImageAnalysisResult,
  serviceType: string,
  basePrice: number
): QuickEstimate {
  let multiplier = 1.0;
  
  switch (analysis.complexityTier) {
    case "SIMPLE":
      multiplier = 1.0;
      break;
    case "MEDIUM":
      multiplier = 1.5;
      break;
    case "COMPLEX":
      multiplier = 2.5;
      break;
  }

  const estimatedPrice = Math.round(basePrice * multiplier);

  let processingTime = "2-3 business days";
  if (analysis.complexityTier === "MEDIUM") {
    processingTime = "3-5 business days";
  } else if (analysis.complexityTier === "COMPLEX") {
    processingTime = "5-7 business days";
  }

  return {
    estimatedPrice,
    complexityTier: analysis.complexityTier,
    processingTime,
  };
}

export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}
