import { Feather } from "@expo/vector-icons";

export interface Scene {
  id: string;
  label: string;
  icon: keyof typeof Feather.glyphMap;
  description: string;
}

export interface ProductCategory {
  id: string;
  label: string;
  icon: keyof typeof Feather.glyphMap;
  keywords: string[];
  recommendedScenes: string[];
}

// Expanded list of scenes
export const SCENES: Scene[] = [
  // Indoor scenes
  {
    id: "kitchen",
    label: "Kitchen Counter",
    icon: "coffee",
    description: "Modern kitchen setting",
  },
  {
    id: "living",
    label: "Living Room",
    icon: "home",
    description: "Cozy home environment",
  },
  {
    id: "office",
    label: "Office Desk",
    icon: "briefcase",
    description: "Professional workspace",
  },
  {
    id: "bedroom",
    label: "Bedroom",
    icon: "moon",
    description: "Comfortable bedroom setting",
  },
  {
    id: "bathroom",
    label: "Bathroom Vanity",
    icon: "droplet",
    description: "Clean bathroom space",
  },
  {
    id: "dining",
    label: "Dining Table",
    icon: "users",
    description: "Elegant dining setup",
  },
  // Outdoor scenes
  {
    id: "outdoor",
    label: "Outdoor Nature",
    icon: "sun",
    description: "Natural outdoor lighting",
  },
  {
    id: "park",
    label: "Park Setting",
    icon: "map-pin",
    description: "Green park environment",
  },
  {
    id: "trail",
    label: "Trail / Path",
    icon: "navigation",
    description: "Adventure trail scene",
  },
  {
    id: "beach",
    label: "Beach",
    icon: "umbrella",
    description: "Sandy beach setting",
  },
  {
    id: "garden",
    label: "Garden / Patio",
    icon: "feather",
    description: "Beautiful garden space",
  },
  {
    id: "urban",
    label: "Urban Street",
    icon: "map",
    description: "City street backdrop",
  },
  // Professional scenes
  {
    id: "studio",
    label: "Studio Setup",
    icon: "box",
    description: "Professional studio backdrop",
  },
  {
    id: "minimal",
    label: "Minimalist",
    icon: "square",
    description: "Clean, simple background",
  },
  {
    id: "lifestyle",
    label: "Lifestyle Shot",
    icon: "instagram",
    description: "Trendy lifestyle setting",
  },
  // Specialty scenes
  {
    id: "gym",
    label: "Gym / Fitness",
    icon: "activity",
    description: "Fitness environment",
  },
  {
    id: "garage",
    label: "Garage",
    icon: "tool",
    description: "Workshop / garage setting",
  },
  {
    id: "playroom",
    label: "Playroom",
    icon: "smile",
    description: "Fun kids space",
  },
];

// Product categories with keywords and recommended scenes
export const PRODUCT_CATEGORIES: ProductCategory[] = [
  {
    id: "sports",
    label: "Sports & Outdoors",
    icon: "activity",
    keywords: [
      "bike", "bicycle", "cycling", "helmet", "sports", "fitness", "exercise",
      "workout", "gym", "yoga", "camping", "tent", "hiking", "backpack",
      "running", "shoes", "sneakers", "ball", "golf", "tennis", "swimming",
      "skateboard", "scooter", "weights", "dumbbell", "outdoor", "adventure",
      "fishing", "hunting", "climbing", "ski", "snowboard", "surfboard",
    ],
    recommendedScenes: ["outdoor", "park", "trail", "gym", "beach", "garden"],
  },
  {
    id: "kitchen",
    label: "Kitchen & Dining",
    icon: "coffee",
    keywords: [
      "kitchen", "cooking", "cookware", "pot", "pan", "knife", "cutting board",
      "blender", "mixer", "toaster", "coffee", "espresso", "kettle", "mug",
      "cup", "plate", "bowl", "utensil", "spatula", "food", "appliance",
      "microwave", "oven", "grill", "barbeque", "bbq", "dining", "tableware",
      "glass", "wine", "bottle", "container", "storage", "spice", "recipe",
    ],
    recommendedScenes: ["kitchen", "dining", "minimal", "studio"],
  },
  {
    id: "electronics",
    label: "Electronics & Tech",
    icon: "smartphone",
    keywords: [
      "phone", "smartphone", "tablet", "ipad", "laptop", "computer", "pc",
      "monitor", "keyboard", "mouse", "headphones", "earbuds", "airpods",
      "speaker", "bluetooth", "wireless", "charger", "cable", "usb", "tech",
      "gadget", "electronic", "camera", "gopro", "drone", "watch", "smartwatch",
      "gaming", "console", "controller", "vr", "tv", "television", "remote",
    ],
    recommendedScenes: ["office", "studio", "minimal", "living", "lifestyle"],
  },
  {
    id: "fashion",
    label: "Fashion & Accessories",
    icon: "shopping-bag",
    keywords: [
      "clothing", "clothes", "shirt", "dress", "pants", "jeans", "jacket",
      "coat", "sweater", "hoodie", "hat", "cap", "scarf", "gloves", "fashion",
      "accessory", "jewelry", "necklace", "bracelet", "ring", "earring",
      "watch", "sunglasses", "glasses", "bag", "purse", "handbag", "wallet",
      "belt", "tie", "shoe", "boot", "sandal", "sneaker", "heel", "apparel",
    ],
    recommendedScenes: ["lifestyle", "urban", "studio", "minimal", "living"],
  },
  {
    id: "beauty",
    label: "Beauty & Personal Care",
    icon: "heart",
    keywords: [
      "beauty", "makeup", "cosmetic", "skincare", "skin", "cream", "lotion",
      "serum", "moisturizer", "cleanser", "face", "mask", "lipstick", "mascara",
      "foundation", "brush", "mirror", "nail", "polish", "perfume", "fragrance",
      "cologne", "shampoo", "conditioner", "hair", "dryer", "straightener",
      "curler", "razor", "shave", "soap", "body", "spa", "wellness",
    ],
    recommendedScenes: ["bathroom", "minimal", "studio", "lifestyle", "bedroom"],
  },
  {
    id: "home",
    label: "Home & Decor",
    icon: "home",
    keywords: [
      "furniture", "chair", "table", "desk", "sofa", "couch", "bed", "mattress",
      "pillow", "blanket", "lamp", "light", "lighting", "decor", "decoration",
      "vase", "plant", "pot", "frame", "picture", "mirror", "rug", "carpet",
      "curtain", "shelf", "storage", "organizer", "basket", "candle", "clock",
      "art", "sculpture", "ceramic", "wood", "wooden", "handmade", "craft",
    ],
    recommendedScenes: ["living", "bedroom", "dining", "minimal", "studio"],
  },
  {
    id: "garden",
    label: "Garden & Outdoor Living",
    icon: "sun",
    keywords: [
      "garden", "plant", "flower", "pot", "planter", "seed", "soil", "tool",
      "shovel", "rake", "hose", "sprinkler", "lawn", "mower", "trimmer",
      "outdoor", "patio", "furniture", "umbrella", "grill", "fire pit",
      "fountain", "statue", "gnome", "bird", "feeder", "fence", "gate",
    ],
    recommendedScenes: ["garden", "outdoor", "park", "minimal"],
  },
  {
    id: "toys",
    label: "Toys & Kids",
    icon: "smile",
    keywords: [
      "toy", "toys", "kid", "kids", "child", "children", "baby", "infant",
      "game", "puzzle", "lego", "block", "doll", "action figure", "plush",
      "stuffed", "teddy", "bear", "car", "truck", "train", "robot", "drone",
      "board game", "card", "educational", "learning", "play", "playroom",
    ],
    recommendedScenes: ["playroom", "living", "park", "outdoor", "bedroom"],
  },
  {
    id: "pets",
    label: "Pet Products",
    icon: "github", // paw-like icon
    keywords: [
      "pet", "dog", "cat", "puppy", "kitten", "bird", "fish", "hamster",
      "collar", "leash", "bowl", "food", "treat", "toy", "bed", "crate",
      "carrier", "grooming", "brush", "shampoo", "aquarium", "cage", "tank",
    ],
    recommendedScenes: ["living", "park", "garden", "outdoor", "playroom"],
  },
  {
    id: "automotive",
    label: "Automotive",
    icon: "truck",
    keywords: [
      "car", "auto", "automotive", "vehicle", "truck", "motorcycle", "bike",
      "tire", "wheel", "oil", "filter", "battery", "charger", "light", "led",
      "seat", "cover", "mat", "floor", "dash", "cam", "gps", "mount", "holder",
      "tool", "jack", "wrench", "cleaner", "wax", "polish", "detailing",
    ],
    recommendedScenes: ["garage", "outdoor", "urban", "studio"],
  },
];

/**
 * Matches a product description against categories and returns recommended scenes
 */
export function getRecommendedScenes(
  description: string,
  selectedCategoryId: string | null
): { scenes: string[]; matched: boolean; matchedCategory: string | null } {
  // If a category is explicitly selected, use its recommendations
  if (selectedCategoryId) {
    const category = PRODUCT_CATEGORIES.find((c) => c.id === selectedCategoryId);
    if (category) {
      return {
        scenes: category.recommendedScenes,
        matched: true,
        matchedCategory: category.id,
      };
    }
  }

  // If description provided, try keyword matching
  if (description && description.trim().length > 0) {
    const lowerDesc = description.toLowerCase();
    const words = lowerDesc.split(/\s+/);

    // Score each category based on keyword matches
    const categoryScores: { category: ProductCategory; score: number }[] = [];

    for (const category of PRODUCT_CATEGORIES) {
      let score = 0;
      for (const keyword of category.keywords) {
        // Check if keyword exists in description
        if (lowerDesc.includes(keyword)) {
          // Longer keyword matches are worth more
          score += keyword.length;
        }
        // Also check individual words
        for (const word of words) {
          if (word === keyword || (word.length > 3 && keyword.startsWith(word))) {
            score += 2;
          }
        }
      }
      if (score > 0) {
        categoryScores.push({ category, score });
      }
    }

    // Sort by score and get best match
    categoryScores.sort((a, b) => b.score - a.score);

    if (categoryScores.length > 0 && categoryScores[0].score >= 3) {
      const bestMatch = categoryScores[0].category;
      return {
        scenes: bestMatch.recommendedScenes,
        matched: true,
        matchedCategory: bestMatch.id,
      };
    }
  }

  // No match found
  return {
    scenes: [],
    matched: false,
    matchedCategory: null,
  };
}

/**
 * Gets scenes organized by recommended and other
 */
export function getOrganizedScenes(
  recommendedSceneIds: string[]
): { recommended: Scene[]; other: Scene[] } {
  const recommendedSet = new Set(recommendedSceneIds);

  const recommended: Scene[] = [];
  const other: Scene[] = [];

  for (const scene of SCENES) {
    if (recommendedSet.has(scene.id)) {
      recommended.push(scene);
    } else {
      other.push(scene);
    }
  }

  return { recommended, other };
}
