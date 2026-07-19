import type AIProvider from "@/types/AIProvider";

interface AIState {
    provider: AIProvider;
}

let state: AIState | undefined;

/**
 * Set the global AI state. Used internally by `ai.init`.
 */
export function setAIState(provider: AIProvider): void {
    state = { provider };
}

/**
 * Get the global AI state, throwing a descriptive error if `ai.init` hasn't been called yet.
 */
export function getAIState(): AIState {
    if (!state) {
        throw new Error(
            "Pixi'VN AI has not been initialized. Call ai.init({ textProvider }) before using ai.dialog or ai.image.",
        );
    }
    return state;
}
