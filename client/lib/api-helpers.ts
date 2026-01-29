import { getApiUrl } from "./query-client";

export interface GenerationOptions {
  endpoint: string;
  formData: FormData;
  queryParams?: Record<string, string>;
  applyWatermark?: boolean;
  signal?: AbortSignal;
}

export function buildApiEndpoint(
  endpoint: string,
  queryParams: Record<string, string> = {},
  applyWatermark: boolean = false
): string {
  const apiUrl = getApiUrl();
  const params = new URLSearchParams(queryParams);
  
  if (applyWatermark) {
    params.set("applyWatermark", "true");
  }
  
  const queryString = params.toString();
  return queryString 
    ? `${apiUrl}${endpoint}?${queryString}`
    : `${apiUrl}${endpoint}`;
}

export async function generateImage(options: GenerationOptions): Promise<Response> {
  const { endpoint, formData, queryParams = {}, applyWatermark = false, signal } = options;
  
  const url = buildApiEndpoint(endpoint, queryParams, applyWatermark);
  
  const response = await fetch(url, {
    method: "POST",
    body: formData,
    signal,
  });
  
  return response;
}
