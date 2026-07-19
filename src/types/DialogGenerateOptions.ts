import type GenerateOptions from "./GenerateOptions";

/**
 * Options accepted by {@link ai.dialog.generate}.
 */
export default interface DialogGenerateOptions extends GenerateOptions {
    /**
     * Output language.
     */
    language?: string;
}
