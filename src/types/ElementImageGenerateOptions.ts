import type { AssetAliasIdType } from "@drincs/pixi-vn";
import type ImageGenerateOptions from "./ImageGenerateOptions";

/**
 * Options accepted by {@link ai.image.generateElement}.
 *
 * Generates a single visual element (e.g. a character) meant to be layered on top of other
 * visuals: the area behind the subject is transparent, and {@link align} describes where it will
 * be positioned on screen so the model can compose it accordingly.
 */
export default interface ElementImageGenerateOptions extends ImageGenerateOptions {
    /**
     * The background image this element will be placed over, so the model can compose the
     * subject coherently with what's behind it (lighting, perspective, scale, ...).
     *
     * Pass `true` to use whatever is currently rendered on the game canvas instead of a specific
     * asset.
     *
     * Forwarded to the provider as the reference image when {@link referenceImage} isn't set.
     */
    backgroundImage?: AssetAliasIdType | true;
    /**
     * Position of the element within the canvas (Pixi'VN's `align`, see
     * https://pixi-vn.com/start/canvas-position). Each axis is a 0-1 fraction of the canvas'
     * width/height that is also used as the element's own anchor on that axis, so the value
     * describes both where on the canvas the point sits and which point of the element is placed
     * there: `0` = the element's left/top edge is flush against the canvas' left/top edge, `1` =
     * the element's right/bottom edge is flush against the canvas' right/bottom edge, `0.5` =
     * centered on that axis.
     */
    align?: {
        /**
         * Horizontal position, as a 0-1 fraction of the canvas' width.
         */
        x: number;
        /**
         * Vertical position, as a 0-1 fraction of the canvas' height.
         */
        y: number;
    };
}
