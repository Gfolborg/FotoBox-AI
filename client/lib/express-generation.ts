import { getApiUrl } from "@/lib/query-client";
import { ExpressTask, ExpressModelOption } from "@/lib/express-presets";
import * as ImageManipulator from "expo-image-manipulator";

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 2000;
const MAX_DELAY_MS = 15000;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function blobToDataUri(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to read image data"));
    reader.readAsDataURL(blob);
  });
}

async function normalizeImageToJpegUri(imageUri: string): Promise<string> {
  const manipulated = await ImageManipulator.manipulateAsync(imageUri, [], {
    compress: 0.95,
    format: ImageManipulator.SaveFormat.JPEG,
  });
  return manipulated.uri;
}

function shouldRetryRateLimit(statusCode: number, bodyText: string): boolean {
  if (statusCode === 429) return true;
  const lower = bodyText.toLowerCase();
  return (
    lower.includes("resource_exhausted") ||
    lower.includes("rate limit") ||
    lower.includes("429")
  );
}

async function fetchWithRetry(
  endpoint: string,
  options: RequestInit,
): Promise<Response> {
  for (let attempt = 1; attempt <= MAX_RETRIES + 1; attempt += 1) {
    const response = await fetch(endpoint, options);

    if (response.ok) {
      return response;
    }

    const bodyText = await response.text();
    if (shouldRetryRateLimit(response.status, bodyText)) {
      if (attempt <= MAX_RETRIES) {
        const delay = Math.min(
          BASE_DELAY_MS * Math.pow(2, attempt - 1),
          MAX_DELAY_MS,
        );
        await sleep(delay);
        continue;
      }
      throw new Error("Rate limit reached. Please try again in a minute.");
    }

    throw new Error(bodyText || `Request failed (${response.status})`);
  }

  throw new Error("Request failed");
}

async function runBackgroundTask(params: {
  imageUri: string;
  token: string;
  platform: string;
  requiresWatermark: boolean;
}): Promise<string> {
  const normalizedUri = await normalizeImageToJpegUri(params.imageUri);
  const formData = new FormData();
  formData.append("file", {
    uri: normalizedUri,
    name: "express_product.jpg",
    type: "image/jpeg",
  } as unknown as Blob);

  const url = new URL("/api/main-image", getApiUrl());
  url.searchParams.set("backgroundColor", "#FFFFFF");
  url.searchParams.set("platform", params.platform);
  if (params.requiresWatermark) {
    url.searchParams.set("applyWatermark", "true");
  }

  const response = await fetchWithRetry(url.toString(), {
    method: "POST",
    body: formData,
    headers: {
      Authorization: `Bearer ${params.token}`,
    },
  });

  const blob = await response.blob();
  return blobToDataUri(blob);
}

async function runLifestyleTask(params: {
  imageUri: string;
  token: string;
  platform: string;
  prompt: string;
  productDescription: string;
  requiresWatermark: boolean;
}): Promise<string> {
  const normalizedUri = await normalizeImageToJpegUri(params.imageUri);
  const formData = new FormData();
  formData.append("file", {
    uri: normalizedUri,
    name: "express_product.jpg",
    type: "image/jpeg",
  } as unknown as Blob);

  const url = new URL("/api/lifestyle-scene", getApiUrl());
  url.searchParams.set("environment", params.prompt);
  url.searchParams.set("isCustom", "true");
  url.searchParams.set("productDescription", params.productDescription);
  url.searchParams.set("shadowControl", "natural");
  url.searchParams.set("platform", params.platform);
  if (params.requiresWatermark) {
    url.searchParams.set("applyWatermark", "true");
  }

  const response = await fetchWithRetry(url.toString(), {
    method: "POST",
    body: formData,
    headers: {
      Authorization: `Bearer ${params.token}`,
    },
  });

  const blob = await response.blob();
  return blobToDataUri(blob);
}

async function runMockupTask(params: {
  imageUri: string;
  token: string;
  platform: string;
  prompt: string;
  modelOption: ExpressModelOption;
  customModelDirection?: string;
  sceneVibe?: string;
  cameraOption?: string;
  requiresWatermark: boolean;
}): Promise<string> {
  const normalizedUri = await normalizeImageToJpegUri(params.imageUri);
  const formData = new FormData();
  formData.append("file", {
    uri: normalizedUri,
    name: "express_product.jpg",
    type: "image/jpeg",
  } as unknown as Blob);
  formData.append("prompt", params.prompt);
  formData.append("mockupType", "express");
  formData.append("sceneVibe", params.sceneVibe || "professional");
  formData.append("cameraOption", params.cameraOption || "medium");
  formData.append("platform", params.platform);
  formData.append("modelOption", params.modelOption);
  if (params.customModelDirection?.trim()) {
    formData.append("modelDirection", params.customModelDirection.trim());
  }

  const url = new URL("/api/mockup", getApiUrl());
  url.searchParams.set("platform", params.platform);
  if (params.requiresWatermark) {
    url.searchParams.set("applyWatermark", "true");
  }

  const response = await fetchWithRetry(url.toString(), {
    method: "POST",
    body: formData,
    headers: {
      Authorization: `Bearer ${params.token}`,
    },
  });

  const data = await response.json();
  if (!data?.resultUri) {
    throw new Error("Mockup API returned no image");
  }

  return data.resultUri as string;
}

export async function runExpressTask(params: {
  task: ExpressTask;
  imageUri: string;
  token: string;
  platform: string;
  productDescription: string;
  modelOption: ExpressModelOption;
  customModelDirection?: string;
  requiresWatermark: boolean;
}): Promise<string> {
  const { task } = params;

  if (task.kind === "background") {
    return runBackgroundTask({
      imageUri: params.imageUri,
      token: params.token,
      platform: params.platform,
      requiresWatermark: params.requiresWatermark,
    });
  }

  if (task.kind === "lifestyle") {
    return runLifestyleTask({
      imageUri: params.imageUri,
      token: params.token,
      platform: params.platform,
      prompt: task.prompt,
      productDescription: params.productDescription,
      requiresWatermark: params.requiresWatermark,
    });
  }

  return runMockupTask({
    imageUri: params.imageUri,
    token: params.token,
    platform: params.platform,
    prompt: task.prompt,
    modelOption: params.modelOption,
    customModelDirection: params.customModelDirection,
    sceneVibe: task.sceneVibe,
    cameraOption: task.cameraOption,
    requiresWatermark: params.requiresWatermark,
  });
}
