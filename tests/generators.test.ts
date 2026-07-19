import { beforeEach, describe, expect, it, vi } from "vitest";

const providerMock = vi.hoisted(() => ({
    Provider: {
        init: vi.fn(),
        generateText: vi.fn(),
        generateImage: vi.fn(),
    },
}));
vi.mock("@/providers", () => providerMock);

const utilsMock = vi.hoisted(() => ({
    resolveAssetImage: vi.fn(),
    toDataUri: vi.fn(),
}));
vi.mock("@/utils", () => utilsMock);

const { ai } = await import("@/index");

function fakeBase64(alias: unknown): string {
    return `data:image/png;base64,${alias === true ? "canvas" : alias}`;
}

describe("ai.text.generateDialog", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        providerMock.Provider.generateText.mockResolvedValue("The king reveals his secret.");
    });

    it("builds the prompt and forwards it to Provider.generateText", async () => {
        const result = await ai.text.generateDialog(
            "Generate a dialogue where the king reveals his secret.",
        );
        expect(result).toBe("The king reveals his secret.");
        expect(providerMock.Provider.generateText).toHaveBeenCalledTimes(1);
        const prompt = providerMock.Provider.generateText.mock.calls[0][0];
        expect(prompt).toContain("Generate a dialogue where the king reveals his secret.");
    });
});

describe("ai.image.generateBackground / ai.image.generateElement", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        providerMock.Provider.generateImage.mockResolvedValue("data:image/png;base64,abc123");
        utilsMock.resolveAssetImage.mockImplementation(async (alias: unknown) => fakeBase64(alias));
    });

    it("generates a background image, resolving the reference image and including the canvas size", async () => {
        const result = await ai.image.generateBackground("Generate the throne room at sunset.", {
            referenceImage: "ref.png",
        });
        expect(result).toBe("data:image/png;base64,abc123");
        expect(utilsMock.resolveAssetImage).toHaveBeenCalledWith("ref.png");
        expect(providerMock.Provider.generateImage).toHaveBeenCalledWith(
            expect.any(String),
            fakeBase64("ref.png"),
        );
        const prompt = providerMock.Provider.generateImage.mock.calls[0][0];
        expect(prompt).toContain("## Canvas Size");
        expect(prompt).toContain(fakeBase64("ref.png"));
    });

    it("generates an element image, resolving the background image as reference and including alignment", async () => {
        const result = await ai.image.generateElement("Generate the advisor.", {
            backgroundImage: "bg.png",
            align: { x: 0.8, y: 1 },
        });
        expect(result).toBe("data:image/png;base64,abc123");
        expect(utilsMock.resolveAssetImage).toHaveBeenCalledWith("bg.png");
        expect(providerMock.Provider.generateImage).toHaveBeenCalledWith(
            expect.any(String),
            fakeBase64("bg.png"),
        );
        const prompt = providerMock.Provider.generateImage.mock.calls[0][0];
        expect(prompt).toContain("## Alignment");
        expect(prompt).toContain('"x": 0.8');
        expect(prompt).toContain('"y": 1');
    });

    it("captures the current canvas when backgroundImage is true", async () => {
        await ai.image.generateElement("Generate the advisor.", {
            backgroundImage: true,
        });
        expect(utilsMock.resolveAssetImage).toHaveBeenCalledWith(true);
        expect(providerMock.Provider.generateImage).toHaveBeenCalledWith(
            expect.any(String),
            fakeBase64(true),
        );
    });

    it("prefers the explicit reference image over the background image for an element", async () => {
        await ai.image.generateElement("Generate the advisor.", {
            referenceImage: "ref.png",
            backgroundImage: "bg.png",
        });
        expect(providerMock.Provider.generateImage).toHaveBeenCalledWith(
            expect.any(String),
            fakeBase64("ref.png"),
        );
    });
});
