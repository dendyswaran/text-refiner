/**
 * @file LM Studio provider module.
 * Handles all interactions with a local LM Studio server.
 */

const axios = require('axios');
const { REFINEMENT_MODES } = require('../prompts');

/**
 * Sends a text refinement request to the LM Studio API.
 * @param {string} text The text to refine.
 * @param {string} mode The refinement mode.
 * @param {object} settings Application settings, containing the lmStudioUrl.
 * @returns {Promise<string>} The refined text.
 */
async function refine(text, mode, settings) {
    const { lmStudioUrl } = settings;
    const model = 'local-model'; // LM Studio uses a placeholder model name.
    const modeConfig = REFINEMENT_MODES[mode];

    if (!modeConfig) {
        throw new Error(`Invalid refinement mode: ${mode}`);
    }

    const response = await axios.post(`${lmStudioUrl}/chat/completions`, {
        model,
        messages: [
            { role: 'system', content: modeConfig.systemPrompt },
            { role: 'user', content: `Refine this text:\n\n${text}` }
        ],
        temperature: modeConfig.temperature,
        max_tokens: 2048,
    }, {
        headers: { 'Content-Type': 'application/json' }
    });

    if (response.data && response.data.choices && response.data.choices[0]) {
        return response.data.choices[0].message.content.trim();
    } else {
        throw new Error('Unexpected API response structure from LM Studio');
    }
}

module.exports = { refine }; 