# AI Prompt Requirements

This document defines the non-negotiable prompt requirements for AI image generation.
Use it as the source of truth when updating prompts in the client or server.

## Global Requirements (All AI Image Outputs)
- Photorealistic output (no digital render look).
- No text, watermarks, borders, or frames.
- Correct perspective, lighting, and shadows.
- High quality, clean edges.

## Mockup Requirements
- Output must be a square image (2048x2048).
- The scene must fill the entire square frame.
- Edge-to-edge composition: no padding, borders, or solid-color bars.
- Design/logo must be clearly visible and naturally placed on the product.

## Lifestyle Scene Requirements
- Output must fill the frame (no padding or borders).
- Scene must feel real and natural with proper lighting and shadows.
- Product must be the focal point, not cropped or obscured.

## Where This Must Be Enforced
- `client/lib/mockup-presets.ts` (mockup prompt builder)
- `server/routes.ts` (`/api/mockup` and `/api/lifestyle-scene` prompts)
