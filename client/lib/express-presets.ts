import { getPlatformById } from "@/lib/platform-requirements";

export type ExpressUseCase = "neutral" | "listing" | "ad";
export type ExpressAdStyle = "simple" | "exaggerated" | "trendy";
export type ExpressModelOption = "none" | "hands" | "female" | "male";
export type ExpressTaskKind = "background" | "lifestyle" | "mockup";

export interface ExpressTask {
  id: string;
  kind: ExpressTaskKind;
  title: string;
  prompt: string;
  sceneVibe?: string;
  cameraOption?: string;
}

export interface ExpressResultItem extends ExpressTask {
  status: "pending" | "processing" | "completed" | "failed";
  resultUri: string | null;
  error?: string;
}

const GOAL_LABELS: Record<ExpressUseCase, string> = {
  neutral: "Balanced",
  listing: "Listing",
  ad: "Advertise",
};

const MODEL_LABELS: Record<ExpressModelOption, string> = {
  none: "No people",
  hands: "Only hands",
  female: "Female model",
  male: "Male model",
};

function getGoalDescription(useCase: ExpressUseCase, adStyle?: ExpressAdStyle): string {
  if (useCase === "listing") {
    return "Listing: clean, product-first, highly readable, retail-ready visuals with minimal distractions.";
  }

  if (useCase === "ad") {
    if (adStyle === "exaggerated") {
      return "Advertise (Exaggerated): bold contrast, dramatic lighting, strong visual impact, campaign-style framing.";
    }
    if (adStyle === "trendy") {
      return "Advertise (Trendy): social-ready, modern styling, punchy composition, contemporary color accents.";
    }
    return "Advertise (Simple): polished and premium marketing tone with restrained styling and elegant composition.";
  }

  return "Balanced: natural, believable, polished product photography that feels authentic and versatile.";
}

function getGoalDisplay(useCase: ExpressUseCase, adStyle?: ExpressAdStyle): string {
  if (useCase !== "ad") return GOAL_LABELS[useCase];
  const style = adStyle || "simple";
  return `Advertise (${style.charAt(0).toUpperCase()}${style.slice(1)})`;
}

function buildSharedPromptBlock(input: {
  productDescription: string;
  useCase: ExpressUseCase;
  adStyle?: ExpressAdStyle;
  platform: string;
}): string {
  const platformInfo = getPlatformById(input.platform);
  const platformName = platformInfo?.name || input.platform;
  const aspectRatio = platformInfo?.aspectRatioLabel || "platform-specific";

  return [
    `User product description: ${input.productDescription.trim()}`,
    `Output goal selected by user: ${getGoalDisplay(input.useCase, input.adStyle)}.`,
    `Goal guidance: ${getGoalDescription(input.useCase, input.adStyle)}`,
    `Target ecommerce platform: ${platformName}. Required aspect ratio: ${aspectRatio}.`,
    "Analyze the uploaded product image carefully before generation.",
    "Preserve product identity, shape, material behavior, scale, colors, and key design features.",
    "No text overlays, no watermarks, no borders, and no graphic frames.",
  ].join("\n");
}

function getLifestyleConcepts(useCase: ExpressUseCase, adStyle?: ExpressAdStyle): string[] {
  if (useCase === "listing") {
    return [
      "A clean studio surface with soft daylight, neutral environment, and clear product readability.",
      "A tidy retail shelf or tabletop context with simple props and even lighting.",
      "A catalog-ready minimal composition with truthful scale cues and restrained background depth.",
    ];
  }

  if (useCase === "ad") {
    if (adStyle === "exaggerated") {
      return [
        "A high-impact cinematic scene with dramatic side lighting and bold depth.",
        "An energetic urban-inspired lifestyle scene with directional light and dynamic angle.",
        "A campaign-style hero setup with striking contrast and premium visual drama.",
      ];
    }

    if (adStyle === "trendy") {
      return [
        "A social-first modern setup with contemporary props, clean gradients, and trendy styling.",
        "A creator-inspired desk or lifestyle corner with punchy accents and polished composition.",
        "A short-form content vibe scene with modern color blocking and shareable visual energy.",
      ];
    }

    return [
      "A premium but restrained lifestyle scene with soft natural light and elegant props.",
      "An editorial-inspired clean setup with balanced negative space and subtle mood.",
      "A polished hero composition with tasteful styling and clear product focus.",
    ];
  }

  return [
    "A natural home scene with soft daylight, realistic shadows, and clean product focus.",
    "A calm tabletop environment with subtle depth and minimal supporting props.",
    "A softly lit lifestyle corner with authentic context and balanced composition.",
  ];
}

function getMockupConcepts(useCase: ExpressUseCase, adStyle?: ExpressAdStyle): Array<{
  concept: string;
  sceneVibe: string;
  cameraOption: string;
}> {
  if (useCase === "listing") {
    return [
      {
        concept:
          "Create a listing-optimized hero mockup with centered framing and exact product readability.",
        sceneVibe: "professional",
        cameraOption: "medium",
      },
      {
        concept:
          "Create a clean close-up mockup emphasizing product texture, details, and accurate design presentation.",
        sceneVibe: "professional",
        cameraOption: "closeup",
      },
      {
        concept:
          "Create a simple grid-friendly mockup with balanced margins and unobtrusive environment context.",
        sceneVibe: "professional",
        cameraOption: "wide",
      },
    ];
  }

  if (useCase === "ad") {
    if (adStyle === "exaggerated") {
      return [
        {
          concept:
            "Create a dramatic ad hero mockup with bold lighting, striking contrast, and high-impact composition.",
          sceneVibe: "dynamic",
          cameraOption: "action",
        },
        {
          concept:
            "Create a cinematic close framing ad mockup with confident styling and premium intensity.",
          sceneVibe: "dynamic",
          cameraOption: "closeup",
        },
        {
          concept:
            "Create a dynamic campaign-style mockup with energetic angle and dramatic scene depth.",
          sceneVibe: "dynamic",
          cameraOption: "wide",
        },
      ];
    }

    if (adStyle === "trendy") {
      return [
        {
          concept:
            "Create a trendy social ad mockup with modern props and punchy color accents.",
          sceneVibe: "fun",
          cameraOption: "medium",
        },
        {
          concept:
            "Create a creator-style mockup scene with contemporary framing and scroll-stopping polish.",
          sceneVibe: "fun",
          cameraOption: "handheld",
        },
        {
          concept:
            "Create a modern lifestyle ad mockup with clean geometry and energetic composition.",
          sceneVibe: "dynamic",
          cameraOption: "wide",
        },
      ];
    }

    return [
      {
        concept:
          "Create a tasteful ad hero mockup with premium composition and restrained styling.",
        sceneVibe: "premium",
        cameraOption: "medium",
      },
      {
        concept:
          "Create an editorial-inspired mockup with clean lighting and subtle visual drama.",
        sceneVibe: "premium",
        cameraOption: "closeup",
      },
      {
        concept:
          "Create a polished lifestyle ad mockup with elegant props and believable realism.",
        sceneVibe: "premium",
        cameraOption: "wide",
      },
    ];
  }

  return [
    {
      concept:
        "Create a balanced photoreal mockup with natural lighting and believable context.",
      sceneVibe: "casual",
      cameraOption: "medium",
    },
    {
      concept:
        "Create a balanced close mockup emphasizing realistic texture and material quality.",
      sceneVibe: "casual",
      cameraOption: "closeup",
    },
    {
      concept:
        "Create a balanced wider mockup with clean environment context and strong product focus.",
      sceneVibe: "casual",
      cameraOption: "wide",
    },
  ];
}

function buildLifestylePrompt(sharedBlock: string, concept: string): string {
  return `Generate one photorealistic ecommerce lifestyle scene.

${sharedBlock}
Scene concept: ${concept}

Critical instructions:
- Product must remain the clear hero and stay fully recognizable.
- Keep shadows, reflections, and perspective physically believable.
- Match scene styling to the selected output goal exactly.
- Fill the frame edge-to-edge with no borders, bars, or blank padding.
- Output high-quality, clean, professional composition suitable for ecommerce.`;
}

function buildMockupPrompt(
  sharedBlock: string,
  concept: string,
  modelOption: ExpressModelOption,
  customModelDirection?: string,
): string {
  const modelPresetInstructions: Record<ExpressModelOption, string> = {
    none:
      "Model selection (preset): No people. Do not include faces, full bodies, hands, animals, or characters in the mockup scene.",
    hands:
      "Model selection (preset): Only hands. Show only hands naturally interacting with the product. Do not show faces or full bodies.",
    female:
      "Model selection (preset): Female model. Include one adult female model naturally using/wearing/holding the product while keeping product visibility high.",
    male:
      "Model selection (preset): Male model. Include one adult male model naturally using/wearing/holding the product while keeping product visibility high.",
  };

  const customDirection = customModelDirection?.trim();
  const customModelBlock = customDirection
    ? `Custom model direction from user (highest priority for mockup subject casting): ${customDirection}
- This custom model direction applies to all 3 mockup images in this Express bundle.
- If this conflicts with the preset model selection, prioritize this custom direction while preserving product realism and visibility.`
    : "No custom model direction provided. Follow the preset model selection exactly.";

  return `Generate one photorealistic ecommerce product mockup.

${sharedBlock}
Mockup concept: ${concept}
${modelPresetInstructions[modelOption]}
${customModelBlock}

Critical instructions:
- Keep product identity and design details exact.
- Keep materials, edges, and geometry realistic.
- Match framing and composition to the selected output goal.
- If people/subjects appear, keep them natural, believable, and secondary to product focus.
- Fill the frame edge-to-edge with no borders, bars, or blank padding.
- Output high-quality professional result suitable for ecommerce use.`;
}

export function buildExpressTasks(input: {
  productDescription: string;
  useCase: ExpressUseCase;
  adStyle?: ExpressAdStyle;
  platform: string;
  modelOption: ExpressModelOption;
  customModelDirection?: string;
}): ExpressTask[] {
  const sharedBlock = buildSharedPromptBlock(input);
  const lifestyleConcepts = getLifestyleConcepts(input.useCase, input.adStyle);
  const mockupConcepts = getMockupConcepts(input.useCase, input.adStyle);

  const backgroundTask: ExpressTask = {
    id: "background_1",
    kind: "background",
    title: "Background Removal",
    prompt: [
      sharedBlock,
      "Generate a clean isolated product cutout on solid white background for ecommerce.",
      "Preserve product position and details while removing only the background.",
    ].join("\n"),
  };

  const lifestyleTasks: ExpressTask[] = lifestyleConcepts.map((concept, index) => ({
    id: `lifestyle_${index + 1}`,
    kind: "lifestyle",
    title: `Lifestyle ${index + 1}`,
    prompt: buildLifestylePrompt(sharedBlock, concept),
  }));

  const mockupTasks: ExpressTask[] = mockupConcepts.map((concept, index) => ({
    id: `mockup_${index + 1}`,
    kind: "mockup",
    title: `Mockup ${index + 1}`,
    prompt: buildMockupPrompt(
      sharedBlock,
      concept.concept,
      input.modelOption,
      input.customModelDirection,
    ),
    sceneVibe: concept.sceneVibe,
    cameraOption: concept.cameraOption,
  }));

  return [backgroundTask, ...lifestyleTasks, ...mockupTasks];
}

export function getExpressGoalLabel(
  useCase: ExpressUseCase,
  adStyle?: ExpressAdStyle,
): string {
  return getGoalDisplay(useCase, adStyle);
}

export function getExpressModelLabel(modelOption: ExpressModelOption): string {
  return MODEL_LABELS[modelOption];
}
