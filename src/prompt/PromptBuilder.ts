import type {
    DialogGenerateOptions,
    ImageGenerateOptions,
    PromptSection,
    PromptTemplate,
} from "@/types";
import { stepHistory } from "@drincs/pixi-vn/history";

/**
 * The union of every field {@link DialogGenerateOptions} and {@link ImageGenerateOptions} can
 * carry, since the builder assembles sections for both without knowing which one it was called for.
 */
type PromptOptions = DialogGenerateOptions & ImageGenerateOptions;

/**
 * Centralizes prompt construction so that generators never concatenate strings directly.
 *
 * Assembles a prompt out of independent {@link PromptSection}s (instructions, developer request,
 * narrative history, scene, ...), including only the sections that are actually relevant for the
 * given request.
 */
export namespace PromptBuilder {
    /**
     * Assemble the sections of a prompt, without applying any specific format to the final string.
     * @param template The template supplying the instructions section.
     * @param request The developer's natural language request.
     * @param options The generate options driving which sections get included.
     */
    export function buildSections(
        template: PromptTemplate,
        request: string,
        options: PromptOptions = {},
    ): PromptSection[] {
        const sections: PromptSection[] = [];

        if (template.instructions) {
            sections.push({ title: "Instructions", content: template.instructions });
        }

        sections.push({ title: "Developer Request", content: request });

        if (options.history) {
            const historyJson = getNarrativeHistoryJson();
            if (historyJson) {
                sections.push({ title: "Narrative History", content: historyJson });
            }
        }

        if (options.scene) {
            sections.push({ title: "Scene", content: options.scene });
        }

        if (options.style) {
            sections.push({ title: "Style", content: options.style });
        }

        if (options.language) {
            sections.push({ title: "Language", content: options.language });
        }

        if (options.context) {
            sections.push({ title: "Context", content: options.context });
        }

        const speakerJson = serializeObject(options.speaker);
        if (speakerJson) {
            sections.push({ title: "Speaker", content: speakerJson });
        }

        const listenersJson = serializeObject(options.listeners);
        if (listenersJson) {
            sections.push({ title: "Listeners", content: listenersJson });
        }

        if (options.referenceImage !== undefined && options.referenceImage !== null) {
            sections.push({
                title: "Reference Image",
                content:
                    "A reference image has been provided and should be used as visual guidance.",
            });
        }

        return sections;
    }

    /**
     * Build the final prompt string for the given template, request and options.
     * @param template The template supplying the instructions section.
     * @param request The developer's natural language request.
     * @param options The generate options driving which sections get included.
     */
    export function build(
        template: PromptTemplate,
        request: string,
        options: PromptOptions = {},
    ): string {
        return buildSections(template, request, options)
            .map((section) => `## ${section.title}\n${section.content}`)
            .join("\n\n");
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
     * Serialize a developer-provided object (or array of objects) into JSON.
     *
     * Pixi'VN AI never defines a `Character` model: developers pass whatever serializable shape
     * fits their game (a Pixi'VN `Character`, a plain object, a string, ...) and this is the only
     * place that turns it into prompt-ready JSON.
     * @param value The value to serialize. `undefined`/`null` are treated as "not provided".
     * @returns The serialized value, or undefined if there is nothing to inject.
     */
    function serializeObject(value: unknown): string | undefined {
        if (value === undefined || value === null) {
            return undefined;
        }
        if (Array.isArray(value) && value.length === 0) {
            return undefined;
        }
        return JSON.stringify(value, null, 2);
    }
}
