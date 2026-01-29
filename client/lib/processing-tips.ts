const tipLightingImage = require("../../assets/images/ui/tip_lighting.webp");
const tipCenteringImage = require("../../assets/images/ui/tip_centering.webp");
const tipBackgroundImage = require("../../assets/images/ui/tip_background.webp");
const tipFocusImage = require("../../assets/images/ui/tip_focus.webp");

export interface ProcessingTip {
  id: string;
  title: string;
  description: string;
  image: any;
}

export const PROCESSING_TIPS: ProcessingTip[] = [
  {
    id: "lighting",
    title: "Good Lighting",
    description: "Natural light or soft studio lighting helps AI better understand your product",
    image: tipLightingImage,
  },
  {
    id: "centering",
    title: "Center Your Product",
    description: "Keep your product centered for best AI background removal results",
    image: tipCenteringImage,
  },
  {
    id: "background",
    title: "White Backgrounds",
    description: "E-commerce platforms prefer pure white backgrounds for product listings",
    image: tipBackgroundImage,
  },
  {
    id: "focus",
    title: "Sharp Focus",
    description: "A sharp, focused image helps AI accurately detect product edges",
    image: tipFocusImage,
  },
];

export function getRandomTip(): ProcessingTip {
  const randomIndex = Math.floor(Math.random() * PROCESSING_TIPS.length);
  return PROCESSING_TIPS[randomIndex];
}

export function getNextTip(currentId: string): ProcessingTip {
  const currentIndex = PROCESSING_TIPS.findIndex((tip) => tip.id === currentId);
  const nextIndex = (currentIndex + 1) % PROCESSING_TIPS.length;
  return PROCESSING_TIPS[nextIndex];
}
