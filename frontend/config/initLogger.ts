import Logger from './Logger';

const status = Logger.getStatus();

if (!status.initialized && status.error) {
    const originalConsole = (console as any)._original;
    if (originalConsole) {
        originalConsole.error('Logger initialization failed:', status.error);
    } else {
        console.error('Logger initialization failed:', status.error);
    }
}

export default Logger;
