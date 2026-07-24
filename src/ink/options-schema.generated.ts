/**
 * GENERATED FILE — do not edit by hand.
 * Produced by `scripts/generate-options-schema.mjs` from
 * `BackgroundImageGenerateOptions`/`ElementImageGenerateOptions`/`DialogGenerateOptions`
 * (src/types/...). Re-run that script (see its header comment) to refresh this file after those
 * interfaces (or the types they derive from) change.
 */

/**
 * JSON Schema (usable as `@drincs/pixi-vn-ink`'s `HashtagHandlerOptions.keySchemas` values, or
 * with any other JSON Schema validator) for `BackgroundImageGenerateOptions`.
 */
export const backgroundImageGenerateOptionsSchema: object = {
    type: "object",
    properties: {
        referenceImage: {
            type: "string",
        },
        history: {
            enum: [false, true],
        },
        context: {
            type: "string",
        },
        scene: {
            type: "string",
        },
        style: {
            type: "string",
        },
    },
    additionalProperties: false,
};

/**
 * JSON Schema (usable as `@drincs/pixi-vn-ink`'s `HashtagHandlerOptions.keySchemas` values, or
 * with any other JSON Schema validator) for `ElementImageGenerateOptions`.
 */
export const elementImageGenerateOptionsSchema: object = {
    type: "object",
    properties: {
        backgroundImage: {
            anyOf: [
                {
                    type: "string",
                },
                {
                    const: true,
                },
            ],
        },
        align: {
            type: "object",
        },
        referenceImage: {
            type: "string",
        },
        history: {
            enum: [false, true],
        },
        context: {
            type: "string",
        },
        scene: {
            type: "string",
        },
        style: {
            type: "string",
        },
    },
    additionalProperties: false,
};

/**
 * JSON Schema (usable as `@drincs/pixi-vn-ink`'s `HashtagHandlerOptions.keySchemas` values, or
 * with any other JSON Schema validator) for `DialogGenerateOptions`.
 */
export const dialogGenerateOptionsSchema: object = {
    type: "object",
    properties: {
        speaker: {
            type: ["string", "object"],
        },
        listeners: {
            type: ["string", "object"],
        },
        language: {
            type: "string",
        },
        history: {
            enum: [false, true],
        },
        context: {
            type: "string",
        },
        scene: {
            type: "string",
        },
        style: {
            type: "string",
        },
    },
    additionalProperties: false,
};
