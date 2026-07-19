import type {
    BackgroundImageGenerateOptions,
    DialogGenerateOptions,
    ElementImageGenerateOptions,
    PromptSection,
    PromptTemplate,
} from "@/types";
import type { CharacterItem } from "@/types/CharacterItem";
import { resolveAssetImage } from "@/utils";
import { RegisteredCharacters } from "@drincs/pixi-vn";
import { stepHistory } from "@drincs/pixi-vn/history";

/**
 * The union of every field {@link DialogGenerateOptions}, {@link BackgroundImageGenerateOptions}
 * and {@link ElementImageGenerateOptions} can carry, since the builder assembles sections for all
 * of them without knowing which one it was called for.
 */
type PromptOptions = DialogGenerateOptions &
    BackgroundImageGenerateOptions &
    ElementImageGenerateOptions;

/**
 * Centralizes prompt construction so that generators never concatenate strings directly.
 *
 * Assembles a prompt out of independent {@link PromptSection}s (instructions, developer request,
 * narrative history, scene, ...), including only the sections that are actually relevant for the
 * given request.
 */
export namespace PromptBuilder {
    /**
     * Title of the section holding the resolved reference image, when {@link ImageGenerateOptions.referenceImage}
     * is set. Callers (e.g. `ai.image.*`) can look this section up in {@link buildSections}'s
     * result to reuse the same resolved base64 image as the provider's reference image.
     */
    export const REFERENCE_IMAGE_TITLE = "Reference Image";
    /**
     * Title of the section holding the resolved background image, when
     * {@link ElementImageGenerateOptions.backgroundImage} is set. See {@link REFERENCE_IMAGE_TITLE}.
     */
    export const BACKGROUND_REFERENCE_TITLE = "Background Reference";

    /**
     * Assemble the sections of a prompt, without applying any specific format to the final string.
     * @param template The template supplying the instructions section.
     * @param request The developer's natural language request.
     * @param options The generate options driving which sections get included.
     * @param extraSections Additional sections appended at the end, e.g. the canvas size for
     *   {@link ai.image.generateBackground}. Callers that read state {@link PromptBuilder} doesn't
     *   have access to (like Pixi'VN's canvas) are responsible for building these themselves.
     */
    export async function buildSections(
        template: PromptTemplate,
        request: string,
        options: PromptOptions = {},
        extraSections: PromptSection[] = [],
    ): Promise<PromptSection[]> {
        const sections: PromptSection[] = [];
        const {
            speaker,
            listeners,
            history = true,
            context,
            scene,
            style,
            language,
            referenceImage,
            backgroundImage,
            align,
        } = options;

        sections.push({ title: "Instructions", content: template.instructions });
        sections.push({ title: "Developer Request", content: request });

        if (history) {
            const historyJson = getNarrativeHistoryJson();
            if (historyJson) {
                sections.push({
                    title: "Narrative History",
                    description: "The narrative history so far, serialized as JSON.",
                    content: historyJson,
                });
            }
        }

        if (scene) {
            sections.push({ title: "Scene", content: scene });
        }

        if (style) {
            sections.push({ title: "Style", content: style });
        }

        if (language) {
            sections.push({
                title: "Language",
                description: "The language the generated content must be written in.",
                content: language,
            });
        }

        if (context) {
            sections.push({ title: "Context", content: context });
        }

        if (speaker) {
            const speakerJson = getCharactersJson(speaker);
            if (speakerJson) {
                sections.push({
                    title: "Speaker",
                    description: "The character(s) speaking, serialized as JSON.",
                    content: speakerJson,
                });
            }
        }

        if (listeners) {
            const listenersJson = getCharactersJson(listeners);
            if (listenersJson) {
                sections.push({
                    title: "Listeners",
                    description: "The character(s) receiving the dialogue, serialized as JSON.",
                    content: listenersJson,
                });
            }
        }

        if (referenceImage) {
            sections.push({
                title: REFERENCE_IMAGE_TITLE,
                description:
                    "A reference image has been provided, encoded as a base64 data URI, and should be used as visual guidance.",
                content: await resolveAssetImage(referenceImage),
            });
        }

        if (backgroundImage) {
            sections.push({
                title: BACKGROUND_REFERENCE_TITLE,
                description:
                    "The background image this element will be placed over, encoded as a base64 data URI: use it as visual guidance for lighting, perspective and scale.",
                content: await resolveAssetImage(backgroundImage),
            });
        }

        if (align) {
            const alignJson = JSON.stringify(align, null, 2);
            sections.push({
                title: "Alignment",
                description:
                    "Where the element will be positioned on the canvas: x and y are each a 0-1 fraction of the canvas' width/height, and that same fraction is also used as the element's own anchor point, so the value describes both where on the canvas the point sits and which point of the element is placed there. 0 = the element's left/top edge is flush against the canvas' left/top edge, 1 = the element's right/bottom edge is flush against the canvas' right/bottom edge, 0.5 = the element is centered on that axis.",
                content: alignJson,
            });
        }

        sections.push(...extraSections);

        return sections;
    }

    /**
     * Build the final prompt string for the given template, request and options.
     * @param template The template supplying the instructions section.
     * @param request The developer's natural language request.
     * @param options The generate options driving which sections get included.
     * @param extraSections Additional sections appended at the end.
     */
    export async function build(
        template: PromptTemplate,
        request: string,
        options: PromptOptions = {},
        extraSections: PromptSection[] = [],
    ): Promise<string> {
        const sections = await buildSections(template, request, options, extraSections);
        return formatSections(sections);
    }

    /**
     * Format a list of sections (e.g. from {@link buildSections}) into the final prompt string.
     */
    export function formatSections(sections: PromptSection[]): string {
        return sections.map(formatSection).join("\n\n");
    }

    /**
     * Format a single section as a Markdown block (heading, optional description, content).
     */
    function formatSection(section: PromptSection): string {
        const { title, description, content } = section;
        if (description) {
            return `### ${title}

${description}

\`\`\`
${content}
\`\`\``;
        } else {
            return `### ${title}

${content}`;
        }
    }

    /**
     * Retrieve the Pixi'VN narrative history and serialize it into JSON.
     *
     * This is the only place in the library that reads Pixi'VN's history state, so developers
     * never have to pass the history manually: {@link GenerateOptions.history} is enough.
     * @returns The serialized history, or undefined if there is no history to inject.
     */
    function getNarrativeHistoryJson(): string | undefined {
        const history = stepHistory.narrativeHistory;
        if (!history || history.length === 0) {
            return undefined;
        }
        return JSON.stringify(history, null, 2);
    }

    /**
     * Serialize one or more characters into JSON, resolving character IDs against Pixi'VN's
     * {@link RegisteredCharacters} so the model sees full character data instead of a bare ID.
     * @param characters The character(s) to serialize.
     * @returns The serialized value, or undefined if there is nothing to inject.
     */
    function getCharactersJson(characters: CharacterItem | CharacterItem[]): string | undefined {
        if (!Array.isArray(characters)) {
            characters = [characters];
        }
        if (characters.length === 0) {
            return undefined;
        }
        return JSON.stringify(
            characters.map((character) => {
                if (typeof character === "string") {
                    try {
                        return RegisteredCharacters.get(character) || { id: character };
                    } catch {
                        return { id: character };
                    }
                }
                return character;
            }),
            null,
            2,
        );
    }
}
