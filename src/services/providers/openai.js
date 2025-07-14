/**
 * @file OpenAI provider module.
 * Handles all interactions with the OpenAI API.
 */

const axios = require('axios');
const { REFINEMENT_MODES } = require('../prompts');

/**
 * Sends a text refinement request to the OpenAI API.
 * @param {string} text The text to refine.
 * @param {string} mode The refinement mode.
 * @param {object} settings Application settings, containing the API key.
 * @returns {Promise<string>} The refined text.
 */
async function refine(text, mode, settings) {
    const { apiKey } = settings;
    if (!apiKey) throw new Error('OpenAI API key is missing');

    const model = 'gpt-4o-mini'; // Or any other suitable model from OpenAI.
    const modeConfig = REFINEMENT_MODES[mode];

    if (!modeConfig) {
        throw new Error(`Invalid refinement mode: ${mode}`);
    }

    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
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
            'Authorization': `Bearer ${apiKey}`
        }
    });

    if (response.data && response.data.choices && response.data.choices[0]) {
        return response.data.choices[0].message.content.trim();
    } else {
        throw new Error('Unexpected API response structure from OpenAI');
    }
}

module.exports = { refine }; 