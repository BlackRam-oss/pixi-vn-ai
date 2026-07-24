import { defineConfig } from "tsup";

export default defineConfig([
    {
        target: "es2020",
        entry: {
            index: "src/index.ts",
            prompt: "src/prompt/index.ts",
            providers: "src/providers/index.ts",
            comfyui: "src/comfyui/index.ts",
        },
        format: ["cjs", "esm"],
        dts: true,
        treeshake: true,
        clean: false,
        minify: true,
        bundle: true,
        skipNodeModulesBundle: false,
        external: [
            "@drincs/pixi-vn",
            "pixi.js",
            "ai",
            "@mlc-ai/web-llm",
            "@stable-canvas/comfyui-client",
        ],
        esbuildOptions(options) {
            options.alias = {
                ...options.alias,
                "pixi.js": "@drincs/pixi-vn/pixi.js",
            };
        },
        outExtension({ format }) {
            return {
                js: format === "esm" ? ".mjs" : ".cjs",
            };
        },
    },
    {
        target: "es2020",
        entry: {
            ink: "src/ink/index.ts",
        },
        format: ["cjs", "esm"],
        dts: true,
        treeshake: true,
        clean: false,
        minify: true,
        bundle: true,
        skipNodeModulesBundle: false,
        // `zod` must stay external: bundling it here would create a second `ZodType` class
        // distinct from the one `@drincs/pixi-vn-ink` uses for its `instanceof ZodType`
        // validation checks, silently breaking every hashtag command registered here (they'd
        // always report as invalid). `@drincs/pixi-vn-ai` must stay external too, so `AIImageSprite`
        // here is the same class the rest of the app imports — otherwise the
        // `RegisteredCanvasComponents.add(AIImageSprite, ...)` side effect in the main entry and
        // any `instanceof AIImageSprite` check would see two distinct classes.
        // `@drincs/pixi-vn-json` (and the `/core`/`/translator` submodules its `/actions` subpath
        // itself pulls in) is deliberately NOT external: it's only a devDependency of this
        // package, used solely for `executeEntranceTransition`/`entranceTransitionKeySchemas`, so
        // it gets bundled straight into `dist/ink.*` — consumers of `@drincs/pixi-vn-ai/ink`
        // don't need to install it themselves.
        external: [
            "@drincs/pixi-vn",
            "@drincs/pixi-vn/canvas",
            "@drincs/pixi-vn-ai",
            "@drincs/pixi-vn-ink",
            "zod",
            "pixi.js",
        ],
        esbuildOptions(options) {
            options.alias = {
                ...options.alias,
                "pixi.js": "@drincs/pixi-vn/pixi.js",
            };
        },
        outExtension({ format }) {
            return {
                js: format === "esm" ? ".mjs" : ".cjs",
            };
        },
    },
]);
