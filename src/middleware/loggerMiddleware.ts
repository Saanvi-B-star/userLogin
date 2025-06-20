import { Request, Response, NextFunction } from 'express';

export const logger = (req: Request, res: Response, next: NextFunction): void => {
    const timestamp = new Date().toISOString();
    const method = req.method;
    const url = req.url;
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');

    console.log(`[${timestamp}] ${method} ${url} - IP: ${ip} - User-Agent: ${userAgent}`);

    // Track response time
    const start = Date.now();

    res.on('finish', () => {
        const duration = Date.now() - start;
        const statusCode = res.statusCode;
        console.log(`[${timestamp}] ${method} ${url} - Status: ${statusCode} - Duration: ${duration}ms`);
    });

    next();
};

export const errorLogger = (err: Error, req: Request, res: Response, next: NextFunction): void => {
    const timestamp = new Date().toISOString();
    const method = req.method;
    const url = req.url;
    const errorMessage = err.message;
    const stack = err.stack;

    console.error(`[${timestamp}] ERROR - ${method} ${url}`);
    console.error(`Error: ${errorMessage}`);
    console.error(`Stack: ${stack}`);

    next(err);
};
