import { logger } from "@/utils/log-utility";
import { canvas } from "@drincs/pixi-vn/canvas";
import { HashtagCommands } from "@drincs/pixi-vn-ink";
import { executeEntranceTransition } from "@drincs/pixi-vn-json/actions";
import type { PixiVNJsonLabelStep } from "@drincs/pixi-vn-json/schema";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const aiMock = vi.hoisted(() => ({
    ai: {
        image: {
            generateBackground: vi.fn(),
            generateElement: vi.fn(),
        },
    },
    showDialog: vi.fn(),
    AIImageSprite: vi.fn(function (
        this: Record<string, unknown>,
        options: Record<string, unknown> | undefined,
        generatedImage: string,
    ) {
        this.options = options;
        this.generatedImage = generatedImage;
    }),
}));
vi.mock("@drincs/pixi-vn-ai", () => aiMock);

vi.mock("@drincs/pixi-vn-json/actions", async (importOriginal) => {
    const actual = await importOriginal<typeof import("@drincs/pixi-vn-json/actions")>();
    return {
        ...actual,
        executeEntranceTransition: vi.fn(async () => ["ticker-id"]),
    };
});

vi.mock("@drincs/pixi-vn/canvas", () => ({
    canvas: {
        add: vi.fn(),
    },
}));

const { createAiHandler, parseAiShowTail } = await import("@/ink");
const { backgroundImageGenerateOptionsSchema, dialogGenerateOptionsSchema, elementImageGenerateOptionsSchema } =
    await import("@/ink/options-schema.generated");

const step = {} as unknown as PixiVNJsonLabelStep;

afterEach(() => {
    HashtagCommands.clear();
    vi.restoreAllMocks();
});

beforeEach(() => {
    vi.clearAllMocks();
});

describe("parseAiShowTail", () => {
    test("no transition: the whole tail is the request plus props", () => {
        expect(parseAiShowTail(["The throne room.", "style", "Oil painting"])).toEqual({
            request: "The throne room.",
            propsList: ["style", "Oil painting"],
            transitionType: undefined,
            transitionPropsList: [],
        });
    });

    test("recognizes an entrance transition and its own props", () => {
        expect(parseAiShowTail(["The throne room.", "with", "dissolve", "duration", "1"])).toEqual({
            request: "The throne room.",
            propsList: [],
            transitionType: "dissolve",
            transitionPropsList: ["duration", "1"],
        });
    });

    test("drops the 'with' tail but ignores an unsupported (exit-only) transition type", () => {
        expect(parseAiShowTail(["The throne room.", "with", "moveout", "duration", "1"])).toEqual({
            request: "The throne room.",
            propsList: [],
            transitionType: undefined,
            transitionPropsList: [],
        });
    });

    test("empty tail: request is undefined", () => {
        expect(parseAiShowTail([])).toEqual({
            request: undefined,
            propsList: [],
            transitionType: undefined,
            transitionPropsList: [],
        });
    });
});

describe("createAiHandler", () => {
    test("registers all four AI commands", () => {
        createAiHandler();
        const names = HashtagCommands.info().map((o) => o.name);
        expect(names).toEqual(
            expect.arrayContaining([
                "AI show background",
                "AI show element",
                "AI show dialog",
                "AI show dialog with character",
            ]),
        );
    });

    test("'AI show background' registers keySchemas for 'with', each entrance transition, and the props position (4)", () => {
        createAiHandler();
        const opts = HashtagCommands.info().find((o) => o.name === "AI show background");
        expect(Object.keys(opts?.keySchemas ?? {})).toEqual(
            expect.arrayContaining(["with", "dissolve", "fade", "movein", "zoomin", "pushin", "4"]),
        );
        expect((opts?.keySchemas as Record<number, object> | undefined)?.[4]).toBe(
            backgroundImageGenerateOptionsSchema,
        );
    });

    test("'AI show element' registers keySchemas for 'with', each entrance transition, and the props position (4)", () => {
        createAiHandler();
        const opts = HashtagCommands.info().find((o) => o.name === "AI show element");
        expect(Object.keys(opts?.keySchemas ?? {})).toEqual(
            expect.arrayContaining(["with", "dissolve", "fade", "movein", "zoomin", "pushin", "4"]),
        );
        expect((opts?.keySchemas as Record<number, object> | undefined)?.[4]).toBe(
            elementImageGenerateOptionsSchema,
        );
    });

    test("'AI show dialog' registers a keySchemas section for the props position (3)", () => {
        createAiHandler();
        const opts = HashtagCommands.info().find((o) => o.name === "AI show dialog");
        expect((opts?.keySchemas as Record<number, object> | undefined)?.[3]).toBe(
            dialogGenerateOptionsSchema,
        );
    });

    test("'AI show dialog with character' registers a keySchemas section for the props position (5)", () => {
        createAiHandler();
        const opts = HashtagCommands.info().find((o) => o.name === "AI show dialog with character");
        expect((opts?.keySchemas as Record<number, object> | undefined)?.[5]).toBe(
            dialogGenerateOptionsSchema,
        );
    });
});

describe("createAiHandler: running '# ai background' through HashtagCommands.run", () => {
    beforeEach(() => {
        createAiHandler();
        aiMock.ai.image.generateBackground.mockResolvedValue("data:image/png;base64,bg123");
    });

    test("no transition -> canvas.add with a plain AIImageSprite", async () => {
        await HashtagCommands.run('ai background bg "The throne room."', step, {} as never);

        expect(aiMock.ai.image.generateBackground).toHaveBeenCalledWith("The throne room.", {});
        expect(aiMock.AIImageSprite).toHaveBeenCalledWith(undefined, "data:image/png;base64,bg123");

        expect(canvas.add).toHaveBeenCalledTimes(1);
        const [aliasArg, componentArg] = vi.mocked(canvas.add).mock.calls[0];
        expect(aliasArg).toBe("bg");
        expect(componentArg).toMatchObject({ generatedImage: "data:image/png;base64,bg123" });
        expect(executeEntranceTransition).not.toHaveBeenCalled();
    });

    test("forwards extra key/value props as generate options", async () => {
        await HashtagCommands.run(
            'ai background bg "The throne room." style "Oil painting" scene "Night"',
            step,
            {} as never,
        );

        expect(aiMock.ai.image.generateBackground).toHaveBeenCalledWith("The throne room.", {
            style: "Oil painting",
            scene: "Night",
        });
    });

    test("with a supported entrance transition: executeEntranceTransition runs instead of canvas.add", async () => {
        await HashtagCommands.run(
            'ai background bg "The throne room." with dissolve duration 1',
            step,
            {} as never,
        );

        expect(executeEntranceTransition).toHaveBeenCalledTimes(1);
        const [alias, componentArg, type, transitionProps] =
            vi.mocked(executeEntranceTransition).mock.calls[0];
        expect(alias).toBe("bg");
        expect(componentArg).toMatchObject({ generatedImage: "data:image/png;base64,bg123" });
        expect(type).toBe("dissolve");
        expect(transitionProps).toEqual({ duration: 1 });
        expect(canvas.add).not.toHaveBeenCalled();
    });

    test("an unsupported (exit-only) transition type falls back to a plain canvas.add", async () => {
        await HashtagCommands.run(
            'ai background bg "The throne room." with moveout duration 1',
            step,
            {} as never,
        );

        expect(executeEntranceTransition).not.toHaveBeenCalled();
        expect(canvas.add).toHaveBeenCalledTimes(1);
    });

    test("missing request: logs an error and never generates", async () => {
        const errorSpy = vi.spyOn(logger, "error").mockImplementation(() => {});

        await HashtagCommands.run("ai background bg", step, {} as never);

        expect(errorSpy).toHaveBeenCalled();
        expect(aiMock.ai.image.generateBackground).not.toHaveBeenCalled();
        expect(canvas.add).not.toHaveBeenCalled();
    });
});

describe("createAiHandler: running '# ai element' through HashtagCommands.run", () => {
    beforeEach(() => {
        createAiHandler();
        aiMock.ai.image.generateElement.mockResolvedValue("data:image/png;base64,el123");
    });

    test("no align, no transition -> canvas.add with an unpositioned AIImageSprite", async () => {
        await HashtagCommands.run('ai element advisor "The advisor."', step, {} as never);

        expect(aiMock.ai.image.generateElement).toHaveBeenCalledWith("The advisor.", {});
        expect(aiMock.AIImageSprite).toHaveBeenCalledWith(undefined, "data:image/png;base64,el123");
        expect(canvas.add).toHaveBeenCalledTimes(1);
    });

    test("align is forwarded to the prompt options and to the AIImageSprite constructor", async () => {
        await HashtagCommands.run(
            'ai element advisor "The advisor." align { x: 0.75, y: 1 }',
            step,
            {} as never,
        );

        expect(aiMock.ai.image.generateElement).toHaveBeenCalledWith("The advisor.", {
            align: { x: 0.75, y: 1 },
        });
        expect(aiMock.AIImageSprite).toHaveBeenCalledWith(
            { align: { x: 0.75, y: 1 } },
            "data:image/png;base64,el123",
        );
    });

    test("with a supported entrance transition: executeEntranceTransition runs instead of canvas.add", async () => {
        await HashtagCommands.run(
            'ai element advisor "The advisor." with dissolve duration 1',
            step,
            {} as never,
        );

        expect(executeEntranceTransition).toHaveBeenCalledTimes(1);
        const [alias, componentArg, type, transitionProps] =
            vi.mocked(executeEntranceTransition).mock.calls[0];
        expect(alias).toBe("advisor");
        expect(componentArg).toMatchObject({ generatedImage: "data:image/png;base64,el123" });
        expect(type).toBe("dissolve");
        expect(transitionProps).toEqual({ duration: 1 });
        expect(canvas.add).not.toHaveBeenCalled();
    });

    test("missing request: logs an error and never generates", async () => {
        const errorSpy = vi.spyOn(logger, "error").mockImplementation(() => {});

        await HashtagCommands.run("ai element advisor", step, {} as never);

        expect(errorSpy).toHaveBeenCalled();
        expect(aiMock.ai.image.generateElement).not.toHaveBeenCalled();
        expect(canvas.add).not.toHaveBeenCalled();
    });
});

describe("createAiHandler: running '# ai dialog' through HashtagCommands.run", () => {
    beforeEach(() => {
        createAiHandler();
        aiMock.showDialog.mockResolvedValue("Welcome, traveler.");
    });

    test("forwards the request with no character and empty options", async () => {
        await HashtagCommands.run('ai dialog "Greet the traveler."', step, {} as never);

        expect(aiMock.showDialog).toHaveBeenCalledWith("Greet the traveler.", undefined, {});
    });

    test("forwards extra key/value props as generate options", async () => {
        await HashtagCommands.run(
            'ai dialog "Greet the traveler." scene "Throne room."',
            step,
            {} as never,
        );

        expect(aiMock.showDialog).toHaveBeenCalledWith("Greet the traveler.", undefined, {
            scene: "Throne room.",
        });
    });
});

describe("createAiHandler: running '# ai dialog as <character>' through HashtagCommands.run", () => {
    beforeEach(() => {
        createAiHandler();
        aiMock.showDialog.mockResolvedValue("Welcome, traveler.");
    });

    test("forwards the character and the request", async () => {
        await HashtagCommands.run('ai dialog as advisor "Greet the traveler."', step, {} as never);

        expect(aiMock.showDialog).toHaveBeenCalledWith("Greet the traveler.", "advisor", {});
    });

    test("forwards extra key/value props as generate options", async () => {
        await HashtagCommands.run(
            'ai dialog as advisor "Greet the traveler." scene "Throne room."',
            step,
            {} as never,
        );

        expect(aiMock.showDialog).toHaveBeenCalledWith("Greet the traveler.", "advisor", {
            scene: "Throne room.",
        });
    });

    test("'as' with nothing after the character: matches neither command, left unhandled", async () => {
        const result = await HashtagCommands.run("ai dialog as advisor", step, {} as never);

        expect(result).toBeUndefined();
        expect(aiMock.showDialog).not.toHaveBeenCalled();
    });
});

describe("createAiHandler({ characterIds })", () => {
    beforeEach(() => {
        createAiHandler({ characterIds: ["advisor", "king"] });
        aiMock.showDialog.mockResolvedValue("Welcome, traveler.");
    });

    test("a known character id matches", async () => {
        await HashtagCommands.run('ai dialog as advisor "Greet the traveler."', step, {} as never);

        expect(aiMock.showDialog).toHaveBeenCalledWith("Greet the traveler.", "advisor", {});
    });

    test("an unknown character id does not match, left unhandled", async () => {
        const result = await HashtagCommands.run(
            'ai dialog as stranger "Greet the traveler."',
            step,
            {} as never,
        );

        expect(result).toBeUndefined();
        expect(aiMock.showDialog).not.toHaveBeenCalled();
    });
});
