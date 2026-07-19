import type { AssetAliasIdType } from "@drincs/pixi-vn";
import type GenerateOptions from "./GenerateOptions";

/**
 * Options shared by {@link ai.image.generateBackground} and {@link ai.image.generateElement}.
 */
export default interface ImageGenerateOptions extends GenerateOptions {
    /**
     * Optional reference image, forwarded to providers that support image-to-image generation.
     */
    referenceImage?: AssetAliasIdType;
}
