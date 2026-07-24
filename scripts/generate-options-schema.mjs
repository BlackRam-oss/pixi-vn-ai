#!/usr/bin/env node
/**
 * Generates the JSON Schemas used by `createAiHandler`'s `keySchemas` (see `src/ink/aiHandler.ts`)
 * from `BackgroundImageGenerateOptions`/`ElementImageGenerateOptions`/`DialogGenerateOptions`
 * (src/types/...), via `@drincs/pixi-vn-json`'s own generic TypeScript-interface-to-JSON-Schema
 * generator (`schema-generator.mjs`) — the same generator `@drincs/pixi-vn-json` itself uses to
 * produce `entranceTransitionKeySchemas`, and `@drincs/pixi-vn-spine` uses for `SpineOptions`.
 *
 * All three interfaces are generated via the depth-capped "external" path (no `interfaceDir`
 * passed): they extend `ImageGenerateOptions`/`GenerateOptions` across files, and `align`/
 * `referenceImage`/`backgroundImage`/`speaker`/`listeners` reference `@drincs/pixi-vn`'s own
 * `AssetAliasIdType`/`CharacterInterface` — the type checker's fully-resolved `ts.Type`, used by
 * the "external" path, already flattens `extends` correctly, so every inherited property
 * (`scene`, `style`, `context`, `history`, ...) comes through.
 *
 * Run via `npm run generate-options-schema`; re-run whenever
 * `BackgroundImageGenerateOptions`/`ElementImageGenerateOptions`/`DialogGenerateOptions` (or the
 * types they derive from) change.
 */

import { writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { generateJsonSchema } from "@drincs/pixi-vn-json/schema-generator";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, "..");

const backgroundOptionsFile = join(rootDir, "src", "types", "BackgroundImageGenerateOptions.ts");
const elementOptionsFile = join(rootDir, "src", "types", "ElementImageGenerateOptions.ts");
const dialogOptionsFile = join(rootDir, "src", "types", "DialogGenerateOptions.ts");

const { schemas, definitions } = generateJsonSchema({
    rootFiles: [backgroundOptionsFile, elementOptionsFile, dialogOptionsFile],
    rootTypeNames: [
        "BackgroundImageGenerateOptions",
        "ElementImageGenerateOptions",
        "DialogGenerateOptions",
    ],
    tsconfigPath: join(rootDir, "tsconfig.json"),
});

/** Must be self-contained (each is used standalone as one JSON Schema by any validator). */
function toStandaloneSchema(rootSchema) {
    if (rootSchema.$ref) {
        const key = rootSchema.$ref.replace("#/definitions/", "");
        const { [key]: own, ...rest } = definitions;
        const usedRefs = JSON.stringify(own).match(/#\/definitions\/[A-Za-z0-9_]+/g) ?? [];
        if (usedRefs.length === 0) return own;
        const neededDefinitions = Object.fromEntries(
            usedRefs
                .map((ref) => ref.replace("#/definitions/", ""))
                .filter((k) => k in rest)
                .map((k) => [k, rest[k]]),
        );
        return Object.keys(neededDefinitions).length > 0
            ? { ...own, definitions: neededDefinitions }
            : own;
    }
    return rootSchema;
}

const backgroundImageGenerateOptionsSchema = toStandaloneSchema(
    schemas.BackgroundImageGenerateOptions,
);
const elementImageGenerateOptionsSchema = toStandaloneSchema(schemas.ElementImageGenerateOptions);
const dialogGenerateOptionsSchema = toStandaloneSchema(schemas.DialogGenerateOptions);

const outPath = join(rootDir, "src", "ink", "options-schema.generated.ts");
const content = `/**
 * GENERATED FILE — do not edit by hand.
 * Produced by \`scripts/generate-options-schema.mjs\` from
 * \`BackgroundImageGenerateOptions\`/\`ElementImageGenerateOptions\`/\`DialogGenerateOptions\`
 * (src/types/...). Re-run that script (see its header comment) to refresh this file after those
 * interfaces (or the types they derive from) change.
 */

/**
 * JSON Schema (usable as \`@drincs/pixi-vn-ink\`'s \`HashtagHandlerOptions.keySchemas\` values, or
 * with any other JSON Schema validator) for \`BackgroundImageGenerateOptions\`.
 */
export const backgroundImageGenerateOptionsSchema: object = ${JSON.stringify(backgroundImageGenerateOptionsSchema, null, 4)};

/**
 * JSON Schema (usable as \`@drincs/pixi-vn-ink\`'s \`HashtagHandlerOptions.keySchemas\` values, or
 * with any other JSON Schema validator) for \`ElementImageGenerateOptions\`.
 */
export const elementImageGenerateOptionsSchema: object = ${JSON.stringify(elementImageGenerateOptionsSchema, null, 4)};

/**
 * JSON Schema (usable as \`@drincs/pixi-vn-ink\`'s \`HashtagHandlerOptions.keySchemas\` values, or
 * with any other JSON Schema validator) for \`DialogGenerateOptions\`.
 */
export const dialogGenerateOptionsSchema: object = ${JSON.stringify(dialogGenerateOptionsSchema, null, 4)};
`;

writeFileSync(outPath, content);

console.log(`Generated: ${outPath}`);
