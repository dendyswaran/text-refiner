/**
 * @file OpenRouter provider module.
 * Handles all interactions with the OpenRouter API, including fetching models.
 */

const axios = require('axios');
const { REFINEMENT_MODES } = require('../prompts');

/**
 * Sends a text refinement request to the OpenRouter API.
 * @param {string} text The text to refine.
 * @param {string} mode The refinement mode.
 * @param {object} settings Application settings, containing API key, URL, and selected model.
 * @returns {Promise<string>} The refined text.
 */
async function refine(text, mode, settings) {
    const { apiKey, openRouterUrl, openRouterModel } = settings;
    if (!apiKey) throw new Error('OpenRouter API key is missing');

    const model = openRouterModel || 'openai/gpt-4o-mini';
    const modeConfig = REFINEMENT_MODES[mode];

    if (!modeConfig) {
        throw new Error(`Invalid refinement mode: ${mode}`);
    }

    const response = await axios.post(`${openRouterUrl}/chat/completions`, {
        model,
        messages: [
            { role: 'system', content: modeConfig.systemPrompt },
            { role: 'user', content: `Refine this text:\n\n${text}` }
        ],
        temperature: modeConfig.temperature,
        max_tokens: 2048,
    }, {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'HTTP-Referer': 'https://github.com/dendynetti/windows-text-refiner',
            'X-Title': 'Windows Text Refiner',
        }
    });

    if (response.data && response.data.choices && response.data.choices[0]) {
        return response.data.choices[0].message.content.trim();
    } else {
        throw new Error('Unexpected API response structure from OpenRouter');
    }
}

/**
 * Fetches the list of available models from the OpenRouter API.
 * @param {string} apiKey The user's OpenRouter API key.
 * @returns {Promise<object[]>} A list of available models.
 */
async function fetchModels(apiKey) {
    if (!apiKey) {
        throw new Error('OpenRouter API key is required to fetch models.');
    }
    try {
        const response = await axios.get('https://openrouter.ai/api/v1/models', {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
            }
        });
        return response.data.data;
    } catch (error) {
        console.error('Failed to fetch OpenRouter models:', error.response ? error.response.data : error.message);
        throw new Error('Could not fetch models from OpenRouter. Please check your API key.');
    }
}

module.exports = { refine, fetchModels }; 