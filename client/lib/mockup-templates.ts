import {
  SCENE_VIBES,
  CAMERA_OPTIONS,
  MODEL_OPTIONS,
} from "@/lib/mockup-presets";

export type MockupTemplate = {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  vibeId?: string;
  cameraId?: string;
  modelId?: string;
  productCategoryId?: string;
  productId?: string;
  defaultColor?: string;
  tags?: string[];
  isFeatured?: boolean;
  isCustomScene?: boolean;
};

export type MockupWizardMode = "quick" | "custom";

export type MockupWizardState = {
  mode: MockupWizardMode;
  images: string[];
  templateId?: string;
  productCategoryId?: string;
  productId?: string;
  customProductName?: string;
  productColor?: string;
  vibeId?: string;
  cameraId?: string;
  modelId?: string;
  customScenePrompt?: string;
  negativePrompt?: string;
  additionalNotes?: string;
  applyToAll?: boolean;
  outputCount?: number;
};

export const MOCKUP_TEMPLATES: MockupTemplate[] = [
  {
    id: "hero",
    title: "Hero Shot",
    subtitle: "Premium studio focus",
    icon: "star",
    vibeId: "premium",
    cameraId: "closeup",
    modelId: "none",
    productCategoryId: "apparel",
    productId: "tshirt",
    defaultColor: "#FFFFFF",
    tags: ["featured", "studio", "premium"],
    isFeatured: true,
  },
  {
    id: "etsy_flatlay",
    title: "Etsy Flatlay",
    subtitle: "Top-down, clean styling",
    icon: "grid",
    vibeId: "casual",
    cameraId: "flatlay",
    modelId: "none",
    productCategoryId: "print",
    productId: "poster",
    tags: ["featured", "etsy", "flatlay"],
    isFeatured: true,
  },
  {
    id: "studio_clean",
    title: "Studio Clean",
    subtitle: "Bright, minimal studio",
    icon: "aperture",
    vibeId: "professional",
    cameraId: "medium",
    modelId: "none",
    productCategoryId: "apparel",
    productId: "hoodie",
    defaultColor: "#FFFFFF",
    tags: ["featured", "clean", "studio"],
    isFeatured: true,
  },
  {
    id: "packaging",
    title: "Packaging",
    subtitle: "Close detail emphasis",
    icon: "package",
    vibeId: "professional",
    cameraId: "closeup",
    modelId: "none",
    productCategoryId: "drinkware",
    productId: "mug",
    defaultColor: "#FFFFFF",
    tags: ["detail", "product"],
  },
  {
    id: "social_ad",
    title: "Social Ad",
    subtitle: "Fun, dynamic scene",
    icon: "share-2",
    vibeId: "fun",
    cameraId: "handheld",
    modelId: "hands",
    productCategoryId: "accessories",
    productId: "totebag",
    tags: ["social", "dynamic"],
  },
  {
    id: "lifestyle_kitchen",
    title: "Lifestyle Kitchen",
    subtitle: "Warm, everyday vibe",
    icon: "coffee",
    vibeId: "casual",
    cameraId: "handheld",
    modelId: "hands",
    productCategoryId: "drinkware",
    productId: "mug",
    defaultColor: "#FFFFFF",
    tags: ["lifestyle", "home"],
  },
  {
    id: "outdoor",
    title: "Outdoor",
    subtitle: "Natural light, wide",
    icon: "map",
    vibeId: "dynamic",
    cameraId: "wide",
    modelId: "none",
    productCategoryId: "accessories",
    productId: "hat",
    tags: ["outdoor", "natural"],
  },
  {
    id: "minimal",
    title: "Minimal",
    subtitle: "Simple, refined look",
    icon: "circle",
    vibeId: "premium",
    cameraId: "closeup",
    modelId: "none",
    productCategoryId: "print",
    productId: "canvas",
    tags: ["minimal", "premium"],
  },
  {
    id: "custom",
    title: "Custom Scene",
    subtitle: "Describe your own setup",
    icon: "edit-3",
    tags: ["custom"],
    isCustomScene: true,
  },
];

export function getTemplateById(templateId?: string) {
  if (!templateId) return undefined;
  return MOCKUP_TEMPLATES.find((template) => template.id === templateId);
}

export function resolveTemplateSelections(template?: MockupTemplate) {
  if (!template) {
    return {
      vibe: SCENE_VIBES[0],
      camera: CAMERA_OPTIONS[0],
      model: MODEL_OPTIONS[0],
    };
  }

  const vibe =
    SCENE_VIBES.find((item) => item.id === template.vibeId) || SCENE_VIBES[0];
  const camera =
    CAMERA_OPTIONS.find((item) => item.id === template.cameraId) ||
    CAMERA_OPTIONS[0];
  const model =
    MODEL_OPTIONS.find((item) => item.id === template.modelId) ||
    MODEL_OPTIONS[0];

  return { vibe, camera, model };
}
