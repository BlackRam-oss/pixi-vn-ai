import { Assets, canvas, type AssetAliasIdType, type Texture } from "@drincs/pixi-vn/canvas";

/**
 * Resolve a Pixi'VN asset alias (or, when `true`, whatever is currently rendered on the game
 * canvas) into a base64 data URI, ready to use as an AI SDK image content part.
 */
export default async function resolveAssetImage(alias: AssetAliasIdType | true): Promise<string> {
    if (alias === true) {
        return await canvas.extractImage();
    }
    const texture = await Assets.load<InstanceType<typeof Texture>>(alias);
    return canvas.app.renderer.extract.base64(texture);
}
