import sharp from "sharp";

export interface ServerImageAnalysisResult {
  width: number;
  height: number;
  format: string;
  space: string;
  channels: number;
  hasAlpha: boolean;
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
    dominantColors: Array<{ r: number; g: number; b: number; count: number }>;
    avgBrightness: number;
    hasTransparency: boolean;
    edgeDensity: number;
    colorVariance: number;
    isGrayscale: boolean;
    density: number;
  };
}

export async function analyzeImageFromBuffer(
  buffer: Buffer
): Promise<ServerImageAnalysisResult> {
  const image = sharp(buffer);
  const metadata = await image.metadata();

  if (!metadata.width || !metadata.height) {
    throw new Error("Unable to extract image dimensions");
  }

  const { width, height } = metadata;
  const format = metadata.format || "unknown";
  const space = metadata.space || "unknown";
  const channels = metadata.channels || 3;
  const hasAlpha = metadata.hasAlpha || false;

  const rawImageData = await image
    .resize(Math.min(width, 2000), Math.min(height, 2000), {
      fit: "inside",
      withoutEnlargement: true,
    })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { data, info } = rawImageData;
  const resizedWidth = info.width;
  const resizedHeight = info.height;
  const channelCount = info.channels;

  const resolutionScore = calculateResolutionScore(width, height);

  const colorAnalysis = await analyzeColors(data, channelCount);
  const colorScore = calculateColorScore(
    colorAnalysis.uniqueColors,
    colorAnalysis.colorVariance,
    colorAnalysis.isGrayscale
  );

  const detailScore = calculateDetailScore(
    data,
    resizedWidth,
    resizedHeight,
    channelCount
  );

  const backgroundScore = calculateBackgroundScore(
    data,
    resizedWidth,
    resizedHeight,
    channelCount
  );

  const objectCountScore = estimateObjectCount(
    data,
    resizedWidth,
    resizedHeight,
    channelCount
  );

  const qualityScore = calculateQualityScore(
    colorAnalysis.avgBrightness,
    colorAnalysis.colorVariance,
    metadata.density || 72
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
    format,
    space,
    channels,
    hasAlpha,
    resolutionScore,
    colorScore,
    detailScore,
    backgroundScore,
    objectCountScore,
    qualityScore,
    finalScore,
    complexityTier,
    analysisData: {
      ...colorAnalysis,
      density: metadata.density || 72,
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

async function analyzeColors(
  pixels: Buffer,
  channels: number
): Promise<{
  uniqueColors: number;
  dominantColors: Array<{ r: number; g: number; b: number; count: number }>;
  avgBrightness: number;
  hasTransparency: boolean;
  edgeDensity: number;
  colorVariance: number;
  isGrayscale: boolean;
}> {
  const colorMap = new Map<string, number>();
  let totalBrightness = 0;
  let hasTransparency = false;
  let isGrayscale = true;

  const sampleRate = Math.max(1, Math.floor(pixels.length / (channels * 20000)));
  let sampledPixels = 0;

  for (let i = 0; i < pixels.length; i += channels * sampleRate) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    const a = channels === 4 ? pixels[i + 3] : 255;

    if (a < 255) hasTransparency = true;

    if (Math.abs(r - g) > 10 || Math.abs(g - b) > 10 || Math.abs(r - b) > 10) {
      isGrayscale = false;
    }

    const colorKey = `${Math.floor(r / 8)},${Math.floor(g / 8)},${Math.floor(b / 8)}`;
    colorMap.set(colorKey, (colorMap.get(colorKey) || 0) + 1);

    const brightness = (r + g + b) / 3;
    totalBrightness += brightness;
    sampledPixels++;
  }

  const avgBrightness = totalBrightness / sampledPixels;

  let brightnessVariance = 0;
  for (let i = 0; i < pixels.length; i += channels * sampleRate) {
    const brightness = (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;
    brightnessVariance += Math.pow(brightness - avgBrightness, 2);
  }
  const colorVariance = Math.sqrt(brightnessVariance / sampledPixels);

  const sortedColors = Array.from(colorMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([key, count]) => {
      const [r, g, b] = key.split(",").map((v) => parseInt(v) * 8);
      return { r, g, b, count };
    });

  const edgeDensity = calculateEdgeDensityFromBuffer(pixels, channels);

  return {
    uniqueColors: colorMap.size,
    dominantColors: sortedColors,
    avgBrightness,
    hasTransparency,
    edgeDensity,
    colorVariance,
    isGrayscale,
  };
}

function calculateColorScore(
  uniqueColors: number,
  colorVariance: number,
  isGrayscale: boolean
): number {
  let score = 0;

  if (uniqueColors < 10) score += 10;
  else if (uniqueColors < 50) score += 30;
  else if (uniqueColors < 200) score += 50;
  else if (uniqueColors < 500) score += 75;
  else score += 100;

  if (isGrayscale) {
    score = Math.min(score, 40);
  }

  if (colorVariance < 30) score = Math.min(score, 40);
  else if (colorVariance < 60) score = Math.min(score, 70);

  return Math.min(100, score);
}

function calculateDetailScore(
  pixels: Buffer,
  width: number,
  height: number,
  channels: number
): number {
  const edgeDensity = calculateEdgeDensityFromBuffer(pixels, channels);

  if (edgeDensity < 0.1) return 20;
  if (edgeDensity < 0.25) return 40;
  if (edgeDensity < 0.5) return 60;
  if (edgeDensity < 0.75) return 80;
  return 100;
}

function calculateEdgeDensityFromBuffer(
  pixels: Buffer,
  channels: number
): number {
  let edgeCount = 0;
  const sampleRate = Math.max(1, Math.floor(pixels.length / (channels * 10000)));
  const threshold = 30;
  let sampledPixels = 0;

  for (let i = 0; i < pixels.length - channels; i += channels * sampleRate) {
    const current = (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;
    const next =
      (pixels[i + channels] + pixels[i + channels + 1] + pixels[i + channels + 2]) / 3;

    if (Math.abs(current - next) > threshold) {
      edgeCount++;
    }
    sampledPixels++;
  }

  return sampledPixels > 0 ? edgeCount / sampledPixels : 0;
}

function calculateBackgroundScore(
  pixels: Buffer,
  width: number,
  height: number,
  channels: number
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
        const i = (y * width + x) * channels;

        if (i < pixels.length - channels + 1) {
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

  if (cornerSamples.length === 0) return 50;

  const avgCorner =
    cornerSamples.reduce((a, b) => a + b, 0) / cornerSamples.length;
  const variance =
    cornerSamples.reduce((sum, val) => sum + Math.pow(val - avgCorner, 2), 0) /
    cornerSamples.length;

  if (variance < 100) return 20;
  if (variance < 500) return 40;
  if (variance < 1000) return 60;
  if (variance < 2000) return 80;
  return 100;
}

function estimateObjectCount(
  pixels: Buffer,
  width: number,
  height: number,
  channels: number
): number {
  const sampleRate = Math.max(1, Math.floor((width * height) / 10000));
  let transitionCount = 0;
  const threshold = 40;
  let sampledPixels = 0;

  for (let y = 0; y < height; y += sampleRate) {
    for (let x = 0; x < width - 1; x += sampleRate) {
      const i = (y * width + x) * channels;
      if (i + channels < pixels.length) {
        const current = (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;
        const next =
          (pixels[i + channels] +
            pixels[i + channels + 1] +
            pixels[i + channels + 2]) /
          3;

        if (Math.abs(current - next) > threshold) {
          transitionCount++;
        }
        sampledPixels++;
      }
    }
  }

  const normalizedCount = sampledPixels > 0 ? transitionCount / sampledPixels : 0;

  if (normalizedCount < 0.05) return 10;
  if (normalizedCount < 0.15) return 30;
  if (normalizedCount < 0.30) return 50;
  if (normalizedCount < 0.50) return 75;
  return 100;
}

function calculateQualityScore(
  avgBrightness: number,
  colorVariance: number,
  density: number
): number {
  let score = 100;

  if (avgBrightness < 50 || avgBrightness > 200) score -= 20;

  if (colorVariance < 20) score -= 30;
  else if (colorVariance > 100) score -= 10;

  if (density < 72) score -= 15;
  else if (density >= 300) score += 0;

  return Math.max(0, score);
}
