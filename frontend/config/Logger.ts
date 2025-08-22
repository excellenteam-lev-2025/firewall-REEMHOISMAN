import winston from 'winston';
import { ENV } from './env';

interface LoggerConfig {
    level: string;
    format: winston.Logform.Format;
    transports: winston.transport[];
    exitOnError: boolean;
}

class LoggerService {
    private static instance: LoggerService;
    private logger: winston.Logger;
    private isInitialized: boolean = false;
    private initializationError: Error | null = null;

    private constructor() {
        try {
            this.logger = this.createLogger();
            this.isInitialized = true;
            this.overrideConsole();
        } catch (error) {
            this.initializationError = error as Error;
            // Fallback to basic console logging if winston fails
            this.logger = this.createFallbackLogger();
            console.error('Logger initialization failed, using fallback:', error);
        }
    }

    public static getInstance(): LoggerService {
        if (!LoggerService.instance) {
            LoggerService.instance = new LoggerService();
        }
        return LoggerService.instance;
    }

    private createLogger(): winston.Logger {
        const config = this.getLoggerConfig();
        return winston.createLogger(config);
    }

    private createFallbackLogger(): winston.Logger {
        return winston.createLogger({
            level: 'info',
            format: winston.format.simple(),
            transports: [new winston.transports.Console()],
            exitOnError: false
        });
    }

    private getLoggerConfig(): LoggerConfig {
        const isDevelopment = ENV?.ENV_MODE === 'dev';
        const isTest = ENV?.ENV_MODE === 'test';
        
        const debugFormat = winston.format.combine(
            winston.format.timestamp({
                format: 'YYYY-MM-DD HH:mm:ss.SSS'
            }),
            winston.format.errors({ stack: true }),
            winston.format.metadata({
                fillExcept: ['message', 'level', 'timestamp']
            }),
            winston.format.json({
                space: isDevelopment ? 2 : 0
            })
        );

        const consoleFormat = winston.format.combine(
            winston.format.colorize(),
            winston.format.timestamp({
                format: 'HH:mm:ss'
            }),
            winston.format.printf(({ timestamp, level, message, ...meta }) => {
                const metaStr = Object.keys(meta).length ? `\n${JSON.stringify(meta, null, 2)}` : '';
                return `[${timestamp}] ${level}: ${message}${metaStr}`;
            })
        );

        const transports: winston.transport[] = [];

        if (isDevelopment) {
            transports.push(
                new winston.transports.Console({
                    format: consoleFormat,
                    level: 'debug'
                })
            );
        } else {
            const logDir = './logs';
            
            try {
                const fs = require('fs');
                if (!fs.existsSync(logDir)) {
                    fs.mkdirSync(logDir, { recursive: true });
                }

                transports.push(
                    new winston.transports.File({
                        filename: `${logDir}/application.log`,
                        format: debugFormat,
                        level: 'info',
                        maxsize: 5242880,
                        maxFiles: 5,
                        tailable: true
                    })
                );

                transports.push(
                    new winston.transports.File({
                        filename: `${logDir}/errors.log`,
                        format: debugFormat,
                        level: 'error',
                        maxsize: 5242880,
                        maxFiles: 5,
                        tailable: true
                    })
                );

                if (!isTest) {
                    transports.push(
                        new winston.transports.Console({
                            format: consoleFormat,
                            level: 'error'
                        })
                    );
                }
            } catch (error) {
                transports.push(
                    new winston.transports.Console({
                        format: consoleFormat,
                        level: 'info'
                    })
                );
            }
        }

        return {
            level: isDevelopment ? 'debug' : 'info',
            format: debugFormat,
            transports,
            exitOnError: false
        };
    }

    private overrideConsole(): void {
        if (ENV?.ENV_MODE === 'dev') {
            return;
        }

        const originalConsole = {
            log: console.log,
            error: console.error,
            warn: console.warn,
            info: console.info,
            debug: console.debug
        };

        (console as any)._original = originalConsole;

        console.log = (...args: any[]) => {
            this.logger.info(this.formatMessage(args));
        };

        console.error = (...args: any[]) => {
            this.logger.error(this.formatMessage(args));
        };

        console.warn = (...args: any[]) => {
            this.logger.warn(this.formatMessage(args));
        };

        console.info = (...args: any[]) => {
            this.logger.info(this.formatMessage(args));
        };

        console.debug = (...args: any[]) => {
            this.logger.debug(this.formatMessage(args));
        };
    }

    private formatMessage(args: any[]): string {
        return args.map(arg => {
            if (typeof arg === 'object' && arg !== null) {
                try {
                    return JSON.stringify(arg, null, 2);
                } catch (error) {
                    return String(arg);
                }
            }
            return String(arg);
        }).join(' ');
    }

    public log(level: string, message: string, meta?: any): void {
        if (!this.isInitialized) {
            return;
        }

        try {
            this.logger.log(level, message, meta);
        } catch (error) {
            const original = (console as any)._original;
            if (original) {
                original.error('Logger failed:', error);
                original[level] || original.log(message, meta);
            }
        }
    }

    public info(message: string, meta?: any): void {
        this.log('info', message, meta);
    }

    public error(message: string, meta?: any): void {
        this.log('error', message, meta);
    }

    public warn(message: string, meta?: any): void {
        this.log('warn', message, meta);
    }

    public debug(message: string, meta?: any): void {
        this.log('debug', message, meta);
    }

    public getInitializationStatus(): { initialized: boolean; error: Error | null } {
        return {
            initialized: this.isInitialized,
            error: this.initializationError
        };
    }

    public restoreConsole(): void {
        const original = (console as any)._original;
        if (original) {
            console.log = original.log;
            console.error = original.error;
            console.warn = original.warn;
            console.info = original.info;
            console.debug = original.debug;
        }
    }
}

const loggerService = LoggerService.getInstance();

export const Logger = {
    info: (message: string, meta?: any) => loggerService.info(message, meta),
    error: (message: string, meta?: any) => loggerService.error(message, meta),
    warn: (message: string, meta?: any) => loggerService.warn(message, meta),
    debug: (message: string, meta?: any) => loggerService.debug(message, meta),
    getStatus: () => loggerService.getInitializationStatus(),
    restoreConsole: () => loggerService.restoreConsole()
};

export default Logger;
