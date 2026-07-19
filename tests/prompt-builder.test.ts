import type PromptTemplate from "@/types/PromptTemplate";
import { beforeEach, describe, expect, it, vi } from "vitest";

const pixiVnHistoryMock = vi.hoisted(() => ({
    stepHistory: {
        narrativeHistory: [] as unknown[],
    },
}));
vi.mock("@drincs/pixi-vn/history", () => pixiVnHistoryMock);
vi.mock("@drincs/pixi-vn", () => ({ RegisteredCharacters: { get: vi.fn() } }));

const utilsMock = vi.hoisted(() => ({
    resolveAssetImage: vi.fn(),
    toDataUri: vi.fn(),
}));
vi.mock("@/utils", () => utilsMock);

const { PromptBuilder } = await import("@/prompt/PromptBuilder");

const template: PromptTemplate = { instructions: "Be concise." };

describe("PromptBuilder", () => {
    beforeEach(() => {
        pixiVnHistoryMock.stepHistory.narrativeHistory = [];
        utilsMock.resolveAssetImage.mockResolvedValue("data:image/png;base64,resolved");
    });

    it("includes only Instructions and Developer Request when no options are given", async () => {
        const sections = await PromptBuilder.buildSections(template, "Generate a greeting.");
        expect(sections.map((s) => s.title)).toEqual(["Instructions", "Developer Request"]);
        expect(sections[1].content).toBe("Generate a greeting.");
    });

    it("includes sections in the documented order, skipping irrelevant ones", async () => {
        pixiVnHistoryMock.stepHistory.narrativeHistory = [{ stepIndex: 0 }];
        const sections = await PromptBuilder.buildSections(template, "Generate a greeting.", {
            history: true,
            scene: "Throne room at dusk.",
            style: "Melancholic",
            language: "English",
            context: "The king is tired.",
            speaker: { name: "King" },
            listeners: [{ name: "Queen" }],
            referenceImage: "ref.png",
        });

        expect(sections.map((s) => s.title)).toEqual([
            "Instructions",
            "Developer Request",
            "Narrative History",
            "Scene",
            "Style",
            "Language",
            "Context",
            "Speaker",
            "Listeners",
            "Reference Image",
        ]);
    });

    it("omits the Narrative History section when history is not requested", async () => {
        pixiVnHistoryMock.stepHistory.narrativeHistory = [{ stepIndex: 0 }];
        const sections = await PromptBuilder.buildSections(template, "Generate a greeting.", {
            history: false,
        });
        expect(sections.map((s) => s.title)).not.toContain("Narrative History");
    });

    it("omits the Narrative History section when history is requested but empty", async () => {
        const sections = await PromptBuilder.buildSections(template, "Generate a greeting.", {
            history: true,
        });
        expect(sections.map((s) => s.title)).not.toContain("Narrative History");
    });

    it("serializes speaker and listeners as JSON", async () => {
        const sections = await PromptBuilder.buildSections(template, "Generate a greeting.", {
            speaker: { name: "King" },
        });
        const speakerSection = sections.find((s) => s.title === "Speaker");
        expect(speakerSection).toBeDefined();
        expect(JSON.parse(speakerSection!.content)).toEqual([{ name: "King" }]);
    });

    it("resolves the reference image via resolveAssetImage", async () => {
        const sections = await PromptBuilder.buildSections(template, "Generate a greeting.", {
            referenceImage: "ref.png",
        });
        expect(utilsMock.resolveAssetImage).toHaveBeenCalledWith("ref.png");
        const referenceSection = sections.find((s) => s.title === PromptBuilder.REFERENCE_IMAGE_TITLE);
        expect(referenceSection?.content).toBe("data:image/png;base64,resolved");
    });

    it("builds a single prompt string with all sections", async () => {
        const prompt = await PromptBuilder.build(template, "Generate a greeting.", {
            scene: "A garden.",
        });
        expect(prompt).toContain("### Instructions\n\nBe concise.");
        expect(prompt).toContain("### Developer Request\n\nGenerate a greeting.");
        expect(prompt).toContain("### Scene\n\nA garden.");
    });
});
