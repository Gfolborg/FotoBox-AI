// Optimized WebP images (300x300, ~99% smaller than originals)
const tshirtImage = require("../../assets/images/mockups/white_t-shirt_mockup_preview.webp");
const hoodieImage = require("../../assets/images/mockups/black_hoodie_mockup_preview.webp");
const tankTopImage = require("../../assets/images/mockups/white_tank_top_mockup_preview.webp");
const mugImage = require("../../assets/images/mockups/white_ceramic_mug_mockup_preview.webp");
const tumblerImage = require("../../assets/images/mockups/steel_tumbler_mockup_preview.webp");
const phoneCaseImage = require("../../assets/images/mockups/phone_case_mockup_preview.webp");
const laptopSleeveImage = require("../../assets/images/mockups/laptop_sleeve_mockup_preview.webp");
const posterImage = require("../../assets/images/mockups/framed_poster_mockup_preview.webp");
const canvasImage = require("../../assets/images/mockups/canvas_print_mockup_preview.webp");
const toteBagImage = require("../../assets/images/mockups/tote_bag_mockup_preview.webp");
const capImage = require("../../assets/images/mockups/baseball_cap_mockup_preview.webp");

const dynamicVibeImage = require("../../assets/images/mockups/dynamic_vibe_style_preview.webp");
const professionalVibeImage = require("../../assets/images/mockups/professional_vibe_style_preview.webp");
const casualVibeImage = require("../../assets/images/mockups/casual_vibe_style_preview.webp");
const premiumVibeImage = require("../../assets/images/mockups/premium_vibe_style_preview.webp");
const funVibeImage = require("../../assets/images/mockups/fun_vibe_style_preview.webp");

// Scene type preview images (dedicated)
const studioSceneImage = require("../../assets/images/mockups/scene_type_studio.webp");
const lifestyleSceneImage = require("../../assets/images/mockups/scene_type_lifestyle.webp");
const flatlaySceneImage = require("../../assets/images/mockups/scene_type_flatlay.webp");
const actionSceneImage = require("../../assets/images/mockups/scene_type_action.webp");

// Camera angle preview images (dedicated)
const closeupCameraImage = require("../../assets/images/mockups/camera_closeup.webp");
const mediumCameraImage = require("../../assets/images/mockups/camera_medium.webp");
const wideCameraImage = require("../../assets/images/mockups/camera_wide.webp");
const flatlayCameraImage = require("../../assets/images/mockups/camera_flatlay.webp");
const actionCameraImage = require("../../assets/images/mockups/camera_action.webp");
const handheldCameraImage = require("../../assets/images/mockups/camera_inuse.webp");

// Model option preview images (dedicated)
const noModelImage = require("../../assets/images/mockups/model_none.webp");
const femaleModelImage = require("../../assets/images/mockups/model_female.webp");
const maleModelImage = require("../../assets/images/mockups/model_male.webp");
const diverseGroupImage = require("../../assets/images/mockups/model_diverse.webp");
const handsOnlyImage = require("../../assets/images/mockups/model_hands.webp");

// Blurhash placeholders for instant loading preview
export const BLURHASH = {
  tshirt: "URODnH~qWBt7-;RjWBt7RjIUt7j[M{xuofRj",
  hoodie: "UaIrHS_3~q_3?b%Mxut7-;t7D%M{t7M{t7t7",
  tankTop: "UNP6~y~qxu-;~qxuofofRjayfRj[-;j[ayj[",
  mug: "U9KK==~qof%M00M{00fQ00WB4nRjt7xu_3WB",
  tumbler: "UCMQ*J?b~q%LD%00t7t7?bD%D%xuxu%MM{t7",
  phoneCase: "ULK1:yM{~q%M4o%MayD*.8a}9Fj[4o4.WV-;",
  laptopSleeve: "UYIY5?~qxut7t7-;xuayxuxuj[t7RjWBt7t7",
  poster: "U4NdO80000~q4m00t7NG009F.8-;?a9F?b?b",
  canvas: "UFKK==~q00t7?b_39FM{_3xuofM{IUxukCM{",
  toteBag: "UKI=Jh~qIqIp9vIpM{t6jEs.xtxtNHfkkDRj",
  cap: "UBMQ*J~qayt7IUM{IURjxuD%M{%MIUt7%Mj[",
  dynamic: "UXIOa~~VfkIVtmS$t7WAI[WYjEof9uM|WBbc",
  professional: "UkGSGqofD%WC~qofM_fQn$fQogoet5ayt8j[",
  casual: "UBELyq00?w9G9v-nxun3#6?HD*EjtRnhS5WB",
  premium: "UEI#c9NH~W_2?G?c?at8?HNHxtR*_2D%NHt6",
  fun: "U7Ionj}p00I]z%n#Bys:07EM?SwI3VIo:*oc",
  closeup: "UMJa+Xi^xu%N-;RPWAtR_NbcIUs:t7%Mxtoe",
  medium: "UOE.-200s.%M_ND%IU-;^+D$og%MRloeRktR",
  wide: "UC9j[bD%00?v~qM{4.%N-pRkIVt7-;WAIUtR",
  flatlay: "UKQ0Q}-=tT%0~Wt8W=V?_4j?oekD.8RPjEx^",
  action: "U9C?M{tl*J%25SR*yDs:8wRj8_Rj00V?8wIp",
  handheld: "U9H-=I00pJsA?^_300D*2cAI00_3yDWBib%M",
  noModel: "UJMaCT%M00xa~qof4nWBRjj[WBfQ-;ofM{j[",
  female: "UnL3rr-:~VRj~CkCNbRQniWBNGWXM{WBWBt7",
  male: "UXD]uN~qx]%M?bxuNGRjD%IoM|M{D%RjxZs:",
  diverse: "UNI#ZB?^D*8_~Wt-V?t8IVg4x]xuM{M|ozV@",
  handsOnly: "UNIhKj-;~q?cibo#9Z9ZoekXE1RjkD4otRxu",
  // Scene type previews
  studio: "UGF=lC~qfQ-;?bxuofWB_3RjM{of_3t7t7t7",
  lifestyle: "UJHoTo~Vxu?b-;WBWBM{_3ofRjay9FofM{t7",
  sceneTypeFlatlay: "ULJb~p~q9F?b-;M{M{M{_3t7ayof4nt7M{Rj",
  sceneTypeAction: "UCFic~9F~W%M?bxaM{M{_3WBxuay00ofD%t7",
};

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
  blurhash?: string;
}

export interface SceneVibe {
  id: string;
  label: string;
  description: string;
  icon: string;
  image: any;
  blurhash: string;
}

export interface CameraOption {
  id: string;
  label: string;
  description: string;
  icon: string;
  image: any;
  blurhash: string;
}

export interface ModelOption {
  id: string;
  label: string;
  description: string;
  icon: string;
  image: any;
  blurhash: string;
}

export type MockupUseCase = "neutral" | "listing" | "ad";
export type MockupAdStyle = "simple" | "exaggerated" | "trending";

export interface ProductMaterial {
  id: string;
  label: string;
  icon: string;
}

export interface ProductSize {
  id: string;
  label: string;
  description: string;
  icon: string;
}

export interface SceneType {
  id: string;
  label: string;
  description: string;
  icon: string;
  image: any;
  blurhash: string;
}

export interface SceneSetting {
  id: string;
  label: string;
  group: "indoor" | "outdoor";
}

export const PRODUCT_MATERIALS: ProductMaterial[] = [
  { id: "metal", label: "Metal", icon: "shield" },
  { id: "wood", label: "Wood", icon: "box" },
  { id: "fabric", label: "Fabric", icon: "feather" },
  { id: "plastic", label: "Plastic", icon: "archive" },
  { id: "glass", label: "Glass", icon: "aperture" },
  { id: "ceramic", label: "Ceramic", icon: "coffee" },
  { id: "paper", label: "Paper", icon: "file-text" },
  { id: "leather", label: "Leather", icon: "briefcase" },
  { id: "stone", label: "Stone", icon: "hexagon" },
  { id: "food", label: "Food", icon: "heart" },
  { id: "liquid", label: "Liquid", icon: "droplet" },
  { id: "other", label: "Other", icon: "more-horizontal" },
];

export const PRODUCT_SIZES: ProductSize[] = [
  {
    id: "pocket",
    label: "Pocket",
    description: "Fits in hand or pocket",
    icon: "smartphone",
  },
  {
    id: "tabletop",
    label: "Tabletop",
    description: "Sits on a surface",
    icon: "monitor",
  },
  {
    id: "oversized",
    label: "Oversized",
    description: "Furniture-scale",
    icon: "maximize-2",
  },
];

export const SCENE_TYPES: SceneType[] = [
  {
    id: "studio",
    label: "Studio",
    description: "Clean backdrop, professional lighting",
    icon: "aperture",
    image: studioSceneImage,
    blurhash: BLURHASH.studio,
  },
  {
    id: "lifestyle",
    label: "Lifestyle",
    description: "Real-world setting with context",
    icon: "home",
    image: lifestyleSceneImage,
    blurhash: BLURHASH.lifestyle,
  },
  {
    id: "flatlay",
    label: "Flat Lay",
    description: "Top-down styled arrangement",
    icon: "grid",
    image: flatlaySceneImage,
    blurhash: BLURHASH.sceneTypeFlatlay,
  },
  {
    id: "action",
    label: "Action",
    description: "Product in use",
    icon: "activity",
    image: actionSceneImage,
    blurhash: BLURHASH.sceneTypeAction,
  },
];

export const SCENE_SETTINGS: SceneSetting[] = [
  { id: "home", label: "Home", group: "indoor" },
  { id: "kitchen", label: "Kitchen", group: "indoor" },
  { id: "office", label: "Office", group: "indoor" },
  { id: "cafe", label: "Cafe", group: "indoor" },
  { id: "store", label: "Store", group: "indoor" },
  { id: "garden", label: "Garden", group: "outdoor" },
  { id: "street", label: "Street", group: "outdoor" },
  { id: "beach", label: "Beach", group: "outdoor" },
  { id: "park", label: "Park", group: "outdoor" },
];

export const MOCKUP_USE_CASES: {
  id: MockupUseCase;
  label: string;
  description: string;
}[] = [
  {
    id: "neutral",
    label: "Balanced",
    description: "Natural, authentic presentation",
  },
  {
    id: "listing",
    label: "Listing",
    description: "Clean, retail-ready product shot",
  },
  {
    id: "ad",
    label: "Advertise",
    description: "Styled marketing scene",
  },
];

export const MOCKUP_AD_STYLES: {
  id: MockupAdStyle;
  label: string;
  description: string;
}[] = [
  {
    id: "simple",
    label: "Simple",
    description: "Tasteful props, subtle mood",
  },
  {
    id: "exaggerated",
    label: "Exaggerated",
    description: "Bold, dramatic, high impact",
  },
  {
    id: "trending",
    label: "Trending",
    description: "Trend-forward, social-ready",
  },
];

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
        defaultColors: [
          "#FFFFFF",
          "#000000",
          "#1F2937",
          "#DC2626",
          "#2563EB",
          "#059669",
        ],
        image: tshirtImage,
        blurhash: BLURHASH.tshirt,
      },
      {
        id: "hoodie",
        label: "Hoodie",
        description: "Pullover hoodie with front pocket",
        hasColorPicker: true,
        defaultColors: ["#FFFFFF", "#000000", "#1F2937", "#6B7280", "#1E40AF"],
        image: hoodieImage,
        blurhash: BLURHASH.hoodie,
      },
      {
        id: "tanktop",
        label: "Tank Top",
        description: "Athletic tank top",
        hasColorPicker: true,
        defaultColors: ["#FFFFFF", "#000000", "#DC2626", "#2563EB"],
        image: tankTopImage,
        blurhash: BLURHASH.tankTop,
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
        blurhash: BLURHASH.mug,
      },
      {
        id: "tumbler",
        label: "Tumbler",
        description: "Insulated travel tumbler",
        hasColorPicker: true,
        defaultColors: ["#FFFFFF", "#000000", "#1F2937", "#0EA5E9"],
        image: tumblerImage,
        blurhash: BLURHASH.tumbler,
      },
      {
        id: "waterbottle",
        label: "Water Bottle",
        description: "Stainless steel water bottle",
        hasColorPicker: true,
        defaultColors: ["#FFFFFF", "#000000", "#0EA5E9", "#10B981"],
        image: tumblerImage,
        blurhash: BLURHASH.tumbler,
      },
      {
        id: "can",
        label: "Beverage Can",
        description: "Aluminum beverage can",
        hasColorPicker: false,
        image: tumblerImage,
        blurhash: BLURHASH.tumbler,
      },
    ],
  },
  {
    id: "phone_cases",
    label: "Phone Cases",
    icon: "smartphone",
    items: [
      {
        id: "phonecase",
        label: "Phone Case",
        description: "Smartphone protective case",
        hasColorPicker: true,
        defaultColors: ["#FFFFFF", "#000000", "#F97316"],
        image: phoneCaseImage,
        blurhash: BLURHASH.phoneCase,
      },
    ],
  },
  {
    id: "posters_prints",
    label: "Posters / Prints",
    icon: "image",
    items: [
      {
        id: "poster",
        label: "Poster",
        description: "Wall art poster print",
        hasColorPicker: false,
        image: posterImage,
        blurhash: BLURHASH.poster,
      },
      {
        id: "canvas",
        label: "Canvas",
        description: "Gallery wrapped canvas",
        hasColorPicker: false,
        image: canvasImage,
        blurhash: BLURHASH.canvas,
      },
      {
        id: "framedart",
        label: "Framed Art",
        description: "Art in elegant frame",
        hasColorPicker: true,
        defaultColors: ["#000000", "#FFFFFF", "#8B4513"],
        image: posterImage,
        blurhash: BLURHASH.poster,
      },
    ],
  },
  {
    id: "stickers_labels",
    label: "Stickers / Labels",
    icon: "tag",
    items: [
      {
        id: "sticker",
        label: "Sticker",
        description: "Die-cut vinyl sticker",
        hasColorPicker: false,
        image: posterImage,
        blurhash: BLURHASH.poster,
      },
    ],
  },
  {
    id: "tote_bags",
    label: "Tote Bags",
    icon: "shopping-bag",
    items: [
      {
        id: "totebag",
        label: "Tote Bag",
        description: "Canvas tote bag",
        hasColorPicker: true,
        defaultColors: ["#FFFFFF", "#000000", "#F5F5DC"],
        image: toteBagImage,
        blurhash: BLURHASH.toteBag,
      },
    ],
  },
  {
    id: "hats",
    label: "Hats",
    icon: "sun",
    items: [
      {
        id: "hat",
        label: "Hat",
        description: "Baseball cap",
        hasColorPicker: true,
        defaultColors: ["#FFFFFF", "#000000", "#1F2937", "#DC2626", "#2563EB"],
        image: capImage,
        blurhash: BLURHASH.cap,
      },
    ],
  },
  {
    id: "tech_accessories",
    label: "Tech Accessories",
    icon: "cpu",
    items: [
      {
        id: "laptopsleeve",
        label: "Laptop Sleeve",
        description: "Padded laptop sleeve",
        hasColorPicker: true,
        defaultColors: ["#1F2937", "#000000", "#6B7280"],
        image: laptopSleeveImage,
        blurhash: BLURHASH.laptopSleeve,
      },
      {
        id: "airpodscase",
        label: "AirPods Case",
        description: "Wireless earbuds case",
        hasColorPicker: true,
        defaultColors: ["#FFFFFF", "#000000", "#F97316"],
        image: phoneCaseImage,
        blurhash: BLURHASH.phoneCase,
      },
    ],
  },
  {
    id: "beauty_skincare",
    label: "Beauty / Skincare",
    icon: "droplet",
    items: [
      {
        id: "skincare_bottle",
        label: "Skincare Bottle",
        description: "Cosmetic pump bottle",
        hasColorPicker: true,
        defaultColors: ["#FFFFFF", "#F5F5F5", "#1F2937"],
        image: tumblerImage,
        blurhash: BLURHASH.tumbler,
      },
      {
        id: "cosmetic_jar",
        label: "Cosmetic Jar",
        description: "Round skincare jar",
        hasColorPicker: true,
        defaultColors: ["#FFFFFF", "#F5F5F5", "#1F2937"],
        image: mugImage,
        blurhash: BLURHASH.mug,
      },
      {
        id: "skincare_tube",
        label: "Skincare Tube",
        description: "Soft squeeze tube",
        hasColorPicker: true,
        defaultColors: ["#FFFFFF", "#F5F5F5", "#1F2937"],
        image: tumblerImage,
        blurhash: BLURHASH.tumbler,
      },
    ],
  },
  {
    id: "home_goods",
    label: "Home Goods",
    icon: "home",
    items: [
      {
        id: "pillow",
        label: "Pillow",
        description: "Decorative throw pillow",
        hasColorPicker: true,
        defaultColors: ["#FFFFFF", "#000000", "#F5F5DC"],
        image: toteBagImage,
        blurhash: BLURHASH.toteBag,
      },
    ],
  },
];

export const SCENE_VIBES: SceneVibe[] = [
  {
    id: "dynamic",
    label: "Dynamic",
    description:
      "Action, sports, outdoor adventure - perfect for energy drinks, fitness gear",
    icon: "zap",
    image: dynamicVibeImage,
    blurhash: BLURHASH.dynamic,
  },
  {
    id: "professional",
    label: "Professional",
    description:
      "Office, business meeting, clean desk - great for corporate products",
    icon: "briefcase",
    image: professionalVibeImage,
    blurhash: BLURHASH.professional,
  },
  {
    id: "casual",
    label: "Casual",
    description:
      "Coffee shop, home, urban street - ideal for lifestyle products",
    icon: "home",
    image: casualVibeImage,
    blurhash: BLURHASH.casual,
  },
  {
    id: "premium",
    label: "Premium",
    description: "Studio lighting, marble surfaces, luxury aesthetic",
    icon: "star",
    image: premiumVibeImage,
    blurhash: BLURHASH.premium,
  },
  {
    id: "fun",
    label: "Fun",
    description:
      "Bright colors, party scenes, beach vibes - great for playful brands",
    icon: "sun",
    image: funVibeImage,
    blurhash: BLURHASH.fun,
  },
];

export const CAMERA_OPTIONS: CameraOption[] = [
  {
    id: "closeup",
    label: "Close-up",
    description: "Detailed product focus",
    icon: "zoom-in",
    image: closeupCameraImage,
    blurhash: BLURHASH.closeup,
  },
  {
    id: "medium",
    label: "Medium",
    description: "Balanced view with context",
    icon: "maximize",
    image: mediumCameraImage,
    blurhash: BLURHASH.medium,
  },
  {
    id: "wide",
    label: "Wide",
    description: "Full environmental shot",
    icon: "maximize-2",
    image: wideCameraImage,
    blurhash: BLURHASH.wide,
  },
  {
    id: "flatlay",
    label: "Flat Lay",
    description: "Top-down perspective",
    icon: "grid",
    image: flatlayCameraImage,
    blurhash: BLURHASH.flatlay,
  },
  {
    id: "action",
    label: "Action",
    description: "Motion blur, dynamic angle",
    icon: "activity",
    image: actionCameraImage,
    blurhash: BLURHASH.action,
  },
  {
    id: "handheld",
    label: "In-Use",
    description: "Product being used/held",
    icon: "user",
    image: handheldCameraImage,
    blurhash: BLURHASH.handheld,
  },
];

export const MODEL_OPTIONS: ModelOption[] = [
  {
    id: "none",
    label: "No Model",
    description: "Product only, no people",
    icon: "package",
    image: noModelImage,
    blurhash: BLURHASH.noModel,
  },
  {
    id: "female",
    label: "Female Model",
    description: "Woman wearing or using the product",
    icon: "user",
    image: femaleModelImage,
    blurhash: BLURHASH.female,
  },
  {
    id: "male",
    label: "Male Model",
    description: "Man wearing or using the product",
    icon: "user",
    image: maleModelImage,
    blurhash: BLURHASH.male,
  },
  {
    id: "diverse",
    label: "Diverse Group",
    description: "Group of diverse people",
    icon: "users",
    image: diverseGroupImage,
    blurhash: BLURHASH.diverse,
  },
  {
    id: "hands",
    label: "Hands Only",
    description: "Just hands holding or using product",
    icon: "hand",
    image: handsOnlyImage,
    blurhash: BLURHASH.handsOnly,
  },
];

export function getMockupPrompt(
  mockupItem: MockupItem,
  sceneVibe: SceneVibe,
  cameraOption: CameraOption,
  mockupColor?: string,
  customDescription?: string,
  modelOption?: ModelOption,
  customScenePrompt?: string,
  negativePrompt?: string,
  useCase: MockupUseCase = "neutral",
  adStyle: MockupAdStyle = "simple",
  productCategoryId?: string,
  desiredMockup?: string,
  templatePrompt?: string,
  outputFormatInstruction?: string,
  productMaterial?: string,
  productSize?: string,
  hasDesign?: boolean,
  sceneType?: string,
  sceneSetting?: string,
): string {
  // Prompt requirements: docs/ai-prompt-requirements.md
  const isCustomProduct = mockupItem.id === "custom";
  const productName = mockupItem.label.toLowerCase();
  const colorDesc = mockupColor
    ? `The ${productName} color is ${mockupColor}.`
    : "";

  const vibeDescriptions: Record<string, string> = {
    dynamic:
      "in an energetic, action-packed setting with dynamic lighting and motion. Think extreme sports, fitness, adventure. High energy and exciting.",
    professional:
      "in a clean, professional business environment. Modern office, meeting room, or executive desk. Sophisticated and corporate.",
    casual:
      "in a relaxed, everyday lifestyle setting. Cozy coffee shop, comfortable home, or casual urban street scene. Warm and inviting.",
    premium:
      "in a luxurious, high-end studio setting. Perfect lighting, marble or elegant surfaces, premium aesthetic. Sophisticated and aspirational.",
    fun: "in a vibrant, playful setting with bright colors. Party atmosphere, beach vibes, or colorful backdrop. Joyful and energetic.",
  };

  const cameraDescriptions: Record<string, string> = {
    closeup: "Shot as a close-up detail shot focusing on the product details.",
    medium:
      "Shot as a medium shot showing the product with some environmental context.",
    wide: "Shot as a wide environmental shot showing the full scene with the product.",
    flatlay: "Shot as a flat lay from directly above, top-down perspective.",
    action:
      "Shot with motion blur and dynamic angles conveying energy and movement.",
    handheld: "Shot showing someone holding or actively using the product.",
  };

  const modelDescriptions: Record<string, string> = {
    none: "",
    female:
      "Feature an attractive adult woman wearing or using the product naturally. She should look confident and authentic, like in a lifestyle advertisement. Professional model-quality appearance.",
    male: "Feature an attractive adult man wearing or using the product naturally. He should look confident and authentic, like in a lifestyle advertisement. Professional model-quality appearance.",
    diverse:
      "Feature a diverse group of attractive adults wearing or using the product together. They should look natural and authentic, like in a lifestyle advertisement for an inclusive brand.",
    hands:
      "Show just human hands holding or using the product naturally. Focus on the hands and product interaction without showing the full person.",
  };

  const productInstruction = isCustomProduct
    ? `IMPORTANT: The user specifically wants their design/logo placed on a "${productName}". Create a realistic ${productName} with their design.`
    : `Create a professional product mockup of the provided design/logo placed on a ${productName}.`;

  const designIntegrityInstruction =
    hasDesign === false
      ? ""
      : "Keep the provided design/logo exactly as supplied (no edits, no recoloring, no stretching, no repositioning).";

  const categoryInstructions: Record<string, string> = {
    apparel:
      "Render realistic fabric texture, folds, and seams. The design should appear naturally printed or embroidered on the garment with correct perspective.",
    drinkware:
      "Render realistic curvature, gloss, and reflections. The design should wrap naturally around the surface.",
    phone_cases:
      "Render a realistic phone case with correct edge curvature and material finish. The design should align cleanly on the back surface.",
    posters_prints:
      "Render a flat print with crisp edges and accurate scale. The design should look professionally printed on paper or canvas.",
    stickers_labels:
      "Render a realistic sticker or label with clean edges and proper adhesion to the surface. Keep the design crisp and legible.",
    tote_bags:
      "Render realistic canvas texture and natural folds. The design should sit naturally on the bag surface.",
    hats: "Render realistic fabric texture and seams. The design should follow the curvature of the hat panel.",
    tech_accessories:
      "Render realistic materials and product geometry. The design should align correctly on the product surface.",
    beauty_skincare:
      "Render a clean, premium cosmetic package with accurate materials and soft reflections. The design should appear professionally printed.",
    home_goods:
      "Render realistic textiles or surfaces with natural folds and texture. The design should sit naturally on the product.",
  };

  const categoryInstruction =
    productCategoryId && categoryInstructions[productCategoryId]
      ? ` ${categoryInstructions[productCategoryId]}`
      : "";

  const materialLabel = productMaterial
    ? PRODUCT_MATERIALS.find((m) => m.id === productMaterial)?.label
    : undefined;
  const materialInstruction = materialLabel
    ? ` Material: ${materialLabel}. Render realistic ${materialLabel.toLowerCase()} texture, weight, and light interaction.`
    : "";

  const sizeLabel = productSize
    ? PRODUCT_SIZES.find((s) => s.id === productSize)?.label
    : undefined;
  const sizeInstruction = sizeLabel
    ? ` Product size: ${sizeLabel}. Frame composition accordingly.`
    : "";

  const sceneTypeObj = sceneType
    ? SCENE_TYPES.find((s) => s.id === sceneType)
    : undefined;
  const sceneTypeInstruction = sceneTypeObj
    ? ` Scene type: ${sceneTypeObj.description}.`
    : "";

  const settingLabel = sceneSetting
    ? SCENE_SETTINGS.find((s) => s.id === sceneSetting)?.label
    : undefined;
  const settingInstruction = settingLabel
    ? ` Setting: ${settingLabel} environment.`
    : "";

  const customProductInstruction = isCustomProduct
    ? ` Use the user's product description as the primary specification.${materialInstruction || " Infer realistic material, shape, size, and surface based on that description."}`
    : "";

  const desiredMockupInstruction = desiredMockup?.trim()
    ? ` Desired mockup request: ${desiredMockup.trim()}. Prioritize this request while keeping the product realistic and the design accurate.`
    : "";

  const templateInstruction = templatePrompt?.trim()
    ? ` Template direction: ${templatePrompt.trim()}`
    : "";

  const useCaseInstruction =
    useCase === "neutral"
      ? "Create a balanced, natural product presentation. Avoid heavy marketing styling. Keep lighting realistic, props minimal, and focus on clarity and authenticity. The product should feel real and unforced."
      : useCase === "listing"
        ? "Create a clean, retail-ready listing image. Keep the product clearly visible, evenly lit, and accurately represented. Use minimal props and a tidy background to maximize clarity and product detail. No distracting elements."
        : adStyle === "exaggerated"
          ? "Create a bold, high-impact advertising scene with dramatic lighting, dynamic props, and a striking composition. Make the product feel heroic while keeping the product and design accurate."
          : adStyle === "trending"
            ? "Create a trend-forward advertising scene optimized for social engagement. Use vibrant styling, modern props, and eye-catching composition. Keep the product and design accurate while making it feel current and shareable. Use slightly higher saturation and contrast for a punchier look."
            : "Create a tasteful advertising scene with subtle props and mood lighting. Keep the product as the clear focal point. The scene should feel premium but restrained.";

  const modelInstruction =
    modelOption && modelOption.id !== "none"
      ? ` ${modelDescriptions[modelOption.id]}`
      : "";

  const basePrompt = `${productInstruction} ${designIntegrityInstruction}${categoryInstruction}${customProductInstruction}${sizeInstruction}${sceneTypeInstruction}${settingInstruction} ${useCaseInstruction}${templateInstruction}${desiredMockupInstruction} ${colorDesc}${modelInstruction} The scene should be ${vibeDescriptions[sceneVibe.id] || vibeDescriptions.casual} ${cameraDescriptions[cameraOption.id] || cameraDescriptions.medium} CRITICAL: The camera angle must be followed precisely and must apply to the product framing and how the product is photographed (not just the background scene).`;

  const customAddition = customDescription
    ? ` Additional context: ${customDescription}`
    : "";

  const customSceneAddition = customScenePrompt
    ? ` Custom scene request: ${customScenePrompt}`
    : "";
  const negativeAddition = negativePrompt ? ` Avoid: ${negativePrompt}` : "";

  const formatInstruction = outputFormatInstruction?.trim()
    ? ` ${outputFormatInstruction.trim()}`
    : "";

  return `Generate a high quality, photorealistic image.${formatInstruction} ${basePrompt} CRITICAL: Camera angle applies to the product framing, not just the scene. ${customAddition}${customSceneAddition}${negativeAddition} The product placement should look natural and realistic with proper perspective, lighting, and shadows. The scene must fill the entire frame edge-to-edge with no padding or borders.`;
}
