import { ai } from "@/ai";
import type { PromptTemplate } from "@/types";

/**
 * Built-in template used by {@link ai.dialog.generate}.
 *
 * Instructs the model to produce output that Pixi'VN can render directly: simple, readable
 * Markdown, with HTML allowed only when it's the only way to achieve a visual effect.
 */
export const DEFAULT_DIALOG_TEMPLATE: PromptTemplate = {
    instructions: `You are generating narrative dialogue for a visual novel.
Generate Markdown text.
Keep the Markdown simple and readable.
Do not use headings.
Do not use tables.
Do not use unnecessary lists.
Use bold and italic only when they improve readability.
HTML is allowed only when necessary; prefer <span> for styling (e.g. colors). Avoid excessive HTML usage.
Return only the generated content.
Do not explain the generated result.`,
};

/**
 * Built-in template used by {@link ai.image.generate}.
 *
 * Instructs the model to use the reference image (when provided) and otherwise rely on the
 * textual context (scene, style, serialized subjects, ...) to generate the image.
 */
export const DEAFAULT_IMAGE_TEMPLATE: PromptTemplate = {
    instructions: `You are generating a scene illustration for a visual novel.
If a reference image is provided, use it as the basis for the generated image.
Otherwise, generate the image purely from the textual context below.
Match the requested scene, style and subjects as closely as possible.`,
};
