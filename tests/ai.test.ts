import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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

beforeEach(() => {
    vi.clearAllMocks();
    utilsMock.resolveAssetImage.mockImplementation(async (alias: unknown) => fakeBase64(alias));
});

describe("ai.init", () => {
    it("forwards its options straight to Provider.init", async () => {
        const options = { textProvider: "mock-model" as never };
        await ai.init(options);
        expect(providerMock.Provider.init).toHaveBeenCalledWith(options);
    });
});

describe("ai.text.generateDialog", () => {
    beforeEach(() => {
        providerMock.Provider.generateText.mockResolvedValue("The king reveals his secret.");
    });

    it("builds the prompt from the dialog template and forwards it to Provider.generateText", async () => {
        const result = await ai.text.generateDialog(
            "Generate a dialogue where the king reveals his secret.",
        );
        expect(result).toBe("The king reveals his secret.");
        expect(providerMock.Provider.generateText).toHaveBeenCalledTimes(1);
        const prompt = providerMock.Provider.generateText.mock.calls[0][0];
        expect(prompt).toContain("Generate a dialogue where the king reveals his secret.");
    });

    it("includes options-driven sections (e.g. scene) in the prompt", async () => {
        await ai.text.generateDialog("Say hello.", { scene: "A garden." });
        const prompt = providerMock.Provider.generateText.mock.calls[0][0];
        expect(prompt).toContain("A garden.");
    });
});

describe("ai.image.generateBackground", () => {
    beforeEach(() => {
        providerMock.Provider.generateImage.mockResolvedValue("data:image/png;base64,abc123");
    });

    it("includes the canvas size and returns the provider's result", async () => {
        const result = await ai.image.generateBackground("Generate the throne room at sunset.");
        expect(result).toBe("data:image/png;base64,abc123");
        const prompt = providerMock.Provider.generateImage.mock.calls[0][0];
        expect(prompt).toContain("Canvas Size");
        expect(providerMock.Provider.generateImage).toHaveBeenCalledWith(
            expect.any(String),
            undefined,
        );
    });

    it("resolves referenceImage and forwards it both in the prompt and to the provider", async () => {
        await ai.image.generateBackground("Generate the throne room at sunset.", {
            referenceImage: "ref.png",
        });
        expect(utilsMock.resolveAssetImage).toHaveBeenCalledWith("ref.png");
        expect(providerMock.Provider.generateImage).toHaveBeenCalledWith(
            expect.any(String),
            fakeBase64("ref.png"),
        );
        const prompt = providerMock.Provider.generateImage.mock.calls[0][0];
        expect(prompt).toContain(fakeBase64("ref.png"));
    });
});

describe("ai.image.generateElement", () => {
    beforeEach(() => {
        providerMock.Provider.generateImage.mockResolvedValue("data:image/png;base64,abc123");
    });

    it("returns the provider's result with no options", async () => {
        const result = await ai.image.generateElement("Generate the advisor.");
        expect(result).toBe("data:image/png;base64,abc123");
        expect(providerMock.Provider.generateImage).toHaveBeenCalledWith(
            expect.any(String),
            undefined,
        );
    });

    it("embeds the background image in the prompt, includes alignment, but only forwards referenceImage to the provider", async () => {
        const result = await ai.image.generateElement("Generate the advisor.", {
            backgroundImage: "bg.png",
            align: { x: 0.8, y: 1 },
        });
        expect(result).toBe("data:image/png;base64,abc123");
        expect(utilsMock.resolveAssetImage).toHaveBeenCalledWith("bg.png");
        expect(providerMock.Provider.generateImage).toHaveBeenCalledWith(
            expect.any(String),
            undefined,
        );
        const prompt = providerMock.Provider.generateImage.mock.calls[0][0];
        expect(prompt).toContain(fakeBase64("bg.png"));
        expect(prompt).toContain("Alignment");
        expect(prompt).toContain('"x": 0.8');
        expect(prompt).toContain('"y": 1');
    });

    it("captures the current canvas into the prompt when backgroundImage is true, without forwarding it to the provider", async () => {
        await ai.image.generateElement("Generate the advisor.", { backgroundImage: true });
        expect(utilsMock.resolveAssetImage).toHaveBeenCalledWith(true);
        expect(providerMock.Provider.generateImage).toHaveBeenCalledWith(
            expect.any(String),
            undefined,
        );
        const prompt = providerMock.Provider.generateImage.mock.calls[0][0];
        expect(prompt).toContain(fakeBase64(true));
    });

    it("prefers the explicit reference image over the background image", async () => {
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

describe("ai.templates", () => {
    const originalDialog = ai.templates.dialog;
    const originalBackground = ai.templates.image.background;
    const originalElement = ai.templates.image.element;

    afterEach(() => {
        ai.templates.dialog = originalDialog;
        ai.templates.image.background = originalBackground;
        ai.templates.image.element = originalElement;
    });

    it("templates.dialog overrides the prompt sent by ai.text.generateDialog", async () => {
        providerMock.Provider.generateText.mockResolvedValue("ok");
        ai.templates.dialog = { instructions: "Be extremely terse." };

        await ai.text.generateDialog("Say hello.");

        const prompt = providerMock.Provider.generateText.mock.calls[0][0];
        expect(prompt).toContain("Be extremely terse.");
    });

    it("templates.image.background overrides the prompt sent by ai.image.generateBackground", async () => {
        providerMock.Provider.generateImage.mockResolvedValue("data:image/png;base64,abc123");
        ai.templates.image.background = { instructions: "Fill the whole frame, no exceptions." };

        await ai.image.generateBackground("Generate the throne room at sunset.");

        const prompt = providerMock.Provider.generateImage.mock.calls[0][0];
        expect(prompt).toContain("Fill the whole frame, no exceptions.");
    });

    it("templates.image.element overrides the prompt sent by ai.image.generateElement", async () => {
        providerMock.Provider.generateImage.mockResolvedValue("data:image/png;base64,abc123");
        ai.templates.image.element = { instructions: "Transparent background, always." };

        await ai.image.generateElement("Generate the advisor.");

        const prompt = providerMock.Provider.generateImage.mock.calls[0][0];
        expect(prompt).toContain("Transparent background, always.");
    });
});
