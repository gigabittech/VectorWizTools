import { storage } from "./storage";

export interface PricingConfig {
  serviceType: string;
  complexityTier?: "SIMPLE" | "MEDIUM" | "COMPLEX";
  turnaroundTier: "STANDARD" | "RUSH_24HR" | "RUSH_12HR";
  outputFormats?: string[];
  addons?: Array<{
    type: "BACKGROUND_REMOVAL" | "COLOR_CHANGE" | "SIMPLIFICATION" | "EXTRA_FORMATS";
    instructions?: string;
  }>;
}

export interface PricingBreakdown {
  basePrice: number;
  complexityMultiplier: number;
  complexityAdjustment: number;
  turnaroundMultiplier: number;
  turnaroundFee: number;
  formatFees: number;
  addonFees: number;
  addonDetails: Array<{
    type: string;
    price: number;
    name: string;
  }>;
  subtotal: number;
}

export interface BulkPricingResult {
  lineItems: Array<PricingBreakdown & { fileId?: string }>;
  subtotal: number;
  bulkDiscountPercent: number;
  bulkDiscountAmount: number;
  total: number;
}

const DEFAULT_PRICING_RULES = {
  IMAGE_TO_VECTOR: {
    basePrice: 1500,
    complexityMultipliers: { SIMPLE: 1.0, MEDIUM: 1.5, COMPLEX: 2.5 },
  },
  LOGO_VECTORIZATION: {
    basePrice: 2500,
    complexityMultipliers: { SIMPLE: 1.0, MEDIUM: 1.5, COMPLEX: 2.5 },
  },
  PDF_TO_VECTOR: {
    basePrice: 2000,
    complexityMultipliers: { SIMPLE: 1.0, MEDIUM: 1.5, COMPLEX: 2.5 },
  },
  DXF_CUTTER_READY: {
    basePrice: 3000,
    complexityMultipliers: { SIMPLE: 1.0, MEDIUM: 1.5, COMPLEX: 2.5 },
  },
  RASTER_TO_VECTOR: {
    basePrice: 1800,
    complexityMultipliers: { SIMPLE: 1.0, MEDIUM: 1.5, COMPLEX: 2.5 },
  },
};

const TURNAROUND_MULTIPLIERS = {
  STANDARD: 1.0,
  RUSH_24HR: 1.5,
  RUSH_12HR: 2.0,
};

const ADDON_PRICES = {
  BACKGROUND_REMOVAL: 500,
  COLOR_CHANGE: 300,
  SIMPLIFICATION: 700,
  EXTRA_FORMATS: 500,
};

const ADDON_NAMES = {
  BACKGROUND_REMOVAL: "Background Removal",
  COLOR_CHANGE: "Color Adjustment",
  SIMPLIFICATION: "Image Simplification",
  EXTRA_FORMATS: "Extra Output Formats",
};

const FORMAT_FEES = {
  standard: 0,
  dxf: 500,
  eps: 300,
};

export async function calculatePricing(
  config: PricingConfig
): Promise<PricingBreakdown> {
  const servicePricing =
    DEFAULT_PRICING_RULES[config.serviceType as keyof typeof DEFAULT_PRICING_RULES];

  if (!servicePricing) {
    throw new Error(`Unknown service type: ${config.serviceType}`);
  }

  const basePrice = servicePricing.basePrice;

  const complexityMultiplier = config.complexityTier
    ? servicePricing.complexityMultipliers[config.complexityTier]
    : 1.0;

  const complexityAdjustment = Math.round(basePrice * (complexityMultiplier - 1));

  const turnaroundMultiplier = TURNAROUND_MULTIPLIERS[config.turnaroundTier] || 1.0;
  const turnaroundFee = Math.round(
    (basePrice + complexityAdjustment) * (turnaroundMultiplier - 1)
  );

  let formatFees = 0;
  if (config.outputFormats && config.outputFormats.length > 0) {
    config.outputFormats.forEach((format) => {
      const lowerFormat = format.toLowerCase();
      if (lowerFormat === "dxf") formatFees += FORMAT_FEES.dxf;
      else if (lowerFormat === "eps") formatFees += FORMAT_FEES.eps;
    });
  }

  let addonFees = 0;
  const addonDetails: Array<{ type: string; price: number; name: string }> = [];

  if (config.addons && config.addons.length > 0) {
    config.addons.forEach((addon) => {
      const price = ADDON_PRICES[addon.type] || 0;
      addonFees += price;
      addonDetails.push({
        type: addon.type,
        price,
        name: ADDON_NAMES[addon.type] || addon.type,
      });
    });
  }

  const subtotal =
    basePrice + complexityAdjustment + turnaroundFee + formatFees + addonFees;

  return {
    basePrice,
    complexityMultiplier,
    complexityAdjustment,
    turnaroundMultiplier,
    turnaroundFee,
    formatFees,
    addonFees,
    addonDetails,
    subtotal,
  };
}

export async function calculateBulkPricing(
  configs: PricingConfig[]
): Promise<BulkPricingResult> {
  const lineItems = await Promise.all(
    configs.map(async (config) => {
      const pricing = await calculatePricing(config);
      return pricing;
    })
  );

  const subtotal = lineItems.reduce((sum, item) => sum + item.subtotal, 0);

  let bulkDiscountPercent = 0;
  const fileCount = configs.length;

  if (fileCount >= 21) {
    bulkDiscountPercent = 20;
  } else if (fileCount >= 11) {
    bulkDiscountPercent = 15;
  } else if (fileCount >= 5) {
    bulkDiscountPercent = 10;
  }

  const bulkDiscountAmount = Math.round((subtotal * bulkDiscountPercent) / 100);
  const total = subtotal - bulkDiscountAmount;

  return {
    lineItems,
    subtotal,
    bulkDiscountPercent,
    bulkDiscountAmount,
    total,
  };
}

export function getBasePriceForService(serviceType: string): number {
  const servicePricing =
    DEFAULT_PRICING_RULES[serviceType as keyof typeof DEFAULT_PRICING_RULES];
  return servicePricing ? servicePricing.basePrice : 1500;
}

export function getComplexityMultiplier(
  serviceType: string,
  complexityTier: "SIMPLE" | "MEDIUM" | "COMPLEX"
): number {
  const servicePricing =
    DEFAULT_PRICING_RULES[serviceType as keyof typeof DEFAULT_PRICING_RULES];
  return servicePricing ? servicePricing.complexityMultipliers[complexityTier] : 1.0;
}

export function getTurnaroundMultiplier(
  turnaroundTier: "STANDARD" | "RUSH_24HR" | "RUSH_12HR"
): number {
  return TURNAROUND_MULTIPLIERS[turnaroundTier] || 1.0;
}

export function getAddonPrice(
  addonType: "BACKGROUND_REMOVAL" | "COLOR_CHANGE" | "SIMPLIFICATION" | "EXTRA_FORMATS"
): number {
  return ADDON_PRICES[addonType] || 0;
}

export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function calculateEstimatedProcessingTime(
  complexityTier: "SIMPLE" | "MEDIUM" | "COMPLEX",
  turnaroundTier: "STANDARD" | "RUSH_24HR" | "RUSH_12HR"
): string {
  if (turnaroundTier === "RUSH_12HR") {
    return "12 hours";
  } else if (turnaroundTier === "RUSH_24HR") {
    return "24 hours";
  } else {
    switch (complexityTier) {
      case "SIMPLE":
        return "2-3 business days";
      case "MEDIUM":
        return "3-5 business days";
      case "COMPLEX":
        return "5-7 business days";
      default:
        return "3-5 business days";
    }
  }
}
