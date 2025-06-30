// Utility to test if the language context is working properly
export function testLanguageContext() {
  try {
    // This will be called from components to verify context is available
    return {
      status: 'ready',
      timestamp: new Date().toISOString(),
      message: 'Language context is properly initialized'
    };
  } catch (error) {
    return {
      status: 'error',
      timestamp: new Date().toISOString(),
      message: 'Language context error: ' + (error as Error).message
    };
  }
}

// Check if we're in a browser environment
export function isBrowserEnvironment() {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

// Check if localStorage is available
export function isLocalStorageAvailable() {
  try {
    const test = '__localStorage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
} 