const tshirtImage = require("../../assets/images/mockups/white_t-shirt_mockup_preview.png");
const hoodieImage = require("../../assets/images/mockups/black_hoodie_mockup_preview.png");
const tankTopImage = require("../../assets/images/mockups/white_tank_top_mockup_preview.png");
const mugImage = require("../../assets/images/mockups/white_ceramic_mug_mockup_preview.png");
const tumblerImage = require("../../assets/images/mockups/steel_tumbler_mockup_preview.png");
const phoneCaseImage = require("../../assets/images/mockups/phone_case_mockup_preview.png");
const laptopSleeveImage = require("../../assets/images/mockups/laptop_sleeve_mockup_preview.png");
const posterImage = require("../../assets/images/mockups/framed_poster_mockup_preview.png");
const canvasImage = require("../../assets/images/mockups/canvas_print_mockup_preview.png");
const toteBagImage = require("../../assets/images/mockups/tote_bag_mockup_preview.png");
const capImage = require("../../assets/images/mockups/baseball_cap_mockup_preview.png");

const dynamicVibeImage = require("../../assets/images/mockups/dynamic_vibe_style_preview.png");
const professionalVibeImage = require("../../assets/images/mockups/professional_vibe_style_preview.png");
const casualVibeImage = require("../../assets/images/mockups/casual_vibe_style_preview.png");
const premiumVibeImage = require("../../assets/images/mockups/premium_vibe_style_preview.png");
const funVibeImage = require("../../assets/images/mockups/fun_vibe_style_preview.png");

const closeupCameraImage = require("../../assets/images/mockups/close-up_camera_angle_preview.png");
const mediumCameraImage = require("../../assets/images/mockups/medium_camera_angle_preview.png");
const wideCameraImage = require("../../assets/images/mockups/wide_camera_angle_preview.png");
const flatlayCameraImage = require("../../assets/images/mockups/flat_lay_camera_angle_preview.png");
const actionCameraImage = require("../../assets/images/mockups/action_camera_angle_preview.png");
const handheldCameraImage = require("../../assets/images/mockups/in-use_camera_angle_preview.png");

export interface MockupCategory {
  id: string;
  label: string;
  icon: string;
  items: MockupItem[];
}

export interface MockupItem {
  id: string;
  label: string;
  description: string;
  hasColorPicker: boolean;
  defaultColors?: string[];
  image: any;
}

export interface SceneVibe {
  id: string;
  label: string;
  description: string;
  icon: string;
  image: any;
}

export interface CameraOption {
  id: string;
  label: string;
  description: string;
  icon: string;
  image: any;
}

export const MOCKUP_CATEGORIES: MockupCategory[] = [
  {
    id: "apparel",
    label: "Apparel",
    icon: "shopping-bag",
    items: [
      {
        id: "tshirt",
        label: "T-Shirt",
        description: "Classic crew neck t-shirt",
        hasColorPicker: true,
        defaultColors: ["#FFFFFF", "#000000", "#1F2937", "#DC2626", "#2563EB", "#059669"],
        image: tshirtImage,
      },
      {
        id: "hoodie",
        label: "Hoodie",
        description: "Pullover hoodie with front pocket",
        hasColorPicker: true,
        defaultColors: ["#FFFFFF", "#000000", "#1F2937", "#6B7280", "#1E40AF"],
        image: hoodieImage,
      },
      {
        id: "tanktop",
        label: "Tank Top",
        description: "Athletic tank top",
        hasColorPicker: true,
        defaultColors: ["#FFFFFF", "#000000", "#DC2626", "#2563EB"],
        image: tankTopImage,
      },
    ],
  },
  {
    id: "drinkware",
    label: "Drinkware",
    icon: "coffee",
    items: [
      {
        id: "mug",
        label: "Coffee Mug",
        description: "Classic ceramic mug",
        hasColorPicker: true,
        defaultColors: ["#FFFFFF", "#000000", "#1F2937"],
        image: mugImage,
      },
      {
        id: "tumbler",
        label: "Tumbler",
        description: "Insulated travel tumbler",
        hasColorPicker: true,
        defaultColors: ["#FFFFFF", "#000000", "#1F2937", "#0EA5E9"],
        image: tumblerImage,
      },
      {
        id: "waterbottle",
        label: "Water Bottle",
        description: "Stainless steel water bottle",
        hasColorPicker: true,
        defaultColors: ["#FFFFFF", "#000000", "#0EA5E9", "#10B981"],
        image: tumblerImage,
      },
      {
        id: "can",
        label: "Beverage Can",
        description: "Aluminum beverage can",
        hasColorPicker: false,
        image: tumblerImage,
      },
    ],
  },
  {
    id: "tech",
    label: "Tech",
    icon: "smartphone",
    items: [
      {
        id: "phonecase",
        label: "Phone Case",
        description: "Smartphone protective case",
        hasColorPicker: true,
        defaultColors: ["#FFFFFF", "#000000", "#F97316"],
        image: phoneCaseImage,
      },
      {
        id: "laptopsleeve",
        label: "Laptop Sleeve",
        description: "Padded laptop sleeve",
        hasColorPicker: true,
        defaultColors: ["#1F2937", "#000000", "#6B7280"],
        image: laptopSleeveImage,
      },
      {
        id: "airpodscase",
        label: "AirPods Case",
        description: "Wireless earbuds case",
        hasColorPicker: true,
        defaultColors: ["#FFFFFF", "#000000", "#F97316"],
        image: phoneCaseImage,
      },
    ],
  },
  {
    id: "print",
    label: "Print",
    icon: "image",
    items: [
      {
        id: "poster",
        label: "Poster",
        description: "Wall art poster print",
        hasColorPicker: false,
        image: posterImage,
      },
      {
        id: "canvas",
        label: "Canvas",
        description: "Gallery wrapped canvas",
        hasColorPicker: false,
        image: canvasImage,
      },
      {
        id: "framedart",
        label: "Framed Art",
        description: "Art in elegant frame",
        hasColorPicker: true,
        defaultColors: ["#000000", "#FFFFFF", "#8B4513"],
        image: posterImage,
      },
      {
        id: "billboard",
        label: "Billboard",
        description: "Large outdoor billboard",
        hasColorPicker: false,
        image: posterImage,
      },
    ],
  },
  {
    id: "accessories",
    label: "Accessories",
    icon: "gift",
    items: [
      {
        id: "totebag",
        label: "Tote Bag",
        description: "Canvas tote bag",
        hasColorPicker: true,
        defaultColors: ["#FFFFFF", "#000000", "#F5F5DC"],
        image: toteBagImage,
      },
      {
        id: "hat",
        label: "Hat",
        description: "Baseball cap",
        hasColorPicker: true,
        defaultColors: ["#FFFFFF", "#000000", "#1F2937", "#DC2626", "#2563EB"],
        image: capImage,
      },
      {
        id: "pillow",
        label: "Pillow",
        description: "Decorative throw pillow",
        hasColorPicker: true,
        defaultColors: ["#FFFFFF", "#000000", "#F5F5DC"],
        image: toteBagImage,
      },
      {
        id: "sticker",
        label: "Sticker",
        description: "Die-cut vinyl sticker",
        hasColorPicker: false,
        image: posterImage,
      },
    ],
  },
];

export const SCENE_VIBES: SceneVibe[] = [
  {
    id: "dynamic",
    label: "Dynamic",
    description: "Action, sports, outdoor adventure - perfect for energy drinks, fitness gear",
    icon: "zap",
    image: dynamicVibeImage,
  },
  {
    id: "professional",
    label: "Professional",
    description: "Office, business meeting, clean desk - great for corporate products",
    icon: "briefcase",
    image: professionalVibeImage,
  },
  {
    id: "casual",
    label: "Casual",
    description: "Coffee shop, home, urban street - ideal for lifestyle products",
    icon: "home",
    image: casualVibeImage,
  },
  {
    id: "premium",
    label: "Premium",
    description: "Studio lighting, marble surfaces, luxury aesthetic",
    icon: "star",
    image: premiumVibeImage,
  },
  {
    id: "fun",
    label: "Fun",
    description: "Bright colors, party scenes, beach vibes - great for playful brands",
    icon: "sun",
    image: funVibeImage,
  },
];

export const CAMERA_OPTIONS: CameraOption[] = [
  {
    id: "closeup",
    label: "Close-up",
    description: "Detailed product focus",
    icon: "zoom-in",
    image: closeupCameraImage,
  },
  {
    id: "medium",
    label: "Medium",
    description: "Balanced view with context",
    icon: "maximize",
    image: mediumCameraImage,
  },
  {
    id: "wide",
    label: "Wide",
    description: "Full environmental shot",
    icon: "maximize-2",
    image: wideCameraImage,
  },
  {
    id: "flatlay",
    label: "Flat Lay",
    description: "Top-down perspective",
    icon: "grid",
    image: flatlayCameraImage,
  },
  {
    id: "action",
    label: "Action",
    description: "Motion blur, dynamic angle",
    icon: "activity",
    image: actionCameraImage,
  },
  {
    id: "handheld",
    label: "In-Use",
    description: "Product being used/held",
    icon: "user",
    image: handheldCameraImage,
  },
];

export function getMockupPrompt(
  mockupItem: MockupItem,
  sceneVibe: SceneVibe,
  cameraOption: CameraOption,
  mockupColor?: string,
  customDescription?: string
): string {
  const isCustomProduct = mockupItem.id === "custom";
  const productName = mockupItem.label.toLowerCase();
  const colorDesc = mockupColor ? `The ${productName} color is ${mockupColor}.` : "";
  
  const vibeDescriptions: Record<string, string> = {
    dynamic: "in an energetic, action-packed setting with dynamic lighting and motion. Think extreme sports, fitness, adventure. High energy and exciting.",
    professional: "in a clean, professional business environment. Modern office, meeting room, or executive desk. Sophisticated and corporate.",
    casual: "in a relaxed, everyday lifestyle setting. Cozy coffee shop, comfortable home, or casual urban street scene. Warm and inviting.",
    premium: "in a luxurious, high-end studio setting. Perfect lighting, marble or elegant surfaces, premium aesthetic. Sophisticated and aspirational.",
    fun: "in a vibrant, playful setting with bright colors. Party atmosphere, beach vibes, or colorful backdrop. Joyful and energetic.",
  };

  const cameraDescriptions: Record<string, string> = {
    closeup: "Shot as a close-up detail shot focusing on the product details.",
    medium: "Shot as a medium shot showing the product with some environmental context.",
    wide: "Shot as a wide environmental shot showing the full scene with the product.",
    flatlay: "Shot as a flat lay from directly above, top-down perspective.",
    action: "Shot with motion blur and dynamic angles conveying energy and movement.",
    handheld: "Shot showing someone holding or actively using the product.",
  };

  const productInstruction = isCustomProduct 
    ? `IMPORTANT: The user specifically wants their design/logo placed on a "${productName}". Create a realistic ${productName} with their design.`
    : `Create a realistic product mockup of the provided design/logo placed on a ${productName}.`;

  const basePrompt = `${productInstruction} ${colorDesc} The scene should be ${vibeDescriptions[sceneVibe.id] || vibeDescriptions.casual} ${cameraDescriptions[cameraOption.id] || cameraDescriptions.medium}`;

  const customAddition = customDescription ? ` Additional context: ${customDescription}` : "";

  return `${basePrompt}${customAddition} The product placement should look natural and realistic with proper perspective, lighting, and shadows. High quality, photorealistic result.`;
}
