import { Feather } from "@expo/vector-icons";

export interface Scene {
  id: string;
  label: string;
  icon: keyof typeof Feather.glyphMap;
  description: string;
}

// Expanded list of scenes
export const SCENES: Scene[] = [
  // Indoor scenes
  {
    id: "kitchen",
    label: "Kitchen Counter",
    icon: "coffee",
    description: "A product photo in a modern, minimalist kitchen with natural light, focusing on clean lines and functional design.",
  },
  {
    id: "living",
    label: "Living Room",
    icon: "home",
    description: "A product photo in a cozy, Scandinavian-style living room, featuring warm textiles, natural wood, and soft, inviting lighting.",
  },
  {
    id: "office",
    label: "Office Desk",
    icon: "briefcase",
    description: "A product photo on a sleek, organized office desk with a minimalist aesthetic, emphasizing productivity and contemporary design.",
  },
  {
    id: "bedroom",
    label: "Bedroom",
    icon: "moon",
    description: "A product photo in a serene, contemporary bedroom with soft lighting, luxurious bedding, and a tranquil atmosphere.",
  },
  {
    id: "bathroom",
    label: "Bathroom Vanity",
    icon: "droplet",
    description: "A product photo on a clean, spa-like bathroom vanity, highlighting elegance, modern fixtures, and a refreshing ambiance.",
  },
  {
    id: "dining",
    label: "Dining Table",
    icon: "users",
    description: "A product photo on an elegant dining table set for a special occasion, featuring refined dinnerware, subtle decorations, and warm, inviting light.",
  },
  {
    id: "cafe",
    label: "Cafe",
    icon: "coffee",
    description: "A product photo on a rustic wooden table in a bustling, sunlit cafe, capturing a relaxed, urban vibe with shallow depth of field.",
  },
  // Outdoor scenes
  {
    id: "outdoor",
    label: "Outdoor Nature",
    icon: "sun",
    description: "A product photo set in a lush, natural outdoor environment with soft, diffused sunlight, emphasizing organic textures and a peaceful mood.",
  },
  {
    id: "park",
    label: "Park Setting",
    icon: "map-pin",
    description: "A product photo in a vibrant, green park setting during golden hour, with a blurred background of trees and people enjoying leisure.",
  },
  {
    id: "trail",
    label: "Trail / Path",
    icon: "navigation",
    description: "A product photo on an adventurous hiking trail with rugged terrain and distant mountain views, conveying exploration and durability.",
  },
  {
    id: "beach",
    label: "Beach",
    icon: "umbrella",
    description: "A product photo on a pristine sandy beach at sunset, with gentle waves, a clear sky, and a tranquil, relaxing atmosphere.",
  },
  {
    id: "garden",
    label: "Garden / Patio",
    icon: "feather",
    description: "A product photo in a vibrant botanical garden or a manicured patio, showcasing blooming flowers, lush greenery, and sophisticated outdoor decor.",
  },
  {
    id: "urban",
    label: "Urban Street",
    icon: "map",
    description: "A product photo on a bustling urban street with dynamic city lights and modern architecture, capturing an energetic, contemporary feel.",
  },
  {
    id: "industrial",
    label: "Industrial Loft",
    icon: "tool", // Using tool icon as a placeholder
    description: "A product photo on a raw concrete surface in an industrial-chic loft, featuring exposed brick, metallic accents, and an edgy, modern aesthetic.",
  },
  // Professional scenes
  {
    id: "studio",
    label: "Studio Setup",
    icon: "box",
    description: "A product photo in a professional, clean studio setup with a seamless backdrop and controlled lighting, highlighting product details and pristine presentation.",
  },
  {
    id: "minimal",
    label: "Minimalist",
    icon: "square",
    description: "A product photo against a clean, simple, and uncluttered background, emphasizing the product's form, function, and minimalist appeal.",
  },
  {
    id: "lifestyle",
    label: "Lifestyle Shot",
    icon: "instagram",
    description: "A dynamic product photo integrated into an authentic, everyday lifestyle moment, capturing genuine human interaction and a relatable scenario.",
  },
  // Specialty scenes
  {
    id: "gym",
    label: "Gym / Fitness",
    icon: "activity",
    description: "A product photo in a modern gym setting with sleek equipment and energetic lighting, emphasizing health, fitness, and performance.",
  },
  {
    id: "garage",
    label: "Garage",
    icon: "tool",
    description: "A product photo in a well-organized, clean garage or workshop, highlighting utility, craftsmanship, and a practical environment.",
  },
  {
    id: "playroom",
    label: "Playroom",
    icon: "smile",
    description: "A product photo in a colorful, fun, and imaginative playroom, featuring playful elements, bright lighting, and a joyful atmosphere.",
  },
];
