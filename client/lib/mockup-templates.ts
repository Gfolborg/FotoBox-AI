import {
  MOCKUP_CATEGORIES,
  SCENE_VIBES,
  CAMERA_OPTIONS,
  MODEL_OPTIONS,
} from "@/lib/mockup-presets";

export type MockupTemplate = {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  useCase?: "neutral" | "listing" | "ad";
  adStyle?: "simple" | "exaggerated" | "trending";
  vibeId?: string;
  cameraId?: string;
  modelId?: string;
  productCategoryId?: string;
  productId?: string;
  prompt?: string;
  tags?: string[];
  isFeatured?: boolean;
  isCustomScene?: boolean;
};

export type MockupWizardMode = "quick" | "custom";

export type MockupWizardState = {
  mode: MockupWizardMode;
  images: string[];
  templateId?: string;
  templatePrompt?: string;
  productCategoryId?: string;
  productId?: string;
  customProductName?: string;
  desiredMockup?: string;
  productColor?: string;
  vibeId?: string;
  cameraId?: string;
  modelId?: string;
  useCase?: "neutral" | "listing" | "ad";
  adStyle?: "simple" | "exaggerated" | "trending";
  customScenePrompt?: string;
  negativePrompt?: string;
  additionalNotes?: string;
  applyToAll?: boolean;
  outputCount?: number;
  productMaterial?: string;
  productSize?: string;
  hasDesign?: boolean;
  sceneType?: string;
  sceneSetting?: string;
};

export function buildMockupWizardState(
  images: string[],
  overrides: Partial<MockupWizardState> = {},
): MockupWizardState {
  return {
    mode: "custom",
    images,
    applyToAll: true,
    outputCount: 1,
    ...overrides,
  };
}

type CuratedTemplate = Omit<
  MockupTemplate,
  "id" | "productCategoryId" | "productId" | "useCase" | "adStyle"
>;

type CategoryTemplateSet = {
  balanced: CuratedTemplate[];
  listing: CuratedTemplate[];
  ad: AdStyleTemplateSet;
};

type AdStyleTemplateSet = {
  simple: CuratedTemplate[];
  exaggerated: CuratedTemplate[];
  trending: CuratedTemplate[];
};

const AD_STYLE_PROMPTS: Record<NonNullable<MockupTemplate["adStyle"]>, string> = {
  simple:
    "Advertising style: simple and refined. Use restrained props, soft contrast, and elegant composition. Keep the product the hero.",
  exaggerated:
    "Advertising style: exaggerated and bold. Use dramatic lighting, dynamic props, energetic composition, and heightened contrast. Make the scene feel high-impact.",
  trending:
    "Advertising style: trending and social-ready. Use modern props, vibrant color accents, and a punchy composition. Slightly higher saturation and contrast.",
};

const AD_CATEGORY_CONTEXT: Record<string, string> = {
  apparel:
    "Show the apparel clearly with flattering drape and visible print placement.",
  drinkware:
    "Show the drinkware shape clearly, with reflections and liquid context when appropriate.",
  phone_cases:
    "Show the phone case on a phone with the design clearly visible on the back.",
  posters_prints:
    "Show the print framed or mounted, with clear scale and crisp edges.",
  stickers_labels:
    "Show the sticker or label applied cleanly to a realistic surface.",
  tote_bags:
    "Show the tote bag form and handles clearly with the design centered.",
  hats: "Show the hat front panel clearly with the design visible.",
  tech_accessories:
    "Show the accessory in context with clean edges and accurate geometry.",
  beauty_skincare:
    "Show the skincare product packaging clearly with premium reflections.",
  home_goods:
    "Show the home goods item in a realistic setting with accurate scale.",
};

const AD_STYLE_TEMPLATES: AdStyleTemplateSet = {
  simple: [
    {
      title: "Clean Spotlight",
      subtitle: "Soft hero focus",
      icon: "star",
      vibeId: "premium",
      cameraId: "closeup",
      modelId: "none",
      prompt:
        "Clean hero setup with soft key light and gentle shadows. Keep props minimal and the product centered.",
    },
    {
      title: "Soft Color Accent",
      subtitle: "Muted color pop",
      icon: "droplet",
      vibeId: "fun",
      cameraId: "medium",
      modelId: "none",
      prompt:
        "Muted color backdrop with subtle complementary props. Controlled contrast and restrained styling.",
    },
    {
      title: "Calm In-Use",
      subtitle: "Quiet lifestyle moment",
      icon: "activity",
      vibeId: "casual",
      cameraId: "handheld",
      modelId: "hands",
      prompt:
        "In-use moment with calm energy, soft lighting, and minimal props. Keep the scene natural and uncluttered.",
    },
    {
      title: "Subtle Motion",
      subtitle: "Gentle movement",
      icon: "zap",
      vibeId: "casual",
      cameraId: "action",
      modelId: "none",
      prompt:
        "Subtle motion cues with a clean composition and light directional flow, not exaggerated.",
    },
    {
      title: "Everyday Story",
      subtitle: "Simple narrative",
      icon: "book-open",
      vibeId: "casual",
      cameraId: "medium",
      modelId: "none",
      prompt:
        "Simple narrative scene with a few supporting props and soft ambient light. Keep the product central.",
    },
    {
      title: "Daylight Lift",
      subtitle: "Soft natural glow",
      icon: "sun",
      vibeId: "casual",
      cameraId: "wide",
      modelId: "none",
      prompt:
        "Soft daylight scene with gentle highlights and an airy background.",
    },
    {
      title: "Texture Focus",
      subtitle: "Quiet material detail",
      icon: "layers",
      vibeId: "premium",
      cameraId: "closeup",
      modelId: "none",
      prompt:
        "Close framing with refined textures and soft highlights. Keep the scene minimal.",
    },
    {
      title: "Minimal Flatlay",
      subtitle: "Tidy top-down",
      icon: "grid",
      vibeId: "professional",
      cameraId: "flatlay",
      modelId: "none",
      prompt:
        "Minimal top-down flatlay with tidy spacing and a calm, clean look.",
    },
  ],
  exaggerated: [
    {
      title: "Hero Blast",
      subtitle: "High-impact spotlight",
      icon: "star",
      vibeId: "premium",
      cameraId: "closeup",
      modelId: "none",
      prompt:
        "Dramatic hero spotlight with strong contrast, bold lighting, and intense focus on the product.",
    },
    {
      title: "Neon Pop",
      subtitle: "Bold color punch",
      icon: "droplet",
      vibeId: "fun",
      cameraId: "medium",
      modelId: "none",
      prompt:
        "Bold, saturated backdrop with high-contrast props. Vibrant, energetic styling that demands attention.",
    },
    {
      title: "Action Burst",
      subtitle: "Energetic in-use",
      icon: "activity",
      vibeId: "dynamic",
      cameraId: "handheld",
      modelId: "hands",
      prompt:
        "High-energy in-use moment with dynamic lighting and strong motion cues.",
    },
    {
      title: "Kinetic Motion",
      subtitle: "Dynamic angles",
      icon: "zap",
      vibeId: "dynamic",
      cameraId: "action",
      modelId: "none",
      prompt:
        "Kinetic composition with bold angles, dramatic motion, and punchy lighting.",
    },
    {
      title: "Epic Story Scene",
      subtitle: "Big narrative setup",
      icon: "book-open",
      vibeId: "dynamic",
      cameraId: "medium",
      modelId: "none",
      prompt:
        "Large-scale narrative scene with strong props and dramatic lighting. Make it feel cinematic.",
    },
    {
      title: "Golden Hour Glow",
      subtitle: "Intense warm light",
      icon: "sun",
      vibeId: "dynamic",
      cameraId: "wide",
      modelId: "none",
      prompt:
        "Golden hour lighting with intense highlights and deep shadows. Warm, dramatic atmosphere.",
    },
    {
      title: "Texture Stage",
      subtitle: "Rich material drama",
      icon: "layers",
      vibeId: "premium",
      cameraId: "closeup",
      modelId: "none",
      prompt:
        "Material-rich surface with bold texture contrast and dramatic lighting.",
    },
    {
      title: "Graphic Flatlay",
      subtitle: "Bold top-down layout",
      icon: "grid",
      vibeId: "fun",
      cameraId: "flatlay",
      modelId: "none",
      prompt:
        "Graphic top-down flatlay with bold props, strong shapes, and high-contrast styling.",
    },
  ],
  trending: [
    {
      title: "Social Spotlight",
      subtitle: "Creator-ready hero",
      icon: "star",
      vibeId: "premium",
      cameraId: "closeup",
      modelId: "none",
      prompt:
        "Creator-style hero setup with modern props and clean, social-ready lighting.",
    },
    {
      title: "Creator Pop",
      subtitle: "Trendy color palette",
      icon: "droplet",
      vibeId: "fun",
      cameraId: "medium",
      modelId: "none",
      prompt:
        "Trendy color palette with playful props and a clean, contemporary feel.",
    },
    {
      title: "Lifestyle Reel",
      subtitle: "Candid in-use",
      icon: "activity",
      vibeId: "casual",
      cameraId: "handheld",
      modelId: "hands",
      prompt:
        "Candid in-use moment with social-style framing and soft background blur.",
    },
    {
      title: "Swipe Motion",
      subtitle: "Dynamic framing",
      icon: "zap",
      vibeId: "dynamic",
      cameraId: "action",
      modelId: "none",
      prompt:
        "Dynamic framing with modern, social-ready motion cues and crisp lighting.",
    },
    {
      title: "Storyboard Scene",
      subtitle: "Trendy narrative",
      icon: "book-open",
      vibeId: "casual",
      cameraId: "medium",
      modelId: "none",
      prompt:
        "Trendy narrative scene with playful, modern props and clean composition.",
    },
    {
      title: "Outdoor Creator",
      subtitle: "Golden hour social",
      icon: "sun",
      vibeId: "dynamic",
      cameraId: "wide",
      modelId: "none",
      prompt:
        "Outdoor golden-hour scene with social-ready styling and modern props.",
    },
    {
      title: "Aesthetic Detail",
      subtitle: "Clean macro",
      icon: "layers",
      vibeId: "premium",
      cameraId: "closeup",
      modelId: "none",
      prompt:
        "Aesthetic macro detail with clean highlights and a modern, minimal vibe.",
    },
    {
      title: "Creator Flatlay",
      subtitle: "Trendy top-down",
      icon: "grid",
      vibeId: "fun",
      cameraId: "flatlay",
      modelId: "none",
      prompt:
        "Top-down flatlay with trendy props and a crisp, social-ready composition.",
    },
  ],
};

// Backward-compat alias for any lingering references in cached bundles.
const AD_BASE_TEMPLATES: CuratedTemplate[] = AD_STYLE_TEMPLATES.simple;

const getAdTemplatesForStyle = (
  templates: CategoryTemplateSet,
  style: "simple" | "exaggerated" | "trending",
) => {
  const adTemplates = templates.ad;
  if (Array.isArray(adTemplates)) return adTemplates;
  return adTemplates[style] || [];
};

const CURATED_TEMPLATES: Record<string, CategoryTemplateSet> = {
  apparel: {
    balanced: [
      {
        title: "Everyday Flatlay",
        subtitle: "Natural light, soft textures",
        icon: "grid",
        vibeId: "casual",
        cameraId: "flatlay",
        modelId: "none",
        prompt:
          "Natural flatlay of the garment on a neutral surface, soft daylight and subtle fabric texture, light everyday props.",
      },
      {
        title: "Casual Folded Stack",
        subtitle: "Relaxed, lived-in look",
        icon: "layers",
        vibeId: "casual",
        cameraId: "medium",
        modelId: "none",
        prompt:
          "Folded stack of apparel with gentle, imperfect folds, relaxed tabletop scene, soft ambient light.",
      },
      {
        title: "Relaxed On-Model",
        subtitle: "Natural pose, easy fit",
        icon: "user",
        vibeId: "casual",
        cameraId: "medium",
        modelId: "female",
        prompt:
          "Model wearing the apparel in a relaxed, natural pose with soft daylight and minimal staging.",
      },
      {
        title: "At-Home Wear",
        subtitle: "Comfortable lifestyle",
        icon: "home",
        vibeId: "casual",
        cameraId: "medium",
        modelId: "female",
        prompt:
          "At-home lifestyle scene with the apparel, warm natural light and a comfortable vibe.",
      },
      {
        title: "Wardrobe Hang",
        subtitle: "Simple, everyday storage",
        icon: "layout",
        vibeId: "casual",
        cameraId: "medium",
        modelId: "none",
        prompt:
          "Garment hanging in a simple wardrobe setting, soft side light, natural shadows.",
      },
      {
        title: "Weekend Street",
        subtitle: "Easy outdoor styling",
        icon: "sun",
        vibeId: "casual",
        cameraId: "medium",
        modelId: "female",
        prompt:
          "Casual street moment with the apparel, natural daylight and relaxed styling.",
      },
      {
        title: "Fabric Detail",
        subtitle: "Soft texture close-up",
        icon: "zoom-in",
        vibeId: "premium",
        cameraId: "closeup",
        modelId: "none",
        prompt:
          "Close-up of fabric and print detail with soft, natural lighting and gentle texture.",
      },
      {
        title: "Packaging Moment",
        subtitle: "Simple unboxing feel",
        icon: "package",
        vibeId: "casual",
        cameraId: "medium",
        modelId: "none",
        prompt:
          "Apparel folded with simple packaging, relaxed tabletop scene, soft daylight.",
      },
    ],
    listing: [
      {
        title: "Studio Flatlay",
        subtitle: "Clean tabletop, soft light",
        icon: "grid",
        vibeId: "professional",
        cameraId: "flatlay",
        modelId: "none",
        prompt:
          "Clean studio flatlay of the garment on a light neutral surface, neatly arranged with minimal props and soft diffused light.",
      },
      {
        title: "Folded Stack",
        subtitle: "Neat folds, tidy surface",
        icon: "layers",
        vibeId: "professional",
        cameraId: "medium",
        modelId: "none",
        prompt:
          "Folded stack of garments with the design visible on the top item, tidy tabletop, even studio lighting, subtle shadows.",
      },
      {
        title: "On-Model Neutral",
        subtitle: "Simple pose, clean backdrop",
        icon: "user",
        vibeId: "professional",
        cameraId: "medium",
        modelId: "female",
        prompt:
          "Model wearing the apparel in a neutral studio setting, simple pose, clean background, even lighting.",
      },
      {
        title: "On-Model Lifestyle",
        subtitle: "Warm, casual setting",
        icon: "sun",
        vibeId: "casual",
        cameraId: "medium",
        modelId: "female",
        prompt:
          "Model wearing the apparel in a casual lifestyle setting (home or cafe), warm natural light, candid moment.",
      },
      {
        title: "Hanging Rack",
        subtitle: "Minimalist wardrobe look",
        icon: "layout",
        vibeId: "professional",
        cameraId: "medium",
        modelId: "none",
        prompt:
          "Garment hanging on a minimalist clothing rack against a neutral wall, soft side light, tidy scene.",
      },
      {
        title: "Street Candid",
        subtitle: "Urban, natural light",
        icon: "camera",
        vibeId: "dynamic",
        cameraId: "medium",
        modelId: "female",
        prompt:
          "Outdoor street-style shot with the model wearing the apparel, natural daylight, shallow depth of field, urban background.",
      },
      {
        title: "Fabric Detail",
        subtitle: "Texture close-up",
        icon: "zoom-in",
        vibeId: "premium",
        cameraId: "closeup",
        modelId: "none",
        prompt:
          "Close-up crop of the fabric and print detail, shallow depth of field, premium lighting that highlights texture.",
      },
      {
        title: "Packaging",
        subtitle: "Mailer or box scene",
        icon: "package",
        vibeId: "professional",
        cameraId: "medium",
        modelId: "none",
        prompt:
          "Apparel folded in a neat mailer or packaging box on a clean tabletop, overhead or 3/4 view, soft light.",
      },
    ],
    ad: AD_STYLE_TEMPLATES,
  },
  drinkware: {
    balanced: [
      {
        title: "Everyday Counter",
        subtitle: "Soft morning light",
        icon: "coffee",
        vibeId: "casual",
        cameraId: "medium",
        modelId: "none",
        prompt:
          "Drinkware on a kitchen counter with soft natural light, relaxed everyday props, casual styling.",
      },
      {
        title: "Morning Handheld",
        subtitle: "Cozy in-hand moment",
        icon: "hand",
        vibeId: "casual",
        cameraId: "handheld",
        modelId: "hands",
        prompt:
          "Hand holding the drinkware in a cozy morning moment, gentle light, background softly blurred.",
      },
      {
        title: "Desk Break",
        subtitle: "Casual workspace",
        icon: "monitor",
        vibeId: "casual",
        cameraId: "medium",
        modelId: "none",
        prompt:
          "Drinkware on a simple desk setup with light clutter, relaxed and natural lighting.",
      },
      {
        title: "Outdoor Sip",
        subtitle: "Fresh daylight",
        icon: "sun",
        vibeId: "casual",
        cameraId: "wide",
        modelId: "none",
        prompt:
          "Outdoor drinkware moment with fresh daylight and casual props.",
      },
      {
        title: "Soft Close-up",
        subtitle: "Gentle highlights",
        icon: "zoom-in",
        vibeId: "premium",
        cameraId: "closeup",
        modelId: "none",
        prompt:
          "Close-up with soft highlights and natural reflections, calm and understated.",
      },
      {
        title: "Shelf Moment",
        subtitle: "Relaxed styling",
        icon: "home",
        vibeId: "casual",
        cameraId: "medium",
        modelId: "none",
        prompt:
          "Drinkware on a simple shelf with a few everyday objects, soft ambient light.",
      },
      {
        title: "Breakfast Table",
        subtitle: "Casual morning scene",
        icon: "sunrise",
        vibeId: "casual",
        cameraId: "medium",
        modelId: "none",
        prompt:
          "Breakfast table setup with a warm, relaxed morning feel and minimal props.",
      },
      {
        title: "Chilled Detail",
        subtitle: "Subtle condensation",
        icon: "droplet",
        vibeId: "premium",
        cameraId: "closeup",
        modelId: "none",
        prompt:
          "Close-up of a cold drinkware surface with subtle condensation, soft directional light.",
      },
    ],
    listing: [
      {
        title: "Kitchen Hero",
        subtitle: "Bright countertop scene",
        icon: "coffee",
        vibeId: "casual",
        cameraId: "medium",
        modelId: "none",
        prompt:
          "Drinkware hero shot on a kitchen counter, morning light, minimal props, clean composition.",
      },
      {
        title: "Handheld Sip",
        subtitle: "In-hand lifestyle",
        icon: "hand",
        vibeId: "casual",
        cameraId: "handheld",
        modelId: "hands",
        prompt:
          "Hand holding the drinkware mid-sip, soft window light, blurred background for focus.",
      },
      {
        title: "Desk Setup",
        subtitle: "Modern workspace",
        icon: "monitor",
        vibeId: "professional",
        cameraId: "medium",
        modelId: "none",
        prompt:
          "Drinkware beside a laptop and desk items, modern workspace, clean lighting.",
      },
      {
        title: "Outdoor Picnic",
        subtitle: "Fresh natural light",
        icon: "sun",
        vibeId: "fun",
        cameraId: "wide",
        modelId: "none",
        prompt:
          "Drinkware outdoors on a picnic table with fresh props, natural sunlight, airy scene.",
      },
      {
        title: "Studio Close-up",
        subtitle: "Crisp product detail",
        icon: "zoom-in",
        vibeId: "premium",
        cameraId: "closeup",
        modelId: "none",
        prompt:
          "Studio close-up on a seamless backdrop, crisp edges, glossy highlights.",
      },
      {
        title: "Shelf Styling",
        subtitle: "Soft ambient light",
        icon: "home",
        vibeId: "casual",
        cameraId: "medium",
        modelId: "none",
        prompt:
          "Drinkware styled on an open shelf with minimal decor, soft ambient light.",
      },
      {
        title: "Morning Coffee",
        subtitle: "Cozy breakfast feel",
        icon: "sunrise",
        vibeId: "casual",
        cameraId: "medium",
        modelId: "none",
        prompt:
          "Warm morning coffee scene with cozy props, steam, and gentle natural light.",
      },
      {
        title: "Condensation Detail",
        subtitle: "Cold, crisp texture",
        icon: "droplet",
        vibeId: "premium",
        cameraId: "closeup",
        modelId: "none",
        prompt:
          "Cold drinkware with condensation detail, dramatic lighting, macro emphasis.",
      },
    ],
    ad: AD_STYLE_TEMPLATES,
  },
  phone_cases: {
    balanced: [
      {
        title: "Everyday Handheld",
        subtitle: "Natural in-hand view",
        icon: "smartphone",
        vibeId: "casual",
        cameraId: "handheld",
        modelId: "hands",
        prompt:
          "Hand holding the phone in a natural moment, soft daylight, clean background.",
      },
      {
        title: "Work Desk",
        subtitle: "Casual workspace",
        icon: "monitor",
        vibeId: "casual",
        cameraId: "medium",
        modelId: "none",
        prompt:
          "Phone case on a simple desk with everyday items, relaxed lighting.",
      },
      {
        title: "Soft Studio",
        subtitle: "Clean and natural",
        icon: "square",
        vibeId: "professional",
        cameraId: "medium",
        modelId: "none",
        prompt:
          "Soft studio setup with gentle shadows and a neutral backdrop.",
      },
      {
        title: "Bag Pocket",
        subtitle: "Casual lifestyle",
        icon: "briefcase",
        vibeId: "casual",
        cameraId: "medium",
        modelId: "none",
        prompt:
          "Phone case peeking from a bag or pocket, relaxed lifestyle context.",
      },
      {
        title: "Nightstand",
        subtitle: "Warm evening mood",
        icon: "moon",
        vibeId: "casual",
        cameraId: "medium",
        modelId: "none",
        prompt:
          "Phone case on a nightstand with warm lamp light and cozy styling.",
      },
      {
        title: "In Use",
        subtitle: "Candid moment",
        icon: "activity",
        vibeId: "casual",
        cameraId: "medium",
        modelId: "hands",
        prompt:
          "Phone in use in a candid real-life moment, shallow depth of field.",
      },
      {
        title: "Texture Detail",
        subtitle: "Material finish",
        icon: "zoom-in",
        vibeId: "premium",
        cameraId: "closeup",
        modelId: "none",
        prompt:
          "Close-up of the case texture and edges with soft directional light.",
      },
      {
        title: "Packaging",
        subtitle: "Simple retail look",
        icon: "package",
        vibeId: "professional",
        cameraId: "medium",
        modelId: "none",
        prompt:
          "Phone case with packaging on a clean tabletop, tidy and minimal.",
      },
    ],
    listing: [
      {
        title: "Handheld On-Phone",
        subtitle: "Clear case view",
        icon: "smartphone",
        vibeId: "casual",
        cameraId: "handheld",
        modelId: "hands",
        prompt:
          "Hand holding the phone to show the case clearly, clean background, soft light.",
      },
      {
        title: "Desk + Laptop",
        subtitle: "Modern workspace",
        icon: "monitor",
        vibeId: "professional",
        cameraId: "medium",
        modelId: "none",
        prompt:
          "Phone case beside a laptop and desk accessories, modern workspace, tidy layout.",
      },
      {
        title: "Minimal Studio",
        subtitle: "Front view, clean",
        icon: "square",
        vibeId: "professional",
        cameraId: "medium",
        modelId: "none",
        prompt:
          "Minimal studio front view of the case on a clean backdrop, even lighting.",
      },
      {
        title: "Pocket Peek",
        subtitle: "Lifestyle context",
        icon: "briefcase",
        vibeId: "casual",
        cameraId: "medium",
        modelId: "none",
        prompt:
          "Phone case peeking from a pocket or bag, lifestyle context, soft light.",
      },
      {
        title: "Nightstand",
        subtitle: "Warm evening mood",
        icon: "moon",
        vibeId: "casual",
        cameraId: "medium",
        modelId: "none",
        prompt:
          "Phone case on a nightstand with warm lamp light, calm evening mood.",
      },
      {
        title: "In Use",
        subtitle: "Candid lifestyle",
        icon: "activity",
        vibeId: "casual",
        cameraId: "medium",
        modelId: "hands",
        prompt:
          "Phone in use in a real-life setting, candid moment with shallow depth of field.",
      },
      {
        title: "Texture Close-up",
        subtitle: "Edges and finish",
        icon: "zoom-in",
        vibeId: "premium",
        cameraId: "closeup",
        modelId: "none",
        prompt:
          "Close-up texture shot showing edges and material finish, crisp detail.",
      },
      {
        title: "Packaging",
        subtitle: "Retail-ready shot",
        icon: "package",
        vibeId: "professional",
        cameraId: "medium",
        modelId: "none",
        prompt:
          "Phone case with packaging box on a clean tabletop, tidy product shot.",
      },
    ],
    ad: AD_STYLE_TEMPLATES,
  },
  posters_prints: {
    balanced: [
      {
        title: "Cozy Living Room",
        subtitle: "Natural home scene",
        icon: "home",
        vibeId: "casual",
        cameraId: "wide",
        modelId: "none",
        prompt:
          "Framed print on a cozy living room wall, natural daylight and relaxed styling.",
      },
      {
        title: "Shelf Styling",
        subtitle: "Simple decor",
        icon: "layers",
        vibeId: "casual",
        cameraId: "medium",
        modelId: "none",
        prompt:
          "Print resting on a shelf with a few everyday objects, soft ambient light.",
      },
      {
        title: "Leaning Print",
        subtitle: "Casual floor setup",
        icon: "image",
        vibeId: "casual",
        cameraId: "wide",
        modelId: "none",
        prompt:
          "Print leaning against a wall on the floor, relaxed styling, natural light.",
      },
      {
        title: "Gallery Wall",
        subtitle: "Homey arrangement",
        icon: "grid",
        vibeId: "casual",
        cameraId: "wide",
        modelId: "none",
        prompt:
          "Gallery wall scene with the print integrated naturally among other frames.",
      },
      {
        title: "Home Office",
        subtitle: "Warm work nook",
        icon: "briefcase",
        vibeId: "casual",
        cameraId: "wide",
        modelId: "none",
        prompt:
          "Print above a simple desk setup in a warm, lived-in home office.",
      },
      {
        title: "Bedroom Calm",
        subtitle: "Soft evening light",
        icon: "moon",
        vibeId: "casual",
        cameraId: "wide",
        modelId: "none",
        prompt:
          "Print above a bed in a calm bedroom, soft ambient light.",
      },
      {
        title: "Paper Detail",
        subtitle: "Soft texture close-up",
        icon: "zoom-in",
        vibeId: "premium",
        cameraId: "closeup",
        modelId: "none",
        prompt:
          "Close-up of paper or canvas texture with soft, natural lighting.",
      },
      {
        title: "Studio Clean",
        subtitle: "Neutral backdrop",
        icon: "square",
        vibeId: "professional",
        cameraId: "medium",
        modelId: "none",
        prompt:
          "Minimal studio presentation with a neutral backdrop and gentle shadows.",
      },
    ],
    listing: [
      {
        title: "Living Room Wall",
        subtitle: "Styled home scene",
        icon: "home",
        vibeId: "casual",
        cameraId: "wide",
        modelId: "none",
        prompt:
          "Framed print on a living room wall with styled decor, natural daylight.",
      },
      {
        title: "Shelf Frame",
        subtitle: "Minimal shelf styling",
        icon: "layers",
        vibeId: "casual",
        cameraId: "medium",
        modelId: "none",
        prompt:
          "Frame resting on a shelf with minimal objects, soft light and clean lines.",
      },
      {
        title: "Leaning Floor",
        subtitle: "Large print scale",
        icon: "image",
        vibeId: "professional",
        cameraId: "wide",
        modelId: "none",
        prompt:
          "Large print leaning against a wall on the floor, minimal props, balanced composition.",
      },
      {
        title: "Gallery Wall",
        subtitle: "Multi-frame display",
        icon: "grid",
        vibeId: "casual",
        cameraId: "wide",
        modelId: "none",
        prompt:
          "Gallery wall scene with multiple frames, the chosen print as the focal point.",
      },
      {
        title: "Office Wall",
        subtitle: "Desk and print",
        icon: "briefcase",
        vibeId: "professional",
        cameraId: "wide",
        modelId: "none",
        prompt:
          "Print above a desk setup in a clean office scene, neat styling.",
      },
      {
        title: "Bedroom Wall",
        subtitle: "Cozy ambient light",
        icon: "moon",
        vibeId: "casual",
        cameraId: "wide",
        modelId: "none",
        prompt:
          "Print above a bed in a cozy bedroom, warm ambient lighting.",
      },
      {
        title: "Texture Detail",
        subtitle: "Paper close-up",
        icon: "zoom-in",
        vibeId: "premium",
        cameraId: "closeup",
        modelId: "none",
        prompt:
          "Close-up of paper or canvas texture with crisp detail.",
      },
      {
        title: "Minimal Studio",
        subtitle: "Clean backdrop",
        icon: "square",
        vibeId: "professional",
        cameraId: "medium",
        modelId: "none",
        prompt:
          "Minimal studio presentation of the print against a seamless backdrop.",
      },
    ],
    ad: AD_STYLE_TEMPLATES,
  },
  stickers_labels: {
    balanced: [
      {
        title: "Applied Surface",
        subtitle: "Everyday context",
        icon: "tag",
        vibeId: "casual",
        cameraId: "medium",
        modelId: "none",
        prompt:
          "Sticker applied to a realistic surface with natural light and relaxed styling.",
      },
      {
        title: "Sticker Sheet",
        subtitle: "Casual top-down",
        icon: "grid",
        vibeId: "casual",
        cameraId: "flatlay",
        modelId: "none",
        prompt:
          "Sticker sheet flatlay with soft daylight and gentle shadows.",
      },
      {
        title: "Tech Laptop",
        subtitle: "Desk lifestyle",
        icon: "monitor",
        vibeId: "casual",
        cameraId: "medium",
        modelId: "none",
        prompt:
          "Sticker on a laptop in a casual desk scene with natural light.",
      },
      {
        title: "Mailer Moment",
        subtitle: "Simple packaging",
        icon: "package",
        vibeId: "casual",
        cameraId: "medium",
        modelId: "none",
        prompt:
          "Sticker on a mailer or box with relaxed tabletop styling.",
      },
      {
        title: "Notebook",
        subtitle: "Everyday stationery",
        icon: "book",
        vibeId: "casual",
        cameraId: "medium",
        modelId: "none",
        prompt:
          "Sticker on a notebook with simple stationery props and soft light.",
      },
      {
        title: "Edge Detail",
        subtitle: "Soft close-up",
        icon: "zoom-in",
        vibeId: "premium",
        cameraId: "closeup",
        modelId: "none",
        prompt:
          "Close-up of sticker edge and print detail with gentle lighting.",
      },
      {
        title: "Outdoor Bottle",
        subtitle: "Natural daylight",
        icon: "sun",
        vibeId: "casual",
        cameraId: "medium",
        modelId: "none",
        prompt:
          "Sticker on a bottle outdoors with natural daylight and casual props.",
      },
      {
        title: "Retail Shelf",
        subtitle: "Everyday store look",
        icon: "shopping-bag",
        vibeId: "casual",
        cameraId: "medium",
        modelId: "none",
        prompt:
          "Retail shelf scene with labeled products, natural and unforced styling.",
      },
    ],
    listing: [
      {
        title: "Applied on Bottle",
        subtitle: "Clean adhesion view",
        icon: "tag",
        vibeId: "professional",
        cameraId: "medium",
        modelId: "none",
        prompt:
          "Sticker applied to a bottle or jar, clean background, realistic adhesion.",
      },
      {
        title: "Sheet View",
        subtitle: "Top-down layout",
        icon: "grid",
        vibeId: "professional",
        cameraId: "flatlay",
        modelId: "none",
        prompt:
          "Sticker sheet flatlay, top-down view with tidy spacing.",
      },
      {
        title: "Laptop Use",
        subtitle: "Modern tech context",
        icon: "monitor",
        vibeId: "casual",
        cameraId: "medium",
        modelId: "none",
        prompt:
          "Sticker on a laptop or tech device, desk context, modern feel.",
      },
      {
        title: "Packaging Mailer",
        subtitle: "Shipping-ready",
        icon: "package",
        vibeId: "professional",
        cameraId: "medium",
        modelId: "none",
        prompt:
          "Sticker on a shipping mailer or box, clean tabletop, retail-ready.",
      },
      {
        title: "Notebook",
        subtitle: "Stationery scene",
        icon: "book",
        vibeId: "casual",
        cameraId: "medium",
        modelId: "none",
        prompt:
          "Sticker on a notebook or planner with stationery props, soft light.",
      },
      {
        title: "Close-up Detail",
        subtitle: "Edge clarity",
        icon: "zoom-in",
        vibeId: "premium",
        cameraId: "closeup",
        modelId: "none",
        prompt:
          "Close-up studio shot of the sticker edge and print detail, crisp focus.",
      },
      {
        title: "Outdoor Bottle",
        subtitle: "Natural light",
        icon: "sun",
        vibeId: "casual",
        cameraId: "medium",
        modelId: "none",
        prompt:
          "Sticker on a water bottle outdoors, natural light, lifestyle vibe.",
      },
      {
        title: "Retail Shelf",
        subtitle: "Store-ready display",
        icon: "shopping-bag",
        vibeId: "professional",
        cameraId: "medium",
        modelId: "none",
        prompt:
          "Retail shelf scene with labeled products, tidy and organized.",
      },
    ],
    ad: AD_STYLE_TEMPLATES,
  },
  tote_bags: {
    balanced: [
      {
        title: "Casual Carry",
        subtitle: "Relaxed lifestyle",
        icon: "user",
        vibeId: "casual",
        cameraId: "medium",
        modelId: "female",
        prompt:
          "Model carrying the tote in a relaxed everyday setting with natural light.",
      },
      {
        title: "Hanging Hook",
        subtitle: "Simple home scene",
        icon: "anchor",
        vibeId: "casual",
        cameraId: "medium",
        modelId: "none",
        prompt:
          "Tote hanging on a hook in a casual interior with soft light.",
      },
      {
        title: "Flatlay Contents",
        subtitle: "Casual top-down",
        icon: "grid",
        vibeId: "casual",
        cameraId: "flatlay",
        modelId: "none",
        prompt:
          "Flatlay of the tote with a few everyday items, soft daylight.",
      },
      {
        title: "Outdoor Walk",
        subtitle: "Easy motion",
        icon: "sun",
        vibeId: "casual",
        cameraId: "medium",
        modelId: "female",
        prompt:
          "Outdoor walking scene with the tote, natural light and relaxed styling.",
      },
      {
        title: "Canvas Detail",
        subtitle: "Soft texture focus",
        icon: "zoom-in",
        vibeId: "premium",
        cameraId: "closeup",
        modelId: "none",
        prompt:
          "Close-up of the tote fabric and print with soft, natural lighting.",
      },
      {
        title: "Market Scene",
        subtitle: "Everyday errands",
        icon: "shopping-cart",
        vibeId: "casual",
        cameraId: "medium",
        modelId: "female",
        prompt:
          "Market or grocery context with the tote, warm daylight and casual props.",
      },
      {
        title: "Folded Tote",
        subtitle: "Relaxed tabletop",
        icon: "layers",
        vibeId: "casual",
        cameraId: "medium",
        modelId: "none",
        prompt:
          "Folded tote on a tabletop with gentle folds and natural light.",
      },
      {
        title: "Chair Drape",
        subtitle: "Cozy interior",
        icon: "home",
        vibeId: "casual",
        cameraId: "medium",
        modelId: "none",
        prompt:
          "Tote draped over a chair in a cozy interior, soft ambient lighting.",
      },
    ],
    listing: [
      {
        title: "On-Shoulder",
        subtitle: "Lifestyle carry",
        icon: "user",
        vibeId: "casual",
        cameraId: "medium",
        modelId: "female",
        prompt:
          "Model carrying the tote on shoulder in a lifestyle setting, natural light.",
      },
      {
        title: "Hanging Hook",
        subtitle: "Clean wall scene",
        icon: "anchor",
        vibeId: "professional",
        cameraId: "medium",
        modelId: "none",
        prompt:
          "Tote hanging on a wall hook, neutral background, soft side light.",
      },
      {
        title: "Flatlay Contents",
        subtitle: "Top-down layout",
        icon: "grid",
        vibeId: "casual",
        cameraId: "flatlay",
        modelId: "none",
        prompt:
          "Flatlay of the tote with a few contents partially visible, clean surface.",
      },
      {
        title: "Outdoor Walk",
        subtitle: "Casual motion",
        icon: "sun",
        vibeId: "casual",
        cameraId: "medium",
        modelId: "female",
        prompt:
          "Outdoor walk scene with the tote in motion, casual lifestyle energy.",
      },
      {
        title: "Close-up Texture",
        subtitle: "Canvas detail",
        icon: "zoom-in",
        vibeId: "premium",
        cameraId: "closeup",
        modelId: "none",
        prompt:
          "Studio close-up of the print area and canvas texture, crisp detail.",
      },
      {
        title: "Market Scene",
        subtitle: "Grocery lifestyle",
        icon: "shopping-cart",
        vibeId: "casual",
        cameraId: "medium",
        modelId: "female",
        prompt:
          "Market or grocery scene with the tote and fresh items, warm light.",
      },
      {
        title: "Folded Tote",
        subtitle: "Tidy tabletop",
        icon: "layers",
        vibeId: "professional",
        cameraId: "medium",
        modelId: "none",
        prompt:
          "Folded tote on a tidy tabletop with the design centered, even lighting.",
      },
      {
        title: "Chair Drape",
        subtitle: "Cozy interior",
        icon: "home",
        vibeId: "casual",
        cameraId: "medium",
        modelId: "none",
        prompt:
          "Tote draped over a chair in a cozy interior, soft ambient light.",
      },
    ],
    ad: AD_STYLE_TEMPLATES,
  },
  hats: {
    balanced: [
      {
        title: "Casual Headshot",
        subtitle: "Relaxed studio feel",
        icon: "user",
        vibeId: "casual",
        cameraId: "medium",
        modelId: "female",
        prompt:
          "Model wearing the hat with a relaxed expression, soft light, minimal background.",
      },
      {
        title: "Flatlay Table",
        subtitle: "Natural props",
        icon: "grid",
        vibeId: "casual",
        cameraId: "flatlay",
        modelId: "none",
        prompt:
          "Hat flatlay with a few everyday props, soft daylight and gentle shadows.",
      },
      {
        title: "Hanging Hook",
        subtitle: "Simple wall scene",
        icon: "anchor",
        vibeId: "casual",
        cameraId: "medium",
        modelId: "none",
        prompt:
          "Hat hanging on a hook in a casual interior with soft light.",
      },
      {
        title: "Street Walk",
        subtitle: "Everyday outdoor",
        icon: "sun",
        vibeId: "casual",
        cameraId: "medium",
        modelId: "female",
        prompt:
          "Outdoor street moment with the hat, natural light and relaxed styling.",
      },
      {
        title: "Stitch Detail",
        subtitle: "Soft texture focus",
        icon: "zoom-in",
        vibeId: "premium",
        cameraId: "closeup",
        modelId: "none",
        prompt:
          "Close-up of stitching and fabric texture with soft, natural lighting.",
      },
      {
        title: "Shelf Styling",
        subtitle: "Casual decor",
        icon: "home",
        vibeId: "casual",
        cameraId: "medium",
        modelId: "none",
        prompt:
          "Hat styled on a shelf with minimal decor and gentle ambient light.",
      },
      {
        title: "Outdoor Sport",
        subtitle: "Active vibe",
        icon: "activity",
        vibeId: "dynamic",
        cameraId: "medium",
        modelId: "female",
        prompt:
          "Outdoor sporty moment with the hat in use, dynamic natural light.",
      },
      {
        title: "Packaging",
        subtitle: "Simple wrap",
        icon: "package",
        vibeId: "casual",
        cameraId: "medium",
        modelId: "none",
        prompt:
          "Hat with simple packaging on a tabletop, natural light and tidy layout.",
      },
    ],
    listing: [
      {
        title: "On-Model Headshot",
        subtitle: "Clean studio look",
        icon: "user",
        vibeId: "professional",
        cameraId: "medium",
        modelId: "female",
        prompt:
          "Model wearing the hat in a neutral studio, clean background, even light.",
      },
      {
        title: "Flatlay Table",
        subtitle: "Minimal props",
        icon: "grid",
        vibeId: "professional",
        cameraId: "flatlay",
        modelId: "none",
        prompt:
          "Hat flatlay on a table with minimal props, top-down or slight angle.",
      },
      {
        title: "Hanging Hook",
        subtitle: "Simple wall scene",
        icon: "anchor",
        vibeId: "professional",
        cameraId: "medium",
        modelId: "none",
        prompt:
          "Hat hanging on a hook against a neutral wall, soft light.",
      },
      {
        title: "Street Candid",
        subtitle: "Natural daylight",
        icon: "sun",
        vibeId: "casual",
        cameraId: "medium",
        modelId: "female",
        prompt:
          "Street candid with the model wearing the hat, natural daylight.",
      },
      {
        title: "Studio Close-up",
        subtitle: "Stitching detail",
        icon: "zoom-in",
        vibeId: "premium",
        cameraId: "closeup",
        modelId: "none",
        prompt:
          "Studio close-up of the front panel and stitching detail, crisp focus.",
      },
      {
        title: "Shelf Styling",
        subtitle: "Minimal decor",
        icon: "home",
        vibeId: "casual",
        cameraId: "medium",
        modelId: "none",
        prompt:
          "Hat styled on a shelf with minimal decor, soft ambient lighting.",
      },
      {
        title: "Outdoor Sport",
        subtitle: "Active vibe",
        icon: "activity",
        vibeId: "dynamic",
        cameraId: "medium",
        modelId: "female",
        prompt:
          "Outdoor sporty scene with the hat in use, dynamic daylight.",
      },
      {
        title: "Packaging",
        subtitle: "Retail-ready",
        icon: "package",
        vibeId: "professional",
        cameraId: "medium",
        modelId: "none",
        prompt:
          "Hat with packaging or tissue paper on a clean tabletop, tidy layout.",
      },
    ],
    ad: AD_STYLE_TEMPLATES,
  },
  tech_accessories: {
    balanced: [
      {
        title: "Desk Setup",
        subtitle: "Casual workspace",
        icon: "monitor",
        vibeId: "casual",
        cameraId: "medium",
        modelId: "none",
        prompt:
          "Accessory in a casual desk setup with natural light and minimal clutter.",
      },
      {
        title: "Handheld Use",
        subtitle: "Everyday in-hand",
        icon: "hand",
        vibeId: "casual",
        cameraId: "handheld",
        modelId: "hands",
        prompt:
          "Handheld view of the accessory being used naturally, soft background blur.",
      },
      {
        title: "Soft Studio",
        subtitle: "Natural shadows",
        icon: "square",
        vibeId: "professional",
        cameraId: "medium",
        modelId: "none",
        prompt:
          "Soft studio setup with gentle shadows and neutral backdrop.",
      },
      {
        title: "In-Use Lifestyle",
        subtitle: "Casual context",
        icon: "activity",
        vibeId: "casual",
        cameraId: "medium",
        modelId: "hands",
        prompt:
          "Lifestyle moment with the accessory in use, relaxed and natural.",
      },
      {
        title: "Packaging",
        subtitle: "Simple retail look",
        icon: "package",
        vibeId: "casual",
        cameraId: "medium",
        modelId: "none",
        prompt:
          "Accessory with packaging on a tabletop, soft daylight and tidy styling.",
      },
      {
        title: "Travel Bag",
        subtitle: "On-the-go feel",
        icon: "briefcase",
        vibeId: "casual",
        cameraId: "medium",
        modelId: "none",
        prompt:
          "Accessory in a travel bag scene, natural light and relaxed composition.",
      },
      {
        title: "Shelf Styling",
        subtitle: "Everyday decor",
        icon: "home",
        vibeId: "casual",
        cameraId: "medium",
        modelId: "none",
        prompt:
          "Accessory styled on a shelf with simple decor and soft ambient light.",
      },
      {
        title: "Macro Detail",
        subtitle: "Material focus",
        icon: "zoom-in",
        vibeId: "premium",
        cameraId: "closeup",
        modelId: "none",
        prompt:
          "Macro detail shot emphasizing material and edges with soft light.",
      },
    ],
    listing: [
      {
        title: "Desk Setup",
        subtitle: "Modern workspace",
        icon: "monitor",
        vibeId: "professional",
        cameraId: "medium",
        modelId: "none",
        prompt:
          "Accessory in a modern desk setup beside keyboard or laptop, clean lighting.",
      },
      {
        title: "Handheld Close-up",
        subtitle: "In-hand detail",
        icon: "hand",
        vibeId: "casual",
        cameraId: "handheld",
        modelId: "hands",
        prompt:
          "Handheld close-up showing the accessory in use, shallow depth of field.",
      },
      {
        title: "Minimal Studio",
        subtitle: "Clean backdrop",
        icon: "square",
        vibeId: "professional",
        cameraId: "medium",
        modelId: "none",
        prompt:
          "Minimal studio shot on a seamless backdrop, clear product focus.",
      },
      {
        title: "In-Use Lifestyle",
        subtitle: "Real-world context",
        icon: "activity",
        vibeId: "casual",
        cameraId: "medium",
        modelId: "hands",
        prompt:
          "Lifestyle in-use scene with the accessory being used naturally.",
      },
      {
        title: "Packaging",
        subtitle: "Retail-ready",
        icon: "package",
        vibeId: "professional",
        cameraId: "medium",
        modelId: "none",
        prompt:
          "Accessory with its packaging box on a clean tabletop, retail-ready.",
      },
      {
        title: "Travel Bag",
        subtitle: "On-the-go setup",
        icon: "briefcase",
        vibeId: "casual",
        cameraId: "medium",
        modelId: "none",
        prompt:
          "Accessory in a travel bag or on a suitcase, lifestyle context.",
      },
      {
        title: "Shelf Styling",
        subtitle: "Minimal decor",
        icon: "home",
        vibeId: "casual",
        cameraId: "medium",
        modelId: "none",
        prompt:
          "Accessory styled on a shelf with minimal decor, soft light.",
      },
      {
        title: "Macro Detail",
        subtitle: "Material focus",
        icon: "zoom-in",
        vibeId: "premium",
        cameraId: "closeup",
        modelId: "none",
        prompt:
          "Macro detail shot emphasizing material and ports, crisp focus.",
      },
    ],
    ad: AD_STYLE_TEMPLATES,
  },
  beauty_skincare: {
    balanced: [
      {
        title: "Bathroom Counter",
        subtitle: "Soft daily routine",
        icon: "droplet",
        vibeId: "casual",
        cameraId: "medium",
        modelId: "none",
        prompt:
          "Skincare product on a bathroom counter with soft daylight and a relaxed routine feel.",
      },
      {
        title: "Spa Flatlay",
        subtitle: "Calm, minimal props",
        icon: "grid",
        vibeId: "casual",
        cameraId: "flatlay",
        modelId: "none",
        prompt:
          "Spa flatlay with towel and simple props, soft natural lighting.",
      },
      {
        title: "Handheld Use",
        subtitle: "Hands in frame",
        icon: "hand",
        vibeId: "casual",
        cameraId: "handheld",
        modelId: "hands",
        prompt:
          "Hands holding or applying the product in a natural moment, soft light.",
      },
      {
        title: "Window Light",
        subtitle: "Gentle glow",
        icon: "sun",
        vibeId: "premium",
        cameraId: "medium",
        modelId: "none",
        prompt:
          "Product near a window with gentle natural light and soft shadows.",
      },
      {
        title: "Studio Macro",
        subtitle: "Soft label detail",
        icon: "zoom-in",
        vibeId: "premium",
        cameraId: "closeup",
        modelId: "none",
        prompt:
          "Macro detail of the label and texture with soft, premium lighting.",
      },
      {
        title: "Vanity Setup",
        subtitle: "Everyday routine",
        icon: "layout",
        vibeId: "casual",
        cameraId: "medium",
        modelId: "none",
        prompt:
          "Vanity setup with a few everyday items, relaxed composition.",
      },
      {
        title: "Fresh Props",
        subtitle: "Towel + water",
        icon: "droplet",
        vibeId: "casual",
        cameraId: "medium",
        modelId: "none",
        prompt:
          "Fresh scene with water droplets and towel props, bright and clean.",
      },
      {
        title: "Minimal Studio",
        subtitle: "Soft finish",
        icon: "square",
        vibeId: "professional",
        cameraId: "medium",
        modelId: "none",
        prompt:
          "Minimal studio shot with soft shadows and a premium, natural finish.",
      },
    ],
    listing: [
      {
        title: "Bathroom Counter",
        subtitle: "Clean tile backdrop",
        icon: "droplet",
        vibeId: "casual",
        cameraId: "medium",
        modelId: "none",
        prompt:
          "Product hero on a bathroom counter with clean tiles, soft daylight.",
      },
      {
        title: "Spa Flatlay",
        subtitle: "Calm, minimal props",
        icon: "grid",
        vibeId: "casual",
        cameraId: "flatlay",
        modelId: "none",
        prompt:
          "Spa flatlay with towel and simple props, calm lighting.",
      },
      {
        title: "Handheld Application",
        subtitle: "Hands in frame",
        icon: "hand",
        vibeId: "casual",
        cameraId: "handheld",
        modelId: "hands",
        prompt:
          "Hands applying or holding the product, clean background, soft light.",
      },
      {
        title: "Window Light Shelf",
        subtitle: "Soft natural light",
        icon: "sun",
        vibeId: "premium",
        cameraId: "medium",
        modelId: "none",
        prompt:
          "Product on a shelf near a window with soft natural light.",
      },
      {
        title: "Studio Macro",
        subtitle: "Label detail",
        icon: "zoom-in",
        vibeId: "premium",
        cameraId: "closeup",
        modelId: "none",
        prompt:
          "Studio macro shot highlighting label and texture, premium lighting.",
      },
      {
        title: "Vanity Setup",
        subtitle: "Makeup accents",
        icon: "layout",
        vibeId: "casual",
        cameraId: "medium",
        modelId: "none",
        prompt:
          "Vanity setup with a few makeup items, tidy composition.",
      },
      {
        title: "Fresh Props",
        subtitle: "Towel + water",
        icon: "droplet",
        vibeId: "casual",
        cameraId: "medium",
        modelId: "none",
        prompt:
          "Fresh scene with water droplets and towel props, clean and bright.",
      },
      {
        title: "Minimal Studio",
        subtitle: "Premium finish",
        icon: "square",
        vibeId: "professional",
        cameraId: "medium",
        modelId: "none",
        prompt:
          "Minimal studio shot on a seamless backdrop, premium finish.",
      },
    ],
    ad: AD_STYLE_TEMPLATES,
  },
  home_goods: {
    balanced: [
      {
        title: "Living Room",
        subtitle: "Relaxed home scene",
        icon: "home",
        vibeId: "casual",
        cameraId: "wide",
        modelId: "none",
        prompt:
          "Home goods item in a relaxed living room, natural daylight and soft decor.",
      },
      {
        title: "Dining Table",
        subtitle: "Everyday setup",
        icon: "coffee",
        vibeId: "casual",
        cameraId: "medium",
        modelId: "none",
        prompt:
          "Product on a dining table with everyday tableware, gentle lighting.",
      },
      {
        title: "Shelf Styling",
        subtitle: "Soft ambient light",
        icon: "layers",
        vibeId: "casual",
        cameraId: "medium",
        modelId: "none",
        prompt:
          "Product on a styled shelf with relaxed decor and soft ambient light.",
      },
      {
        title: "Flatlay Props",
        subtitle: "Natural top-down",
        icon: "grid",
        vibeId: "casual",
        cameraId: "flatlay",
        modelId: "none",
        prompt:
          "Top-down flatlay with subtle props and natural lighting.",
      },
      {
        title: "Minimal Studio",
        subtitle: "Soft studio finish",
        icon: "square",
        vibeId: "professional",
        cameraId: "medium",
        modelId: "none",
        prompt:
          "Minimal studio presentation with soft shadows and clean backdrop.",
      },
      {
        title: "Material Detail",
        subtitle: "Soft texture focus",
        icon: "zoom-in",
        vibeId: "premium",
        cameraId: "closeup",
        modelId: "none",
        prompt:
          "Close-up of material or texture detail with soft lighting.",
      },
      {
        title: "Cozy Lifestyle",
        subtitle: "Warm lighting",
        icon: "sun",
        vibeId: "casual",
        cameraId: "medium",
        modelId: "none",
        prompt:
          "Cozy lifestyle scene with warm lighting and inviting props.",
      },
      {
        title: "Gift Packaging",
        subtitle: "Simple wrap",
        icon: "package",
        vibeId: "casual",
        cameraId: "medium",
        modelId: "none",
        prompt:
          "Gift packaging moment with tissue paper and a relaxed tabletop feel.",
      },
    ],
    listing: [
      {
        title: "Living Room",
        subtitle: "Cozy home context",
        icon: "home",
        vibeId: "casual",
        cameraId: "wide",
        modelId: "none",
        prompt:
          "Product styled in a living room context, natural daylight, cozy decor.",
      },
      {
        title: "Dining Table",
        subtitle: "Clean table scene",
        icon: "coffee",
        vibeId: "casual",
        cameraId: "medium",
        modelId: "none",
        prompt:
          "Product on a dining table with simple tableware, clean styling.",
      },
      {
        title: "Shelf Styling",
        subtitle: "Minimal decor",
        icon: "layers",
        vibeId: "casual",
        cameraId: "medium",
        modelId: "none",
        prompt:
          "Product on a styled shelf with minimal decor, soft ambient light.",
      },
      {
        title: "Flatlay Props",
        subtitle: "Top-down layout",
        icon: "grid",
        vibeId: "casual",
        cameraId: "flatlay",
        modelId: "none",
        prompt:
          "Flatlay with complementary props on a clean surface, top-down view.",
      },
      {
        title: "Minimal Studio",
        subtitle: "Clean backdrop",
        icon: "square",
        vibeId: "professional",
        cameraId: "medium",
        modelId: "none",
        prompt:
          "Minimal studio presentation on a seamless backdrop, clear product focus.",
      },
      {
        title: "Material Detail",
        subtitle: "Texture close-up",
        icon: "zoom-in",
        vibeId: "premium",
        cameraId: "closeup",
        modelId: "none",
        prompt:
          "Close-up of material or texture detail with soft light and crisp focus.",
      },
      {
        title: "Cozy Lifestyle",
        subtitle: "Warm lighting",
        icon: "sun",
        vibeId: "casual",
        cameraId: "medium",
        modelId: "none",
        prompt:
          "Cozy lifestyle scene with warm lighting and inviting props.",
      },
      {
        title: "Gift Packaging",
        subtitle: "Ribbon and tissue",
        icon: "package",
        vibeId: "professional",
        cameraId: "medium",
        modelId: "none",
        prompt:
          "Gift-ready packaging scene with tissue paper and ribbon, clean tabletop.",
      },
    ],
    ad: AD_STYLE_TEMPLATES,
  },
};

export const MOCKUP_TEMPLATES: MockupTemplate[] = MOCKUP_CATEGORIES.flatMap(
  (category) => {
    const baseProductId = category.items[0]?.id;
    const templates = CURATED_TEMPLATES[category.id];
    if (!templates) return [];

    const listingTemplates = templates.listing.map((template, index) => ({
      ...template,
      id: `${category.id}_listing_${index}`,
      useCase: "listing" as const,
      productCategoryId: category.id,
      productId: baseProductId,
    }));

    const balancedTemplates = templates.balanced.map((template, index) => ({
      ...template,
      id: `${category.id}_balanced_${index}`,
      useCase: "neutral" as const,
      productCategoryId: category.id,
      productId: baseProductId,
    }));

    const adTemplates = (["simple", "exaggerated", "trending"] as const).flatMap(
      (style) =>
        getAdTemplatesForStyle(templates, style).map((template, index) => ({
          ...template,
          id: `${category.id}_ad_${style}_${index}`,
          useCase: "ad" as const,
          adStyle: style,
          productCategoryId: category.id,
          productId: baseProductId,
          prompt: `${template.prompt} ${AD_CATEGORY_CONTEXT[category.id] || ""} ${AD_STYLE_PROMPTS[style]}`,
        })),
    );

    return [...balancedTemplates, ...listingTemplates, ...adTemplates];
  },
);

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
