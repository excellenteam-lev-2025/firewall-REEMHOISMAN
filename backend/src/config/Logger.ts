import fs from "fs";
import path from "path";
import winston from "winston";
import util from "util";
import { ENV } from "./env.js";

class Logger {
    private static instance: Logger;
    private readonly logger: winston.Logger;

    private readonly originalConsole: Pick<typeof console, "log" | "info" | "warn" | "error" | "debug"> = {
        log: console.log,
        info: console.info,
        warn: console.warn,
        error: console.error,
        debug: console.debug
    };

    private patched = false;

    private constructor() {
        this.logger = this.initLogger();
        this.patchConsole();
    }

    public static getInstance(): Logger {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }
        return Logger.instance;
    }

    public getLogger(): winston.Logger {
        return this.logger;
    }

    private initLogger(): winston.Logger {
        const isDev = ENV.NODE_ENV === "dev";
        const transports: winston.transport[] = [];

        const devFormat = winston.format.combine(
            winston.format.colorize(),
            winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss.SSS" }),
            winston.format.printf(({ timestamp, level, message, ...meta }) => {
                const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : "";
                return `[${timestamp}] ${level}: ${message}${metaStr}`;
            })
        );

        const prodFormat = winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
        );

        if (isDev) {
            transports.push(new winston.transports.Console());
        } else {
            fs.mkdirSync(ENV.LOG_DIR, { recursive: true });
            transports.push(
                new winston.transports.File({
                    filename: path.join(ENV.LOG_DIR, ENV.LOG_FILE),
                    maxsize: 10 * 1024 * 1024,
                    maxFiles: 5
                })
            );
        }

        const logger = winston.createLogger({
            level: ENV.LOG_LEVEL,
            format: isDev ? devFormat : prodFormat,
            transports
        });

        logger.info(`Logger initialized (${ENV.NODE_ENV}) → ${isDev ? "console" : "file"}`);
        return logger;
    }

    private patchConsole(): void {
        if (this.patched) return;

        const lg = this.logger;
        const fmt = (args: any[]) => {

            try {
                return args.length === 1 ? this.normalizeArg(args[0]) : util.format(...args);
            } catch {
                return args.map(this.normalizeArg).join(" ");
            }
        };

        console.log = (...args: any[]) => lg.info(fmt(args));
        console.info = (...args: any[]) => lg.info(fmt(args));
        console.warn = (...args: any[]) => lg.warn(fmt(args));
        console.error = (...args: any[]) => lg.error(fmt(args));
        console.debug = (...args: any[]) => lg.debug(fmt(args));

        this.patched = true;
    }


    public restoreOriginalConsole(): void {
        if (!this.patched) return;
        console.log = this.originalConsole.log;
        console.info = this.originalConsole.info;
        console.warn = this.originalConsole.warn;
        console.error = this.originalConsole.error;
        console.debug = this.originalConsole.debug;
        this.patched = false;
    }

    private normalizeArg = (arg: any): string => {
        if (arg instanceof Error) {
            return arg.stack || `${arg.name}: ${arg.message}`;
        }
        if (typeof arg === "object") {
            try {
                return JSON.stringify(arg);
            } catch {
                return String(arg);
            }
        }
        return String(arg);
    };

    public info(message: string, ...meta: any[]): void {
        this.logger.info(message, ...meta);
    }
    public error(message: string, ...meta: any[]): void {
        this.logger.error(message, ...meta);
    }
    public warn(message: string, ...meta: any[]): void {
        this.logger.warn(message, ...meta);
    }
    public debug(message: string, ...meta: any[]): void {
        this.logger.debug(message, ...meta);
    }
}

export const logger = Logger.getInstance().getLogger();
