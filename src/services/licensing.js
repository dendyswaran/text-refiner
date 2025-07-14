let storeInstance = null;

/**
 * Initializes the electron-store instance asynchronously.
 * This is necessary because electron-store is an ES Module.
 * @returns {Promise<import('electron-store')>}
 */
async function getStore() {
    if (storeInstance) {
        return storeInstance;
    }
    // Dynamically import the Store class from the 'electron-store' module.
    const { default: Store } = await import('electron-store');
    const schema = {
        licenseKey: {
            type: 'string',
            default: '',
        },
    };
    storeInstance = new Store({ schema });
    return storeInstance;
}


const IS_DEV = process.env.NODE_ENV !== 'production';

/**
 * Checks if the provided license key is valid.
 * In a real app, this would involve a cryptographic check or a call to a license server.
 * For this example, we'll keep it simple.
 * @param {string} key
 * @returns {boolean}
 */
function isLicenseKeyValid(key) {
  if (!key) {
    return false;
  }
  // For demonstration, any key starting with "PRO-" is considered valid.
  return key.startsWith('PRO-');
}

/**
 * Checks if the user has an active Pro license.
 * In development, we can bypass this for easier testing.
 * @returns {boolean}
 */
async function isPro() {
  if (IS_DEV) {
    // In development, you can uncomment the line below to simulate being a pro user.
    // return true;
  }
  const store = await getStore();
  const licenseKey = store.get('licenseKey');
  return isLicenseKeyValid(licenseKey);
}

/**
 * Attempts to activate a new license key.
 * @param {string} key
 * @returns {Promise<{success: boolean, message: string}>}
 */
async function activateLicense(key) {
  if (isLicenseKeyValid(key)) {
    const store = await getStore();
    store.set('licenseKey', key);
    return { success: true, message: 'License activated successfully!' };
  }
  return { success: false, message: 'Invalid license key.' };
}

/**
 * Deactivates the current license.
 */
async function deactivateLicense() {
  const store = await getStore();
  store.set('licenseKey', '');
}

/**
 * Gets the stored license key.
 * @returns {Promise<string>}
 */
async function getLicenseKey() {
  const store = await getStore();
  return store.get('licenseKey');
}

module.exports = {
  isPro,
  activateLicense,
  deactivateLicense,
  getLicenseKey,
}; 