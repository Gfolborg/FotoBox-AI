/**
 * Platform requirements for e-commerce selling platforms
 * Each platform has specific image requirements for product listings
 */

export interface PlatformRequirement {
  id: string;
  name: string;
  icon: string; // Feather icon name
  color: string;
  minWidth: number;
  minHeight: number;
  optimalWidth: number;
  optimalHeight: number;
  aspectRatio: number;
  aspectRatioLabel: string;
  format: "JPEG" | "PNG";
  quality: number;
  backgroundPreference?: "white" | "transparent" | "any";
  notes: string;
}

export const DEFAULT_EXPORT_LONG_EDGE = 3500;

export function getExportDimensions(
  platform: PlatformRequirement,
  maxLongEdge: number = DEFAULT_EXPORT_LONG_EDGE,
): { width: number; height: number; scale: number } {
  const longEdge = Math.max(platform.optimalWidth, platform.optimalHeight);
  if (!maxLongEdge || maxLongEdge <= longEdge) {
    return {
      width: platform.optimalWidth,
      height: platform.optimalHeight,
      scale: 1,
    };
  }

  const scale = maxLongEdge / longEdge;
  return {
    width: Math.round(platform.optimalWidth * scale),
    height: Math.round(platform.optimalHeight * scale),
    scale,
  };
}

export const PLATFORM_REQUIREMENTS: Record<string, PlatformRequirement> = {
  amazon: {
    id: "amazon",
    name: "Amazon",
    icon: "shopping-bag",
    color: "#FF9900",
    minWidth: 1000,
    minHeight: 1000,
    optimalWidth: 2000,
    optimalHeight: 2000,
    aspectRatio: 1,
    aspectRatioLabel: "1:1",
    format: "JPEG",
    quality: 100,
    backgroundPreference: "white",
    notes: "White background preferred for main images",
  },
  shopify: {
    id: "shopify",
    name: "Shopify",
    icon: "shopping-cart",
    color: "#96BF48",
    minWidth: 800,
    minHeight: 800,
    optimalWidth: 2048,
    optimalHeight: 2048,
    aspectRatio: 1,
    aspectRatioLabel: "1:1",
    format: "JPEG",
    quality: 100,
    backgroundPreference: "any",
    notes: "Square images recommended for product grids",
  },
  etsy: {
    id: "etsy",
    name: "Etsy",
    icon: "tag",
    color: "#F56400",
    minWidth: 2000,
    minHeight: 2000,
    optimalWidth: 2000,
    optimalHeight: 2000,
    aspectRatio: 1,
    aspectRatioLabel: "1:1",
    format: "JPEG",
    quality: 100,
    backgroundPreference: "any",
    notes: "High resolution preferred for zoom",
  },
  ebay: {
    id: "ebay",
    name: "eBay",
    icon: "package",
    color: "#0064D2",
    minWidth: 500,
    minHeight: 500,
    optimalWidth: 2000,
    optimalHeight: 2000,
    aspectRatio: 1,
    aspectRatioLabel: "1:1",
    format: "JPEG",
    quality: 100,
    backgroundPreference: "white",
    notes: "Product should fill 80-90% of frame",
  },
  walmart: {
    id: "walmart",
    name: "Walmart",
    icon: "grid",
    color: "#0071CE",
    minWidth: 1500,
    minHeight: 1500,
    optimalWidth: 2000,
    optimalHeight: 2000,
    aspectRatio: 1,
    aspectRatioLabel: "1:1",
    format: "JPEG",
    quality: 100,
    backgroundPreference: "white",
    notes: "White background required",
  },
  facebook: {
    id: "facebook",
    name: "Facebook/Instagram",
    icon: "instagram",
    color: "#E1306C",
    minWidth: 600,
    minHeight: 600,
    optimalWidth: 1080,
    optimalHeight: 1080,
    aspectRatio: 1,
    aspectRatioLabel: "1:1",
    format: "JPEG",
    quality: 100,
    backgroundPreference: "any",
    notes: "Square format for Shops",
  },
  google: {
    id: "google",
    name: "Google Shopping",
    icon: "search",
    color: "#4285F4",
    minWidth: 800,
    minHeight: 800,
    optimalWidth: 2000,
    optimalHeight: 2000,
    aspectRatio: 1,
    aspectRatioLabel: "1:1",
    format: "JPEG",
    quality: 100,
    backgroundPreference: "white",
    notes: "75-90% product fill recommended",
  },
  pinterest: {
    id: "pinterest",
    name: "Pinterest",
    icon: "compass",
    color: "#E60023",
    minWidth: 1000,
    minHeight: 1500,
    optimalWidth: 1000,
    optimalHeight: 1500,
    aspectRatio: 2 / 3,
    aspectRatioLabel: "2:3",
    format: "JPEG",
    quality: 100,
    backgroundPreference: "any",
    notes: "Vertical 2:3 ratio performs best",
  },
};

/**
 * Get all platforms as an array
 */
export function getAllPlatforms(): PlatformRequirement[] {
  return Object.values(PLATFORM_REQUIREMENTS);
}

/**
 * Get a platform by ID
 */
export function getPlatformById(id: string): PlatformRequirement | undefined {
  return PLATFORM_REQUIREMENTS[id];
}

/**
 * Get platforms by aspect ratio
 */
export function getPlatformsByAspectRatio(
  ratio: number,
): PlatformRequirement[] {
  const tolerance = 0.01;
  return getAllPlatforms().filter(
    (p) => Math.abs(p.aspectRatio - ratio) < tolerance,
  );
}
