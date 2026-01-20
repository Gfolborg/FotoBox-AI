// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");
const eslintPluginPrettierRecommended = require("eslint-plugin-prettier/recommended");

module.exports = defineConfig([
  {
    ignores: [
      "dist/**",
      ".cache/**",
      "node_modules/**",
      "server_dist/**",
      "ProductLens/**",
      "ProductLens AI/**",
    ],
  },
  {
    files: ["**/*.{js,jsx,ts,tsx}"], // Apply to all relevant files
    settings: {
      "import/resolver": {
        typescript: {
          project: "./tsconfig.json",
        },
      },
      react: {
        // Explicitly define React settings
        version: "detect", // Automatically detect the React version
      },
    },
  },
  expoConfig,
  eslintPluginPrettierRecommended,
]);
