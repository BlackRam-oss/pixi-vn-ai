import { buildPrompt } from "@/generators/GenerateEngine";
import { getAIState, setAIState } from "@/init/AIState";
import DefaultTemplates from "@/prompt/templates";
import AISDKProvider from "@/providers/AISDKProvider";
import WebLLMProvider from "@/providers/WebLLMProvider";
import type { GenerateOptions } from "@/types";
import type PromptTemplate from "@/types/PromptTemplate";
import { CreateMLCEngine } from "@mlc-ai/web-llm";
import type { ImageModel, LanguageModel } from "ai";

/**
 * Built-in local model used by `ai.init` when neither `textProvider` nor `imageProvider` is given.
 */
const DEFAULT_WEBLLM_MODEL = "SmolLM2-360M-Instruct-q4f16_1-MLC";

/**
 * The small, provider-independent public API of Pixi'VN AI.
 *
 * Prompt engineering is entirely hidden: `ai.dialog.generate` and `ai.image.generate` build the
 * final prompt internally from the developer request, the configured templates, and the
 * {@link GenerateOptions} passed in (narrative history, speaker, listeners, scene, ...).
 */
export namespace ai {
    /**
     * Initialize Pixi'VN AI. Call this once, typically at application startup, before using
     * `ai.dialog.generate` or `ai.image.generate`.
     *
     * When neither option is given, a small local [WebLLM](https://github.com/mlc-ai/web-llm)
     * model is downloaded and used for dialogue generation (no image support).
     * @param options The [AI SDK](https://ai-sdk.dev) models to use.
     */
    export async function init(options?: {
        /**
         * Language model used for `ai.dialog.generate`, and as a fallback for `ai.image.generate`
         * on multimodal models (e.g. Gemini image generation).
         */
        textProvider?: LanguageModel;
        /**
         * Image model used for `ai.image.generate`.
         */
        imageProvider?: ImageModel;
    }): Promise<void> {
        const { textProvider, imageProvider } = options ?? {};
        if (textProvider || imageProvider) {
            setAIState(
                new AISDKProvider({ languageModel: textProvider, imageModel: imageProvider }),
            );
            return;
        }

        const engine = await CreateMLCEngine(DEFAULT_WEBLLM_MODEL);
        setAIState(new WebLLMProvider(engine));
    }

    /**
     * The templates used to build the prompts sent by `ai.dialog.generate` and `ai.image.generate`.
     *
     * Assign to `templates.dialog` / `templates.image` to override the built-in template.
     */
    export namespace templates {
        // biome-ignore lint/style/useConst: reassigned by consumers, e.g. `templates.dialog = {...}`
        export let dialog: PromptTemplate = DefaultTemplates.dialog;
        // biome-ignore lint/style/useConst: reassigned by consumers, e.g. `templates.image = {...}`
        export let image: PromptTemplate = DefaultTemplates.image;
    }

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
