document.addEventListener('DOMContentLoaded', () => {
    const refineText = document.getElementById('refine-text');
    const outputText = document.getElementById('output-text');
    const refinementMode = document.getElementById('refinement-mode');
    const refineBtn = document.getElementById('refine-btn');
    const copyBtn = document.getElementById('copy-btn');

    // Populate textarea with text from clipboard
    window.electronAPI.getClipboardText().then(text => {
        refineText.value = text;
    });

    refineBtn.addEventListener('click', async () => {
        const text = refineText.value.trim();
        const mode = refinementMode.value;

        if (!text) return;

        refineBtn.disabled = true;
        refineBtn.textContent = 'Refining...';

        const result = await window.electronAPI.refineText(text, mode);

        if (result.success) {
            outputText.textContent = result.data;
            copyBtn.disabled = false;
        } else {
            outputText.textContent = `Error: ${result.error}`;
        }

        refineBtn.disabled = false;
        refineBtn.textContent = 'Refine';
    });

    copyBtn.addEventListener('click', async () => {
        const text = outputText.textContent;
        if (!text) return;

        const result = await window.electronAPI.copyToClipboard(text);
        if (result.success) {
            window.electronAPI.closeQuickRefine();
        }
    });
}); 