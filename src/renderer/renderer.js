// DOM Elements
const inputText = document.getElementById('input-text');
const outputText = document.getElementById('output-text');
const refinementMode = document.getElementById('refinement-mode');
const refineBtn = document.getElementById('refine-btn');
const copyBtn = document.getElementById('copy-btn');
const replaceBtn = document.getElementById('replace-btn');
const charCount = document.getElementById('char-count');
const processingStatus = document.getElementById('processing-status');
const apiStatusIndicator = document.getElementById('api-status-indicator');
const apiStatusText = document.getElementById('api-status-text');
const toastContainer = document.getElementById('toast-container');
const settingsModal = document.getElementById('settings-modal');
const modalOverlay = document.getElementById('modal-overlay');

// Settings Elements
const licenseKeyInput = document.getElementById('license-key-input');
const activateLicenseBtn = document.getElementById('activate-license-btn');
const licenseStatus = document.getElementById('license-status');
const providerSelect = document.getElementById('provider-select');
const apiKeyInput = document.getElementById('api-key-input');
const lmStudioUrlInput = document.getElementById('lm-studio-url');
const openRouterUrlInput = document.getElementById('openrouter-url');
const openRouterModelSelect = document.getElementById('openrouter-model-select');

// State
let isProcessing = false;
let currentRefinedText = '';

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    initializeEventListeners();
    updateCharacterCount();
    updateApiStatus('ready');
    setupMenuListeners();
});

// Event Listeners
function initializeEventListeners() {
    // Input text area
    inputText.addEventListener('input', handleInputChange);
    inputText.addEventListener('paste', handlePaste);
    inputText.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        window.electronAPI.showContextMenu();
    });
    
    // Buttons
    refineBtn.addEventListener('click', () => handleRefineText());
    copyBtn.addEventListener('click', handleCopyToClipboard);
    replaceBtn.addEventListener('click', handleReplaceText);
    
    // Mode selector
    refinementMode.addEventListener('change', handleModeChange);
    
    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);
    
    // Modal controls
    setupModalControls();
}

function setupMenuListeners() {
    // Listen for menu events from main process
    window.electronAPI.onMenuNew(() => {
        clearAll();
        showToast('New document started', 'success');
    });
    
    window.electronAPI.onMenuSettings(() => {
        showSettings();
    });
    
    window.electronAPI.onContextMenuCommand((command) => {
        if (command === 'refine-selection') {
            const selectedText = inputText.value.substring(inputText.selectionStart, inputText.selectionEnd).trim();
            if (selectedText) {
                handleRefineText(selectedText);
            } else {
                handleRefineText(); // Refine all text if nothing is selected
            }
        }
    });
}

function setupModalControls() {
    const modalClose = document.querySelector('.modal-close');
    const modalCancel = document.querySelector('.modal-cancel');
    const modalSave = document.querySelector('.modal-save');
    
    modalClose?.addEventListener('click', hideSettings);
    modalCancel?.addEventListener('click', hideSettings);
    modalSave?.addEventListener('click', saveSettings);
    modalOverlay.addEventListener('click', hideSettings);
    activateLicenseBtn?.addEventListener('click', handleActivateLicense);
}

// Input handling
function handleInputChange() {
    updateCharacterCount();
    updateRefineButtonState();
}

function handlePaste(event) {
    // Allow default paste behavior
    setTimeout(() => {
        updateCharacterCount();
        updateRefineButtonState();
    }, 0);
}

function updateCharacterCount() {
    const count = inputText.value.length;
    charCount.textContent = count.toLocaleString();
    
    // Add visual feedback for character count
    if (count > 4000) {
        charCount.style.color = '#ef4444';
    } else if (count > 3000) {
        charCount.style.color = '#f59e0b';
    } else {
        charCount.style.color = '#64748b';
    }
}

function updateRefineButtonState() {
    const hasText = inputText.value.trim().length > 0;
    refineBtn.disabled = !hasText || isProcessing;
}

// Mode handling
function handleModeChange() {
    const mode = refinementMode.value;
    showToast(`Switched to ${getModeDisplayName(mode)} mode`, 'success');
}

function getModeDisplayName(mode) {
    const modes = {
        formal: 'Formal',
        casual: 'Casual', 
        concise: 'Concise',
        professional: 'Professional',
        creative: 'Creative'
    };
    return modes[mode] || mode;
}

// Text refinement
async function handleRefineText(textToRefine) {
    const text = textToRefine || inputText.value.trim();
    const mode = refinementMode.value;
    
    if (!text) {
        showToast('Please enter some text to refine', 'warning');
        return;
    }
    
    if (text.length > 4000) {
        showToast('Text is too long. Please limit to 4000 characters.', 'error');
        return;
    }
    
    setProcessingState(true);
    updateApiStatus('processing');
    
    try {
        const result = await window.electronAPI.refineText(text, mode);
        
        if (result.success) {
            displayRefinedText(result.data);
            updateApiStatus('ready');
            showToast('Text refined successfully!', 'success');
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('Error refining text:', error);
        updateApiStatus('error');
        showToast(`Error: ${error.message}`, 'error');
        displayRefinedText('');
    } finally {
        setProcessingState(false);
    }
}

function setProcessingState(processing) {
    isProcessing = processing;
    
    // Update button states
    refineBtn.disabled = processing;
    const buttonText = refineBtn.querySelector('.button-text');
    const spinner = refineBtn.querySelector('.spinner');
    
    if (processing) {
        buttonText.textContent = 'Processing...';
        spinner.classList.remove('hidden');
        processingStatus.classList.remove('hidden');
    } else {
        buttonText.textContent = 'Refine with AI';
        spinner.classList.add('hidden');
        processingStatus.classList.add('hidden');
    }
    
    updateRefineButtonState();
}

function displayRefinedText(text) {
    currentRefinedText = text;
    
    if (text) {
        // Hide placeholder and show refined text
        outputText.innerHTML = '';
        outputText.textContent = text;
        outputText.classList.add('has-content');
        
        // Enable action buttons
        copyBtn.disabled = false;
        replaceBtn.disabled = false;
    } else {
        // Show placeholder
        outputText.innerHTML = `
            <div class="placeholder-content">
                <div class="placeholder-icon">🤖</div>
                <h3>AI-refined text will appear here</h3>
                <p>Enter your text above and click "Refine with AI" to get started</p>
            </div>
        `;
        outputText.classList.remove('has-content');
        
        // Disable action buttons
        copyBtn.disabled = true;
        replaceBtn.disabled = true;
    }
}

// Clipboard operations
async function handleCopyToClipboard() {
    if (!currentRefinedText) return;
    
    try {
        const result = await window.electronAPI.copyToClipboard(currentRefinedText);
        
        if (result.success) {
            showToast('Copied to clipboard!', 'success');
            
            // Visual feedback
            const originalText = copyBtn.innerHTML;
            copyBtn.innerHTML = '<span class="copy-icon">✓</span> Copied!';
            copyBtn.style.background = '#10b981';
            copyBtn.style.color = 'white';
            
            setTimeout(() => {
                copyBtn.innerHTML = originalText;
                copyBtn.style.background = '';
                copyBtn.style.color = '';
            }, 2000);
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('Error copying to clipboard:', error);
        showToast('Failed to copy to clipboard', 'error');
    }
}

function handleReplaceText() {
    if (!currentRefinedText) return;
    
    inputText.value = currentRefinedText;
    updateCharacterCount();
    updateRefineButtonState();
    
    // Clear output
    displayRefinedText('');
    
    showToast('Original text replaced!', 'success');
    
    // Focus input for further editing
    inputText.focus();
}

// Keyboard shortcuts
function handleKeyboardShortcuts(event) {
    // Ctrl/Cmd + Enter to refine
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        event.preventDefault();
        if (!isProcessing && inputText.value.trim()) {
            handleRefineText();
        }
    }
    
    // Ctrl/Cmd + C to copy (when output is focused)
    if ((event.ctrlKey || event.metaKey) && event.key === 'c' && 
        document.activeElement === outputText && currentRefinedText) {
        event.preventDefault();
        handleCopyToClipboard();
    }
    
    // Escape to clear
    if (event.key === 'Escape') {
        if (settingsModal && !settingsModal.classList.contains('hidden')) {
            hideSettings();
        } else {
            clearAll();
        }
    }
}

// Settings
async function handleActivateLicense() {
    const key = licenseKeyInput.value.trim();
    if (!key) {
        showToast('Please enter a license key.', 'warning');
        return;
    }

    try {
        const result = await window.electronAPI.activateLicense(key);
        showToast(result.message, result.success ? 'success' : 'error');
        
        if (result.success) {
            // Refresh the settings view to unlock pro features
            await showSettings();
        }
    } catch (error) {
        console.error('Error activating license:', error);
        showToast('Could not activate license.', 'error');
    }
}

async function showSettings() {
    try {
        // First, get the license status and update license group visibility
        const isProUser = await window.electronAPI.isPro();
        const licenseGroup = document.getElementById('license-group');
        if (licenseGroup) {
            licenseGroup.style.display = isProUser ? 'none' : 'block';
        }

        // Get current settings from the main process
        const settings = await window.electronAPI.getSettings();
        let provider = settings.provider || 'lm-studio';

        // Add (Pro) labels and disable options for free users
        const openAIOption = providerSelect.querySelector('option[value="openai"]');
        const openRouterOption = providerSelect.querySelector('option[value="openrouter"]');

        if (!isProUser) {
            openAIOption.textContent = 'OpenAI (Pro)';
            openRouterOption.textContent = 'OpenRouter (Pro)';
            openAIOption.disabled = true;
            openRouterOption.disabled = true;

            // If a free user has a pro provider selected, default them to lm-studio
            if (provider === 'openai' || provider === 'openrouter') {
                provider = 'lm-studio';
                showToast('You are using a Pro provider. Switching to LM Studio.', 'info');
            }
        } else {
            // Ensure labels are normal for Pro users
            openAIOption.textContent = 'OpenAI';
            openRouterOption.textContent = 'OpenRouter';
            openAIOption.disabled = false;
            openRouterOption.disabled = false;
        }


        // Set the current provider in the dropdown
        providerSelect.value = provider;
        
        // Update the UI based on the selected provider
        await updateSettingsUI(provider);
        
        // Populate API keys and other fields
        apiKeyInput.value = await window.electronAPI.getApiKey(provider) || '';
        lmStudioUrlInput.value = settings.lmStudioUrl || '';
        openRouterUrlInput.value = settings.openRouterUrl || '';

        if (provider === 'openrouter') {
            await populateOpenRouterModels(settings.openRouterModel);
        }
        
        settingsModal.classList.remove('hidden');
        modalOverlay.classList.remove('hidden');
    } catch (error) {
        console.error('Error loading settings:', error);
        showToast('Could not load settings.', 'error');
    }
}

function hideSettings() {
    settingsModal.classList.add('hidden');
    modalOverlay.classList.add('hidden');
}

async function saveSettings() {
    const settings = {
        provider: providerSelect.value,
        apiKey: apiKeyInput.value,
        lmStudioUrl: lmStudioUrlInput.value,
        openRouterUrl: openRouterUrlInput.value,
        openRouterModel: openRouterModelSelect.value,
    };

    const result = await window.electronAPI.saveSettings(settings);
    if (result.success) {
        showToast('Settings saved successfully!', 'success');
        hideSettings();
    } else {
        showToast('Failed to save settings', 'error');
    }
}

async function updateSettingsUI(provider) {
    const apiKeyGroup = document.getElementById('api-key-group');
    const lmStudioUrlGroup = document.getElementById('lm-studio-url-group');
    const openRouterUrlGroup = document.getElementById('openrouter-url-group');
    const openRouterModelGroup = document.getElementById('openrouter-model-group');

    // Hide all provider-specific groups initially
    apiKeyGroup.style.display = 'none';
    lmStudioUrlGroup.style.display = 'none';
    openRouterUrlGroup.style.display = 'none';
    openRouterModelGroup.style.display = 'none';

    if (provider === 'openai' || provider === 'openrouter') {
        apiKeyGroup.style.display = 'block';
    }

    if (provider === 'lm-studio') {
        lmStudioUrlGroup.style.display = 'block';
    }

    if (provider === 'openrouter') {
        openRouterUrlGroup.style.display = 'block';
        openRouterModelGroup.style.display = 'block';
        await populateOpenRouterModels();
    }
}

providerSelect?.addEventListener('change', (e) => {
    updateSettingsUI(e.target.value);
});

async function populateOpenRouterModels() {
    const apiKey = apiKeyInput.value;
    if (!apiKey) {
        openRouterModelSelect.innerHTML = '<option>Enter API key to load models</option>';
        return;
    }

    openRouterModelSelect.innerHTML = '<option>Loading models...</option>';
    const result = await window.electronAPI.fetchOpenRouterModels(apiKey);

    if (result.success) {
        openRouterModelSelect.innerHTML = '';
        result.data.forEach(model => {
            const option = document.createElement('option');
            option.value = model.id;
            option.textContent = model.name;
            openRouterModelSelect.appendChild(option);
        });
    } else {
        openRouterModelSelect.innerHTML = `<option>${result.error}</option>`;
    }
}


// Utility functions
function clearAll() {
    inputText.value = '';
    displayRefinedText('');
    updateCharacterCount();
    updateRefineButtonState();
    updateApiStatus('ready');
    inputText.focus();
}

function updateApiStatus(status) {
    switch (status) {
        case 'ready':
            apiStatusIndicator.className = 'status-indicator';
            apiStatusText.textContent = 'Ready';
            break;
        case 'processing':
            apiStatusIndicator.className = 'status-indicator warning';
            apiStatusText.textContent = 'Processing...';
            break;
        case 'error':
            apiStatusIndicator.className = 'status-indicator error';
            apiStatusText.textContent = 'Error';
            break;
        default:
            apiStatusIndicator.className = 'status-indicator';
            apiStatusText.textContent = 'Ready';
    }
}

// Toast notifications
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    toastContainer.appendChild(toast);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease forwards';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, 3000);
}

// Add slide out animation for toasts
const style = document.createElement('style');
style.textContent = `
    @keyframes slideOut {
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Auto-focus input on load
window.addEventListener('load', () => {
    inputText.focus();
});

// Handle window resize for responsive behavior
window.addEventListener('resize', () => {
    // Adjust layout if needed
    const isMobile = window.innerWidth <= 768;
    document.body.classList.toggle('mobile', isMobile);
});

// Export functions for testing (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        handleRefineText,
        handleCopyToClipboard,
        updateCharacterCount,
        showToast
    };
}