import { useColorScheme as useSystemColorScheme } from "react-native";

// Default to light mode for ecommerce tool
// Change to useSystemColorScheme() to follow device settings
export function useColorScheme(): "light" | "dark" {
  // Force light mode for better product image viewing
  return "light";

  // Uncomment below to follow system settings:
  // return useSystemColorScheme() ?? "light";
}
