import { z } from "zod";

// --- Types ---
export interface FashnConfig {
    apiKey: string;
}

export interface RunInput {
    model_image: string; // URL or base64
    garment_image: string; // URL or base64
    category?: "tops" | "bottoms" | "one-pieces" | "auto";
    mode?: "performance" | "balanced" | "quality";
    garment_photo_type?: "auto" | "model" | "flat-lay";
    moderation_level?: "none" | "permissive" | "conservative";
    seed?: number;
    num_samples?: number;
    segmentation_free?: boolean;
    output_format?: "png" | "jpeg";
    long_top?: boolean;
    return_base64?: boolean;
    cover_feet?: boolean;
    adjust_hands?: boolean;
    restore_background?: boolean;
    restore_clothes?: boolean;
    quality?: "precise" | "balanced" | "creative" | "hd";
    guidance_scale?: number;
    nsfw_filter?: boolean;
}

export interface ProductToModelInput {
    product_image: string;          // Required — URL or base64
    image_prompt?: string;          // Optional inspiration image for pose/environment
    model_image?: string;           // Optional — enables try-on mode. Cannot combine with image_prompt, face_reference, background_reference
    face_reference?: string;
    face_reference_mode?: "match_base" | "match_reference";
    prompt?: string;
    aspect_ratio?: "1:1" | "16:9" | "9:16" | "4:3" | "3:4" | "2:3" | "3:2" | "4:5" | "5:4";
    resolution?: "1k" | "4k";
    background_reference?: string;
    seed?: number;
    num_images?: number;
    output_format?: "png" | "jpeg";
    return_base64?: boolean;
}

export interface ModelSwapInput {
    model_image: string;
    prompt?: string;
    face_reference?: string;
    face_reference_mode?: "match_base" | "match_reference";
    seed?: number;
    num_images?: number;
    output_format?: "png" | "jpeg";
    return_base64?: boolean;
}

export interface EditInput {
    image: string;
    prompt: string;
    seed?: number;
    output_format?: "png" | "jpeg";
    return_base64?: boolean;
}

export interface ModelCreateInput {
    prompt?: string;
    image_reference?: string;
    face_reference?: string;
    face_reference_mode?: "match_base" | "match_reference";
    aspect_ratio?: "1:1" | "16:9" | "9:16" | "4:3" | "3:4" | "2:3" | "3:2" | "4:5" | "5:4";
    return_base64?: boolean;
}

export interface RunResponse {
    id: string;
    status: "starting" | "processing" | "completed" | "failed" | "canceled";
    output?: string[]; // URLs of generated images
    error?: string;
}

// --- Client ---
export class FashnClient {
    private apiKey: string;
    private baseUrl = "https://api.fashn.ai/v1";

    constructor(config: FashnConfig) {
        this.apiKey = config.apiKey;
    }

    /**
     * Submit a virtual try-on job
     */
    /**
     * Submit a virtual try-on job
     */
    async runTryOn(input: RunInput): Promise<RunResponse> {
        return this._post("/run", { model_name: "tryon-v1.5", inputs: input });
    }

    /**
     * Submit a Product to Model job
     */
    async runProductToModel(input: ProductToModelInput): Promise<RunResponse> {
        return this._post("/run", { model_name: "product-to-model", inputs: input });
    }

    /**
     * Submit a Model Swap job
     */
    async runModelSwap(input: ModelSwapInput): Promise<RunResponse> {
        return this._post("/run", { model_name: "model-swap", inputs: input });
    }

    /**
     * Submit an Edit job
     */
    async runEdit(input: EditInput): Promise<RunResponse> {
        return this._post("/run", { model_name: "edit", inputs: input });
    }

    /**
     * Submit a Model Create job
     */
    async runModelCreate(input: ModelCreateInput): Promise<RunResponse> {
        return this._post("/run", { model_name: "model-create", inputs: input });
    }

    private async _post(endpoint: string, body: any): Promise<RunResponse> {
        let lastError: Error | null = null;
        const MAX_ATTEMPTS = 5;

        for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
            try {
                const response = await fetch(`${this.baseUrl}${endpoint}`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${this.apiKey}`,
                    },
                    body: JSON.stringify(body),
                });

                if (response.ok) {
                    return await response.json();
                }

                const errorText = await response.text();
                const isRetryable = response.status >= 500 ||
                    errorText.includes("InternalServerError") ||
                    errorText.includes("Failed to initiate prediction");

                // Retry on upstream 5xx errors (e.g. 524 timeout, 502 gateway) or specific internal errors
                if (isRetryable && attempt < MAX_ATTEMPTS) {
                    // Exponential backoff: 2s, 4s, 8s, 16s + jitter
                    const delay = Math.min(1000 * Math.pow(2, attempt) + Math.random() * 1000, 20000);
                    console.warn(`[Fashn API] Retryable Error (${response.status}) (Attempt ${attempt}/${MAX_ATTEMPTS}): ${errorText}. Retrying in ${Math.round(delay)}ms...`);
                    await new Promise(res => setTimeout(res, delay));
                    continue;
                }

                // If it's a 4xx error (like Bad Request), it won't succeed on retry, so throw immediately
                throw new Error(`Fashn API Error (${response.status}): ${errorText}`);

            } catch (error: any) {
                lastError = error;
                // Retry on network fetch failures (except for explicit Fashn API Errors we just threw)
                if (attempt < MAX_ATTEMPTS && !error.message.includes("Fashn API Error")) {
                    const delay = Math.min(1000 * Math.pow(2, attempt) + Math.random() * 1000, 20000);
                    console.warn(`[Fashn API] Network Error (Attempt ${attempt}/${MAX_ATTEMPTS}): ${error.message}. Retrying in ${Math.round(delay)}ms...`);
                    await new Promise(res => setTimeout(res, delay));
                    continue;
                }
                throw error;
            }
        }

        throw lastError;
    }

    /**
     * Get the status of a job
     */
    async getStatus(id: string): Promise<RunResponse> {
        const response = await fetch(`${this.baseUrl}/status/${id}`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${this.apiKey}`,
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to get status for job ${id}`);
        }

        return response.json();
    }

    /**
     * Get the current API credit balance
     */
    async getCredits(): Promise<{
        credits: {
            total: number;
            subscription: number;
            on_demand: number;
        }
    }> {
        const response = await fetch(`${this.baseUrl}/credits`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${this.apiKey}`,
            },
            cache: "no-store"
        });

        if (!response.ok) {
            throw new Error(`Failed to get API credits`);
        }

        return response.json();
    }

    /**
     * Cancel a running job
     */
    async cancelJob(id: string): Promise<void> {
        const response = await fetch(`${this.baseUrl}/cancel/${id}`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${this.apiKey}`,
            },
        });

        if (!response.ok) {
            console.warn(`Failed to cancel job ${id}`);
        }
    }
}

export const fashnClient = new FashnClient({
    apiKey: process.env.FASHN_API_KEY || "",
});
