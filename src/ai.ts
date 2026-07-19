import {
    DEFAULT_BACKGROUND_IMAGE_TEMPLATE,
    DEFAULT_DIALOG_TEMPLATE,
    DEFAULT_ELEMENT_IMAGE_TEMPLATE,
    PromptBuilder,
} from "@/prompt";
import { Provider } from "@/providers";
import type {
    BackgroundImageGenerateOptions,
    DialogGenerateOptions,
    ElementImageGenerateOptions,
} from "@/types";
import type PromptTemplate from "@/types/PromptTemplate";
import { resolveAssetImage } from "@/utils";
import { canvas } from "@drincs/pixi-vn/canvas";
import type { ImageModel, LanguageModel } from "ai";

/**
 * The small, provider-independent public API of Pixi'VN AI.
 *
 * Prompt engineering is entirely hidden: `ai.text.generateDialog`, `ai.image.generateBackground`
 * and `ai.image.generateElement` build the final prompt internally from the developer request,
 * the configured templates, and the {@link GenerateOptions} passed in (narrative history, scene,
 * ...).
 */
export namespace ai {
    /**
     * Initialize Pixi'VN AI. Call this once, typically at application startup, before using
     * `ai.text.generateDialog`, `ai.image.generateBackground` or `ai.image.generateElement`.
     *
     * When neither option is given, a small local [WebLLM](https://github.com/mlc-ai/web-llm)
     * model is downloaded and used for dialogue generation (no image support).
     * @param options The [AI SDK](https://ai-sdk.dev) models to use.
     */
    export async function init(options?: {
        /**
         * Language model used for `ai.text.generateDialog`, and as a fallback for image
         * generation on multimodal models (e.g. Gemini image generation).
         */
        textProvider?: LanguageModel;
        /**
         * Image model used for `ai.image.generateBackground` and `ai.image.generateElement`.
         */
        imageProvider?: ImageModel;
    }): Promise<void> {
        return await Provider.init(options);
    }

    /**
     * The templates used to build the prompts sent by `ai.text.generateDialog`,
     * `ai.image.generateBackground` and `ai.image.generateElement`.
     *
     * Assign to `templates.dialog` / `templates.image.background` / `templates.image.element` to
     * override the built-in template.
     */
    export namespace templates {
        // biome-ignore lint/style/useConst: reassigned by consumers, e.g. `templates.dialog = {...}`
        export let dialog: PromptTemplate = DEFAULT_DIALOG_TEMPLATE;

        export namespace image {
            // biome-ignore lint/style/useConst: reassigned by consumers, e.g. `templates.image.background = {...}`
            export let background: PromptTemplate = DEFAULT_BACKGROUND_IMAGE_TEMPLATE;
            // biome-ignore lint/style/useConst: reassigned by consumers, e.g. `templates.image.element = {...}`
            export let element: PromptTemplate = DEFAULT_ELEMENT_IMAGE_TEMPLATE;
        }
    }

    export namespace text {
        /**
         * Generate a dialogue from a developer request, completely hiding prompt engineering.
         * @param request Natural language description of the dialogue to generate.
         * @param options Options controlling which context gets included in the prompt.
         * @returns The generated dialogue text.
         */
        export async function generateDialog(
            request: string,
            options?: DialogGenerateOptions,
        ): Promise<string> {
            const prompt = await PromptBuilder.build(templates.dialog, request, options);
            return Provider.generateText(prompt);
        }
    }
    export namespace image {
        /**
         * Generate a background image from a developer request, completely hiding prompt
         * engineering.
         *
         * The image is meant to fill the whole game canvas: its size is read directly from
         * Pixi'VN and included in the prompt, so it never has to be passed manually.
         * @param request Natural language description of the background to generate.
         * @param options Options controlling which context gets included in the prompt.
         * @returns The generated image, as a data URI, ready to use directly as a Pixi'VN image
         *   source.
         */
        export async function generateBackground(
            request: string,
            options?: BackgroundImageGenerateOptions,
        ): Promise<string> {
            const sections = await PromptBuilder.buildSections(
                templates.image.background,
                request,
                options,
                [{ title: "Canvas Size", content: `${canvas.width}x${canvas.height}` }],
            );
            const prompt = PromptBuilder.formatSections(sections);
            const referenceImage = options?.referenceImage
                ? await resolveAssetImage(options?.referenceImage)
                : undefined;
            return Provider.generateImage(prompt, referenceImage);
        }

        /**
         * Generate a single visual element (e.g. a character) from a developer request,
         * completely hiding prompt engineering.
         *
         * The image is meant to be layered on top of other visuals: the area behind the subject
         * is transparent, and {@link ElementImageGenerateOptions.align} describes where it will
         * be positioned so the model can compose it accordingly.
         * @param request Natural language description of the element to generate.
         * @param options Options controlling which context gets included in the prompt.
         * @returns The generated image, as a data URI, ready to use directly as a Pixi'VN image
         *   source.
         */
        export async function generateElement(
            request: string,
            options?: ElementImageGenerateOptions,
        ): Promise<string> {
            const sections = await PromptBuilder.buildSections(
                templates.image.element,
                request,
                options,
            );
            const prompt = PromptBuilder.formatSections(sections);
            const referenceImage = options?.referenceImage
                ? await resolveAssetImage(options?.referenceImage)
                : undefined;
            return Provider.generateImage(prompt, referenceImage);
        }
    }
}
