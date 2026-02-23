import { z } from "zod";

// --- Types ---
export interface FashnConfig {
    apiKey: string;
}

export interface RunInput {
    model_image: string; // Base64 or URL
    garment_image: string; // Base64 or URL
    category: "tops" | "bottoms" | "one-pieces";
    cover_feet?: boolean;
    adjust_hands?: boolean;
    restore_background?: boolean;
    restore_clothes?: boolean;
    garment_photo_type?: "auto" | "model" | "flat-lay";
    long_top?: boolean;
    seed?: number;
    num_samples?: number;
    guidance_scale?: number;
    timesteps?: number;
    nsfw_filter?: boolean;
    prompt?: string;
    aspect_ratio?: "1:1" | "16:9" | "9:16" | "4:3" | "3:4" | "2:3" | "3:2" | "4:5" | "5:4";
    quality?: "precise" | "balanced" | "creative"; // Maps to internal API logic
    return_base64?: boolean;
}

export interface ProductToModelInput {
    product_image: string;
    model_image?: string;
    face_reference?: string;
    face_reference_mode?: "match_base" | "match_reference";
    prompt?: string;
    aspect_ratio?: "1:1" | "16:9" | "9:16" | "4:3" | "3:4" | "2:3" | "3:2" | "4:5" | "5:4";
    background_reference?: string;
    num_images?: number;
    output_format?: "png" | "jpeg";
    seed?: number;
    adjust_hands?: boolean;
    restore_clothes?: boolean;
    restore_background?: boolean;
    hd?: boolean;
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
        return this._post("/run", { model_name: "tryon-v1.6", inputs: input });
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

    /**
     * Internal POST helper
     */
    private async _post(endpoint: string, body: any): Promise<RunResponse> {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${this.apiKey}`,
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Fashn API Error (${response.status}): ${errorText}`);
        }

        return response.json();
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
