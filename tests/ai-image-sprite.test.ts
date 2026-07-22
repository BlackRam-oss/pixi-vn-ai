import { beforeEach, describe, expect, it, vi } from "vitest";

const canvasMock = vi.hoisted(() => ({ getTexture: vi.fn() }));
vi.mock("@drincs/pixi-vn/canvas", async (importOriginal) => {
    const actual = await importOriginal<typeof import("@drincs/pixi-vn/canvas")>();
    return { ...actual, getTexture: canvasMock.getTexture };
});

const { default: AIImageSprite, AI_IMAGE_SPRITE_ID } = await import("@/canvas/AIImageSprite");
const { Texture } = await import("@drincs/pixi-vn/pixi.js");

const DATA_URI = "data:image/png;base64,abc123";

describe("AIImageSprite", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("stores the generated image passed to the constructor", () => {
        const sprite = new AIImageSprite(undefined, DATA_URI);
        expect(sprite.generatedImage).toBe(DATA_URI);
    });

    it("includes the generated image and its own pixivnId in memory", () => {
        const sprite = new AIImageSprite(undefined, DATA_URI);
        expect(sprite.memory.generatedImage).toBe(DATA_URI);
        expect(sprite.memory.pixivnId).toBe(AI_IMAGE_SPRITE_ID);
    });

    it("restores the generated image and reloads the texture from it on setMemory", async () => {
        canvasMock.getTexture.mockResolvedValue(Texture.EMPTY);
        const sprite = new AIImageSprite();
        expect(sprite.generatedImage).toBeUndefined();

        await sprite.setMemory({ generatedImage: DATA_URI } as any);

        expect(sprite.generatedImage).toBe(DATA_URI);
        expect(canvasMock.getTexture).toHaveBeenCalledWith(DATA_URI);
        expect(sprite.texture).toBe(Texture.EMPTY);
    });

    it("does not touch the texture when the memory has no generated image", async () => {
        const sprite = new AIImageSprite();

        await sprite.setMemory({} as any);

        expect(canvasMock.getTexture).not.toHaveBeenCalled();
        expect(sprite.generatedImage).toBeUndefined();
    });
});
