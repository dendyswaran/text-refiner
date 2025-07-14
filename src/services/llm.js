/**
 * @file LLM service facade.
 * This module acts as a single entry point for all Large Language Model (LLM) operations.
 * It dynamically selects the appropriate provider module based on user settings
 * and delegates the requested action (e.g., text refinement) to that module.
 * This approach keeps the provider-specific logic separate and makes it easy to add new providers.
 */

// A map of available provider modules.
const providers = {
    'lm-studio': require('./providers/lm-studio'),
    'openai': require('./providers/openai'),
    'openrouter': require('./providers/openrouter'),
};

/**
 * Refines the given text using the currently configured provider.
 * @param {string} text The text to refine.
 * @param {string} mode The refinement mode (e.g., 'formal', 'casual').
 * @param {object} settings The application settings, including provider and credentials.
 * @returns {Promise<string>} The refined text.
 */
async function refineText(text, mode, settings) {
    const provider = providers[settings.provider];
    if (!provider) {
        throw new Error(`Unsupported provider: ${settings.provider}`);
    }
    // Delegate the call to the selected provider's 'refine' method.
    return provider.refine(text, mode, settings);
}

/**
 * Fetches the list of available models from OpenRouter.
 * @param {string} apiKey The OpenRouter API key.
 * @returns {Promise<object[]>} A list of available models.
 */
async function fetchOpenRouterModels(apiKey) {
    const provider = providers['openrouter'];
    // Check if the OpenRouter provider and its 'fetchModels' method exist.
    if (provider && provider.fetchModels) {
        return provider.fetchModels(apiKey);
    }
    throw new Error('OpenRouter provider not configured correctly.');
}

module.exports = { refineText, fetchOpenRouterModels }; 