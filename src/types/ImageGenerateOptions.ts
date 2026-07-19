import type GenerateOptions from "./GenerateOptions";

/**
 * Options accepted by {@link ai.image.generate}.
 */
export default interface ImageGenerateOptions extends GenerateOptions {
    /**
     * Optional reference image, forwarded to providers that support image-to-image generation.
     */
    referenceImage?: unknown;
}
