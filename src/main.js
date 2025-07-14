/**
 * @file Main process for the Text Refiner AI application.
 * Handles window management, global shortcuts, IPC, and settings.
 * @author Dendy
 * @version 1.2.0
 */

const { app, BrowserWindow, ipcMain, Menu, dialog, shell, globalShortcut, clipboard } = require('electron');
const path = require('path');
const { isPro, activateLicense } = require('./services/licensing');
const llm = require('./services/llm');
require('dotenv').config();

let store;
let keytar; // An empty variable, waiting for the module.

const SERVICE_NAME = 'WindowsTextRefiner';

/**
 * Initializes essential components like electron-store and keytar.
 * This is done asynchronously to handle the dynamic import of ES modules.
 */
async function initialize() {
    const { default: Store } = await import('electron-store');
    store = new Store({
        defaults: {
            provider: 'lm-studio',
            lmStudioUrl: 'http://localhost:1234/v1',
            openRouterUrl: 'https://openrouter.ai/api/v1',
            openRouterModel: 'openai/gpt-4o-mini',
        }
    });

    // Dynamically import keytar and assign the module to the global 'keytar' variable.
    keytar = await import('keytar');
}

// Global references to prevent garbage collection.
let mainWindow;
let quickRefineWindow;

// --- Window Creation ---

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, '..', 'assets', 'icon.png'),
    show: false,
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));
  mainWindow.once('ready-to-show', () => mainWindow.show());
  mainWindow.on('closed', () => { mainWindow = null; });
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

function createQuickRefineWindow() {
    if (quickRefineWindow) {
        quickRefineWindow.focus();
        return;
    }
    quickRefineWindow = new BrowserWindow({
        width: 500,
        height: 350,
        frame: false,
        resizable: false,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
        },
        alwaysOnTop: true,
        show: false,
    });
    quickRefineWindow.loadFile(path.join(__dirname, 'renderer', 'quick-refine.html'));
    quickRefineWindow.once('ready-to-show', () => quickRefineWindow.show());
    quickRefineWindow.on('closed', () => { quickRefineWindow = null; });
}

// --- Menu ---

function createMenu() {
    const template = [
        {
            label: 'File',
            submenu: [
                { label: 'Settings', click: () => mainWindow.webContents.send('menu-settings') },
                { type: 'separator' },
                { label: 'Quit', accelerator: 'CmdOrCtrl+Q', click: () => app.quit() }
            ]
        },
        {
            label: 'Edit',
            submenu: [
                { role: 'undo' }, { role: 'redo' }, { type: 'separator' },
                { role: 'cut' }, { role: 'copy' }, { role: 'paste' },
            ]
        },
        {
            label: 'View',
            submenu: [
                { role: 'reload' }, { role: 'forceReload' }, { role: 'toggleDevTools' }
            ]
        }
    ];
    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}


// --- App Lifecycle ---

app.on('ready', async () => {
    await initialize();
    createWindow();
    createMenu();

    globalShortcut.register('Ctrl+Shift+R', async () => {
        if (await isPro()) {
            createQuickRefineWindow();
        } else {
            dialog.showMessageBox({
                type: 'info',
                title: 'Pro Feature',
                message: 'The Global Quick Refine shortcut is a Pro feature.',
                detail: 'Please upgrade to a Pro license to use this feature.',
                buttons: ['OK']
            });
        }
    });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// --- IPC Handlers ---

ipcMain.handle('is-pro', async () => await isPro());
ipcMain.handle('activate-license', async (event, key) => await activateLicense(key));

ipcMain.handle('refine-text', async (event, { text, mode }) => {
    try {
        const provider = store.get('provider');
        
        let apiKey = null;
        if (keytar) {
            apiKey = await keytar.getPassword(SERVICE_NAME, provider);
        }

        const settings = {
            provider,
            apiKey,
            lmStudioUrl: store.get('lmStudioUrl'),
            openRouterUrl: store.get('openRouterUrl'),
            openRouterModel: store.get('openRouterModel'),
        };

        const refinedText = await llm.refineText(text, mode, settings);
        return { success: true, data: refinedText };
    } catch (error) {
        console.error('Failed to refine text:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('fetch-openrouter-models', async (event, apiKey) => {
    try {
        const models = await llm.fetchOpenRouterModels(apiKey);
        return { success: true, data: models };
    } catch (error) {
        console.error('Failed to fetch OpenRouter models:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('get-settings', () => {
    return {
        provider: store.get('provider'),
        lmStudioUrl: store.get('lmStudioUrl'),
        openRouterUrl: store.get('openRouterUrl'),
        openRouterModel: store.get('openRouterModel'),
    };
});

ipcMain.handle('get-api-key', async (event, provider) => {
    if (!keytar) return null;
    return await keytar.getPassword(SERVICE_NAME, provider);
});

ipcMain.handle('save-settings', async (event, settings) => {
    try {
      
        store.set('provider', settings.provider);
        store.set('lmStudioUrl', settings.lmStudioUrl);
        store.set('openRouterUrl', settings.openRouterUrl);
        store.set('openRouterModel', settings.openRouterModel);

        if (!keytar) {
          keytar = await import('keytar')
        }

        if (settings.apiKey && keytar) {
            await keytar.default.setPassword(SERVICE_NAME, settings.provider, settings.apiKey);
        }

        return { success: true };
    } catch (error) {
        console.error('Failed to save settings:', error);
        return { success: false, error: error.message };
    }
});