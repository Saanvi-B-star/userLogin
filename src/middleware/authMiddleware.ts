import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface AuthRequest extends Request {
    user?: any;
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    let token: string | undefined;

    // Check Authorization header first
    const authHeader = req.headers.authorization;
    if (authHeader) {
        token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
        // Fallback to cookie
        token = req.cookies.token;
    }

    if (!token) {
        res.status(401).json({ error: 'No token provided' });
        return;
    }

    try {
        // Check if the token is valid in the database
        const tokenRecord = await prisma.tokens.findUnique({ where: { token } });
        if (!tokenRecord || !tokenRecord.isValid) {
            res.status(403).json({ error: 'Invalid or expired token' });
            return;
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET!);
        req.user = decoded;
        next();
    } catch (err) {
        res.status(403).json({ error: 'Invalid or expired token' });
    }
};