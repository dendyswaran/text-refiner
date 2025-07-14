const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Text refinement
  refineText: (text, mode) => ipcRenderer.invoke('refine-text', { text, mode }),
  
  // Licensing
  isPro: () => ipcRenderer.invoke('is-pro'),
  activateLicense: (key) => ipcRenderer.invoke('activate-license', key),

  // Clipboard operations
  copyToClipboard: (text) => ipcRenderer.invoke('copy-to-clipboard', text),
  getClipboardText: () => ipcRenderer.invoke('get-clipboard-text'),

  // Window management
  closeQuickRefine: () => ipcRenderer.send('close-quick-refine'),

  // Settings
  getSettings: () => ipcRenderer.invoke('get-settings'),
  getApiKey: (provider) => ipcRenderer.invoke('get-api-key', provider),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
  fetchOpenRouterModels: (apiKey) => ipcRenderer.invoke('fetch-openrouter-models', apiKey),

  // Menu event listeners
  onMenuNew: (callback) => ipcRenderer.on('menu-new', callback),
  onMenuSettings: (callback) => ipcRenderer.on('menu-settings', callback),
  
  // Context menu
  showContextMenu: () => ipcRenderer.send('show-context-menu'),
  onContextMenuCommand: (callback) => ipcRenderer.on('context-menu-command', (event, command) => callback(command)),

  // Remove listeners
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel)
});

// Expose node process info (useful for debugging)
contextBridge.exposeInMainWorld('nodeAPI', {
  platform: process.platform,
  version: process.version
});