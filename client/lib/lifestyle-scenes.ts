export interface Scene {
  id: string;
  label: string;
  description: string;
  image: any;
}

const SCENE_IMAGES: Record<string, any> = {
  kitchen: require("../../attached_assets/generated_images/modern_kitchen_countertop_scene.png"),
  living: require("../../attached_assets/generated_images/cozy_scandinavian_living_room.png"),
  office: require("../../attached_assets/generated_images/modern_office_desk_setup.png"),
  bedroom: require("../../attached_assets/generated_images/serene_modern_bedroom_scene.png"),
  bathroom: require("../../attached_assets/generated_images/spa-like_bathroom_vanity.png"),
  dining: require("../../attached_assets/generated_images/elegant_dining_table_setting.png"),
  cafe: require("../../attached_assets/generated_images/cozy_rustic_cafe_interior.png"),
  outdoor: require("../../attached_assets/generated_images/lush_outdoor_nature_scene.png"),
  park: require("../../attached_assets/generated_images/golden_hour_park_setting.png"),
  trail: require("../../attached_assets/generated_images/adventure_hiking_trail_path.png"),
  beach: require("../../attached_assets/generated_images/sunset_beach_tropical_scene.png"),
  garden: require("../../attached_assets/generated_images/botanical_garden_patio_scene.png"),
  urban: require("../../attached_assets/generated_images/urban_city_street_night.png"),
  industrial: require("../../attached_assets/generated_images/industrial_loft_interior_scene.png"),
  studio: require("../../attached_assets/generated_images/professional_studio_setup_backdrop.png"),
  minimal: require("../../attached_assets/generated_images/minimalist_clean_white_scene.png"),
  lifestyle: require("../../attached_assets/generated_images/authentic_lifestyle_home_moment.png"),
  gym: require("../../attached_assets/generated_images/modern_gym_fitness_interior.png"),
  garage: require("../../attached_assets/generated_images/organized_garage_workshop_scene.png"),
  playroom: require("../../attached_assets/generated_images/colorful_playroom_fun_scene.png"),
};

// Expanded list of scenes
export const SCENES: Scene[] = [
  // Indoor scenes
  {
    id: "kitchen",
    label: "Kitchen Counter",
    description: "A product photo in a modern, minimalist kitchen with natural light, focusing on clean lines and functional design.",
    image: SCENE_IMAGES.kitchen,
  },
  {
    id: "living",
    label: "Living Room",
    description: "A product photo in a cozy, Scandinavian-style living room, featuring warm textiles, natural wood, and soft, inviting lighting.",
    image: SCENE_IMAGES.living,
  },
  {
    id: "office",
    label: "Office Desk",
    description: "A product photo on a sleek, organized office desk with a minimalist aesthetic, emphasizing productivity and contemporary design.",
    image: SCENE_IMAGES.office,
  },
  {
    id: "bedroom",
    label: "Bedroom",
    description: "A product photo in a serene, contemporary bedroom with soft lighting, luxurious bedding, and a tranquil atmosphere.",
    image: SCENE_IMAGES.bedroom,
  },
  {
    id: "bathroom",
    label: "Bathroom Vanity",
    description: "A product photo on a clean, spa-like bathroom vanity, highlighting elegance, modern fixtures, and a refreshing ambiance.",
    image: SCENE_IMAGES.bathroom,
  },
  {
    id: "dining",
    label: "Dining Table",
    description: "A product photo on an elegant dining table set for a special occasion, featuring refined dinnerware, subtle decorations, and warm, inviting light.",
    image: SCENE_IMAGES.dining,
  },
  {
    id: "cafe",
    label: "Cafe",
    description: "A product photo on a rustic wooden table in a bustling, sunlit cafe, capturing a relaxed, urban vibe with shallow depth of field.",
    image: SCENE_IMAGES.cafe,
  },
  // Outdoor scenes
  {
    id: "outdoor",
    label: "Outdoor Nature",
    description: "A product photo set in a lush, natural outdoor environment with soft, diffused sunlight, emphasizing organic textures and a peaceful mood.",
    image: SCENE_IMAGES.outdoor,
  },
  {
    id: "park",
    label: "Park Setting",
    description: "A product photo in a vibrant, green park setting during golden hour, with a blurred background of trees and people enjoying leisure.",
    image: SCENE_IMAGES.park,
  },
  {
    id: "trail",
    label: "Trail / Path",
    description: "A product photo on an adventurous hiking trail with rugged terrain and distant mountain views, conveying exploration and durability.",
    image: SCENE_IMAGES.trail,
  },
  {
    id: "beach",
    label: "Beach",
    description: "A product photo on a pristine sandy beach at sunset, with gentle waves, a clear sky, and a tranquil, relaxing atmosphere.",
    image: SCENE_IMAGES.beach,
  },
  {
    id: "garden",
    label: "Garden / Patio",
    description: "A product photo in a vibrant botanical garden or a manicured patio, showcasing blooming flowers, lush greenery, and sophisticated outdoor decor.",
    image: SCENE_IMAGES.garden,
  },
  {
    id: "urban",
    label: "Urban Street",
    description: "A product photo on a bustling urban street with dynamic city lights and modern architecture, capturing an energetic, contemporary feel.",
    image: SCENE_IMAGES.urban,
  },
  {
    id: "industrial",
    label: "Industrial Loft",
    description: "A product photo on a raw concrete surface in an industrial-chic loft, featuring exposed brick, metallic accents, and an edgy, modern aesthetic.",
    image: SCENE_IMAGES.industrial,
  },
  // Professional scenes
  {
    id: "studio",
    label: "Studio Setup",
    description: "A product photo in a professional, clean studio setup with a seamless backdrop and controlled lighting, highlighting product details and pristine presentation.",
    image: SCENE_IMAGES.studio,
  },
  {
    id: "minimal",
    label: "Minimalist",
    description: "A product photo against a clean, simple, and uncluttered background, emphasizing the product's form, function, and minimalist appeal.",
    image: SCENE_IMAGES.minimal,
  },
  {
    id: "lifestyle",
    label: "Lifestyle Shot",
    description: "A dynamic product photo integrated into an authentic, everyday lifestyle moment, capturing genuine human interaction and a relatable scenario.",
    image: SCENE_IMAGES.lifestyle,
  },
  // Specialty scenes
  {
    id: "gym",
    label: "Gym / Fitness",
    description: "A product photo in a modern gym setting with sleek equipment and energetic lighting, emphasizing health, fitness, and performance.",
    image: SCENE_IMAGES.gym,
  },
  {
    id: "garage",
    label: "Garage",
    description: "A product photo in a well-organized, clean garage or workshop, highlighting utility, craftsmanship, and a practical environment.",
    image: SCENE_IMAGES.garage,
  },
  {
    id: "playroom",
    label: "Playroom",
    description: "A product photo in a colorful, fun, and imaginative playroom, featuring playful elements, bright lighting, and a joyful atmosphere.",
    image: SCENE_IMAGES.playroom,
  },
];
