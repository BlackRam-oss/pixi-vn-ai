export { ai } from "@/ai";
export { default as initAI, type InitAIOptions } from "./init/initAI";
export { DefaultTemplates, DialogTemplate, ImageTemplate, PromptBuilder } from "./prompt";
export { AISDKProvider, WebLLMProvider, type AISDKProviderOptions } from "./providers";
export type {
    AIProvider,
    DialogProvider,
    GenerateOptions,
    ImageProvider,
    PromptSection,
    PromptTemplate,
    Templates,
} from "./types";
