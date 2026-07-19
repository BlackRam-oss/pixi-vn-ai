/**
 * Options shared by {@link ai.dialog.generate} and {@link ai.image.generate}.
 *
 * These options describe *what* should be included in the generated prompt.
 * The actual prompt text is always assembled internally by the {@link PromptBuilder}.
 */
export default interface GenerateOptions {
    /**
     * Include the Pixi'VN narrative history.
     *
     * When true, the history is retrieved directly from Pixi'VN and serialized into JSON.
     * @default false
     */
    history?: boolean;
    /**
     * Character(s) speaking or subject(s) of the generated image.
     *
     * Can be any serializable object (or array of objects). Pixi'VN AI does not define a
     * `Character` model: developers are free to pass whatever shape fits their game.
     */
    speaker?: unknown | unknown[];
    /**
     * Character(s) receiving the dialogue or observing the scene.
     *
     * Can be any serializable object (or array of objects).
     */
    listeners?: unknown | unknown[];
    /**
     * Additional developer context, injected verbatim into the prompt.
     */
    context?: string;
    /**
     * Scene description.
     */
    scene?: string;
    /**
     * Desired style (tone of voice, art style, etc).
     */
    style?: string;
}
