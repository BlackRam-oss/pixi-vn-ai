import { buildPrompt } from "@/generators/GenerateEngine";
import { getAIState } from "@/init/AIState";
import type { GenerateOptions } from "@/types";

/**
 * The small, provider-independent public API of Pixi'VN AI.
 *
 * Prompt engineering is entirely hidden: `ai.dialog.generate` and `ai.image.generate` build the
 * final prompt internally from the developer request, the configured templates, and the
 * {@link GenerateOptions} passed in (narrative history, speaker, listeners, scene, ...).
 */
export namespace ai {
    export namespace dialog {
        /**
         * Generate a dialogue from a developer request, completely hiding prompt engineering.
         * @param request Natural language description of the dialogue to generate.
         * @param options Options controlling which context gets included in the prompt.
         * @returns The generated dialogue text.
         */
        export async function generate(
            request: string,
            options?: GenerateOptions,
        ): Promise<string> {
            const { provider } = getAIState();
            if (!provider.dialog) {
                throw new Error(
                    `Pixi'VN AI: provider "${provider.name}" does not support dialog generation.`,
                );
            }
            const prompt = buildPrompt("dialog", request, options);
            return provider.dialog.generateText(prompt);
        }
    }
    export namespace image {
        /**
         * Generate an image from a developer request, completely hiding prompt engineering.
         * @param request Natural language description of the image to generate.
         * @param options Options controlling which context gets included in the prompt.
         * @returns The generated image. The shape depends on the configured provider.
         */
        export async function generate(
            request: string,
            options?: GenerateOptions,
        ): Promise<unknown> {
            const { provider } = getAIState();
            if (!provider.image) {
                throw new Error(
                    `Pixi'VN AI: provider "${provider.name}" does not support image generation.`,
                );
            }
            const prompt = buildPrompt("image", request, options);
            return provider.image.generateImage(prompt, options?.referenceImage);
        }
    }
}
