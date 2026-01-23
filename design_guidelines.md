# FotoBox AI - Design Guidelines

## Application Overview
FotoBox AI is a camera-first, AI photo editor for ecommerce sellers. Users can capture or import a product photo, apply quick fixes, then choose one of three AI enhancements:
- Remove background and replace with a chosen color
- Create a lifestyle scene
- Generate a product mockup

The app also supports batch processing, advanced editing tools, saved presets, and platform-specific exports.

## Experience Pillars
- **Fast path to results**: minimal steps, clear CTAs, processing feedback.
- **Creator control**: presets, editing tools, background color, scene choices, mockup customization.
- **Confident exports**: platform-aware optimization and save-to-gallery success feedback.
- **Premium feel**: gradients, glassmorphism, motion, and haptics.

## Navigation & Flow
**Stack navigation only** with onboarding gate on first launch.

### Entry Flow
1. **Onboarding** (one-time) → **Home**
2. **Home** → **Camera** (capture) or **Import** (library)
3. **Quick Fix** (optional edits) → **Photo Action**

### Photo Action (single image)
From **Photo Action**, users choose one of three flows:

**A) Remove Background**
- **Background Color Selection** → **Processing** → **Result** → **Platform Selection** → Save

**B) Lifestyle Scene**
- **Environment Selection** → **Processing** → **Lifestyle Result** → Save

**C) Mockup**
- **Mockup Selection** (product / style / camera / model tabs) → **Processing** → **Mockup Result** → Save

### Batch Flow
Users can select up to 10 images and run batch actions:
- **Batch Action Selection** (background removal or lifestyle scenes)
- **Batch Preview** (choose preset + background color, remove/add images)
- **Batch Processing** → **Batch Results** → **Batch Platform Selection** → Save
- **Batch Lifestyle Processing/Results** for scene generation
- **Batch Mockup Processing/Results** for mockups

### Editing + Presets
- **Quick Fix**: fast rotation/flip/crop/brightness/contrast before AI.
- **Edit Image**: full adjustment suite after AI results.
- **Presets**: save and apply adjustments, manage from **Preset Selection**.

## Screen Specs (Current)

### Onboarding
- Full-screen, paged carousel with gradients.
- Uses logo on slide 1 and feature slides for background removal, lifestyle scenes, mockups, batch editing.
- Footer glass card with pagination dots, Skip/Next/Get Started.

### Home
- Gradient background theme.
- Logo + subtitle.
- Two primary workflow cards: Capture Product Photo, Import Photos.

### Camera Capture
- Full-screen camera preview.
- Transparent header: title “Product Shot”.
- Bottom controls: gallery button, capture button (80px), flash button.
- Optional grid overlay and photo tips modal.

### Quick Fix
- Header with Skip and Reset.
- Image preview with gesture-based adjustments.
- Quick fix toolbar (rotate/flip/brightness/contrast).
- Primary “Continue” button.

### Photo Action
- Preview card of selected image.
- Three action cards:
  - Remove Background
  - Lifestyle Scene
  - Product Mockup

### Background Color Selection
- Neutral image preview (not tinted by choice).
- Color chips with names; white/black/neutral + brand colors.
- “Generate” CTA sends to processing.

### Processing Screens
- Progress ring / loader, status text, and summary of selected options.
- Full-screen gradient background, no heavy interaction.

### Results
- **Result** (background removal): before/after slider, retry, edit, and continue to platform export.
- **Lifestyle Result**: large preview, regenerate option, save.
- **Mockup Result**: large preview, save, generate more.

### Platform Selection
- Platform chips, requirements preview, export actions.
- Saves optimized images per platform to FotoBox album.

### Batch Results
- Grid of results with save/edit/delete per image.
- Apply edit to all (modal) when multiple results exist.
- Export all to platform selection.

## UI Copy Reference (Exact Labels)

### Onboarding
- Slides:
  - Slide 1: "Create professional product images with one tap. Our AI removes backgrounds and creates perfect listings."
  - Slide 2 title: "AI-Powered Scenes" — "Place your products in beautiful, AI-generated lifestyle environments to attract more customers."
  - Slide 3 title: "Create Realistic Mockups" — "Instantly generate professional mockups for your products. Showcase your designs on t-shirts, mugs, and more."
  - Slide 4 title: "Batch Edit Like a Pro" — "Save time by processing multiple images at once. Edit and enhance your entire product line in minutes."
- Buttons: "Skip", "Next", "Get Started"

### Home
- Subtitle: "What do you want to accomplish today?"
- Cards:
  - "Capture Product Photo" — "Take a photo and enhance it"
  - "Import Photos" — "Select from your library"
- Footer: "Powered by AI for e-commerce sellers"

### Camera Capture
- Header: "Product Shot"
- Controls: "Gallery", "Flash"
- Permission states:
  - Title: "Enable Camera" or "Camera Access Required"
  - Body: "To capture product photos, we need access to your camera."
  - Body (denied): "Please enable camera access in your device settings to capture product photos."
  - Buttons: "Enable Camera", "Open Settings"
- Tips modal:
  - Title: "Photo Tips"
  - Tips: "Good Lighting", "Fill the Frame", "Stay Centered", "Plain Background", "Hold Steady"
  - CTA: "Got it!"

### Quick Fix
- Header: "Quick Fix"
- Actions: "Skip", "Reset"
- Hints: "Quick fixes before AI enhancement", "Swipe up/down on image to adjust brightness/contrast"
- CTA: "Continue" (loading: "Processing...")

### Photo Action
- Header: "Choose Enhancement"
- Prompt: "Enhance with AI"
- Cards:
  - "Remove Background" — "Clean cutout with transparent bg"
  - "Lifestyle Scene" — "Place in AI environments"
  - "Product Mockup" — "Realistic product displays"

### Background Color Selection
- Header: "Background Color"
- Prompt: "Choose background color"
- Subtext: "AI will remove the existing background and replace it with your selected color"
- Color labels: "White", "Black", "Light Gray", "Cream", "Coral", "Sky Blue", "Mint", "Lavender"
- CTA: "Generate"

### Result (Background Removal)
- Header pill: "Result" (left action: "Done")
- Specs: "2000 x 2000 - JPG"
- Toggle: "Compare" / "View Result"
- Primary: "Continue"
- Secondary: "Edit", "Retry" (loading: "Retrying..."), "New"
- If edited: "Continue with AI" section with:
  - "Lifestyle Scene" — "Place in AI environments"
  - "Create Mockup" — "Generate product mockups"

### Lifestyle Scene Selection
- Header: "Lifestyle Scene"
- Image: badge "Change" (single) / "Add" (batch)
- Placeholder: "Select a product image"
- Batch label: "{n} images selected"
- Sections:
  - "Describe Your Scene" — "Be descriptive for the best results"
  - Placeholder: "e.g., On a marble countertop next to a plant"
  - "Recent"
  - "Product Keywords" + "Optional" — "Helps the AI understand your product better"
  - Placeholder: "e.g., red glossy lipstick"
  - "Shadow Style" options: "Natural", "Subtle", "Strong"
  - "Or Choose a Preset" — "Quick-start with popular scene styles"
- Error: "Please describe your scene or choose a preset"
- CTA: "Generate Lifestyle Scene" or "Generate {n} Scenes" (loading: "Generating...")
- Processing overlay: "Creating Your Scene" — "This may take up to 30 seconds"

### Lifestyle Scene Result
- Header: "Lifestyle Scene"
- Toggle: "Compare" / "View Result"
- Actions: "Continue", "Edit", "Retry", "New"

### Mockup Selection
- Header: "Create Mockup"
- Images: "Your Images", add button "Select"/"Add", count: "{n} image(s) selected (max 10)"
- Tabs: "Product", "Style", "Camera", "Model"
- Product tab:
  - "Select Category"
  - "Custom"
  - "Describe Your Product"
  - Placeholder: "e.g., skateboard, yoga mat, water bottle..."
  - "Product Color"
  - "Select Product"
- Style tab:
  - "Scene Vibe" — "Choose a mood that matches your brand energy"
  - "Custom Description (Optional)"
  - Placeholder: "Add specific details for your scene..."
- Camera tab:
  - "Camera Angle" — "Choose how your product will be photographed"
- Model tab:
  - "Include People" — "Add models to your mockup for an advertisement-style look"
- CTA: "Generate Mockup" / "Generate Mockups"

### Mockup Result
- Header: "Mockup Result"
- Info label: "Mockup Type"
- Actions: "Share", "Edit", "Continue"
- Secondary: "Create Another Mockup", "Back to Home"

### Batch Action Selection
- Header: "{n} Photos Selected"
- Prompt: "What would you like to do?"
- Subtext: "Choose an action for your batch"
- Cards:
  - "Remove Backgrounds" — "Create clean product photos with solid color backgrounds"
  - "Create Lifestyle Scenes" — "Place products in realistic environments and settings"

### Batch Preview (Background Removal)
- Header: "Batch Edit"
- Controls: "Add More", "{n} remaining"
- Section: "Apply Preset" + option "None"
- Section: "Background Color"
- Summary: "{n} image(s)", selected color label (e.g., "White" or hex), time estimate (~{s}s / ~{m} min)
- CTA: "Generate {n} Image(s)"

### Batch Processing (Background Removal)
- Header: "Processing"
- Hint: "AI is removing backgrounds..."
- Per-item statuses: "Waiting...", "Processing...", "Complete", "Failed"

### Batch Results (Background Removal)
- Header: "Results"
- Stats: "Successful", "Failed"
- Per-item actions: "Edit"
- Batch actions: "Save All ({n})", "New", "Start New"

### Platform Export (Single)
- Header: "Export" (right action: "Skip")
- Section: "Select platforms to optimize for"
- CTA: "Optimize & Export ({n})" or "Select Platforms" (loading: "Exporting...")
- Success: "{n} image(s) saved to FotoBox"

### Platform Export (Batch)
- Header: "Export All" (right action: "Skip")
- Section: "Select platforms to optimize for"
- Summary labels: "Images", "Platforms", "Total"
- Progress: "Processing image {x} of {n} for {platform}..."
- CTA: "Export {total} Images" or "Select Platforms" (loading: "Exporting...")
- Success: "{n} image(s) saved to FotoBox"

## Design System

### Colors
**Primary (Coral/Orange)**: #F97316
- Primary Variant: #EA580C
- Primary Subtle: rgba(249, 115, 22, 0.1)

**Secondary (Blue/Teal)**: #0EA5E9
- Secondary Variant: #0284C7
- Secondary Subtle: rgba(14, 165, 233, 0.1)

**Backgrounds** (warm neutrals)
- Root: #FAFAF9
- Default: #FFFFFF
- Secondary: #F5F5F4
- Tertiary: #E7E5E4
- Borders: #E7E5E4

**Status**
- Success: #16A34A
- Error: #DC2626
- Warning: #F59E0B

**Gradients**
- Primary: [#F97316, #EA580C]
- Accent: [#F97316, #0EA5E9]

### Typography
- Use theme tokens (`Typography`) rather than ad-hoc sizes.
- Default font is system (platform native), no custom font.
- Emphasis: h1–h4 for headers, body for descriptions, caption for helper text.

### Spacing & Radius
- Use `Spacing` scale (xs–5xl) and `BorderRadius` scale (xs–full).
- Capture button size: 80px; standard button height: 52px.

### Components & Styling
- **GradientBackground**: primary page backdrop.
- **GradientButton**: main CTA (supports icon, ghost, and sizes).
- **GlassCard / GlassPill**: premium surfaces for headers and info blocks.
- **IconButton**: circular buttons for navigation and camera actions.
- **WorkflowCard / PresetCard**: home and preset list entries.

### Icons
- Use `@expo/vector-icons` (Feather). Keep icons 20–28px.

### Motion & Feedback
- Use Reanimated for entrance (FadeIn/FadeInUp/FadeInDown).
- Haptics for taps and state changes (success/warning/impact).
- Show toast/notification on save, error, and success.

## Assets
- App logo: `assets/images/fotobox-logo.png`
- Mockup previews and lifestyle scene thumbnails are bundled in `assets/images/mockups` and `assets/images/scenes`.
- No custom illustrations required beyond presets and thumbnails.

## Platform Notes
- No authentication or account system (local-only workflow).
- Onboarding completion stored in AsyncStorage.
- Export saves to FotoBox album on device.
