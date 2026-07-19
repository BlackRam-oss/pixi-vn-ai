import type { CharacterIdType, CharacterInterface } from "@drincs/pixi-vn";
import type GenerateOptions from "./GenerateOptions";

type CharacterItem = CharacterInterface | CharacterIdType;

/**
 * Options accepted by {@link ai.dialog.generate}.
 */
export default interface DialogGenerateOptions extends GenerateOptions {
    /**
     * Character(s) speaking.
     *
     * Can be any serializable object (or array of objects). Pixi'VN AI does not define a
     * `Character` model: developers are free to pass whatever shape fits their game.
     */
    speaker?: CharacterItem | CharacterItem[];
    /**
     * Character(s) receiving the dialogue.
     *
     * Can be any serializable object (or array of objects).
     */
    listeners?: CharacterItem | CharacterItem[];
    /**
     * Output language.
     */
    language?: string;
}
