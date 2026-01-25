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

const closeupCameraImage = require("../../assets/images/mockups/close-up_camera_angle_preview.webp");
const mediumCameraImage = require("../../assets/images/mockups/medium_camera_angle_preview.webp");
const wideCameraImage = require("../../assets/images/mockups/wide_camera_angle_preview.webp");
const flatlayCameraImage = require("../../assets/images/mockups/flat_lay_camera_angle_preview.webp");
const actionCameraImage = require("../../assets/images/mockups/action_camera_angle_preview.webp");
const handheldCameraImage = require("../../assets/images/mockups/in-use_camera_angle_preview.webp");

const noModelImage = require("../../assets/images/mockups/no_model_preview.webp");
const femaleModelImage = require("../../assets/images/mockups/female_model_preview.webp");
const maleModelImage = require("../../assets/images/mockups/male_model_preview.webp");
const diverseGroupImage = require("../../assets/images/mockups/diverse_group_preview.webp");
const handsOnlyImage = require("../../assets/images/mockups/hands_only_preview.webp");

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
        blurhash: BLURHASH.phoneCase,
      },
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
      {
        id: "billboard",
        label: "Billboard",
        description: "Large outdoor billboard",
        hasColorPicker: false,
        image: posterImage,
        blurhash: BLURHASH.poster,
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
        blurhash: BLURHASH.toteBag,
      },
      {
        id: "hat",
        label: "Hat",
        description: "Baseball cap",
        hasColorPicker: true,
        defaultColors: ["#FFFFFF", "#000000", "#1F2937", "#DC2626", "#2563EB"],
        image: capImage,
        blurhash: BLURHASH.cap,
      },
      {
        id: "pillow",
        label: "Pillow",
        description: "Decorative throw pillow",
        hasColorPicker: true,
        defaultColors: ["#FFFFFF", "#000000", "#F5F5DC"],
        image: toteBagImage,
        blurhash: BLURHASH.toteBag,
      },
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
    : `Create a realistic product mockup of the provided design/logo placed on a ${productName}.`;

  const modelInstruction =
    modelOption && modelOption.id !== "none"
      ? ` ${modelDescriptions[modelOption.id]}`
      : "";

  const basePrompt = `${productInstruction} ${colorDesc}${modelInstruction} The scene should be ${vibeDescriptions[sceneVibe.id] || vibeDescriptions.casual} ${cameraDescriptions[cameraOption.id] || cameraDescriptions.medium}`;

  const customAddition = customDescription
    ? ` Additional context: ${customDescription}`
    : "";

  const customSceneAddition = customScenePrompt
    ? ` Custom scene request: ${customScenePrompt}`
    : "";
  const negativeAddition = negativePrompt ? ` Avoid: ${negativePrompt}` : "";

  return `${basePrompt}${customAddition}${customSceneAddition}${negativeAddition} The product placement should look natural and realistic with proper perspective, lighting, and shadows. High quality, photorealistic result.`;
}
