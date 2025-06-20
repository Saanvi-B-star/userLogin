import { Request, Response } from 'express';
import * as userService from './users.services';
import { PrismaClient } from '@prisma/client';
import cookieParser from 'cookie-parser';
import { NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest } from '../../middleware/authMiddleware';
import cron from 'node-cron';

// Initialize Prisma client for database operations
const prisma = new PrismaClient();

/**
 * Create a new user
 * Handles POST /api/users
 */
export const createUser = async (req: Request, res: Response) => {
    try {
        const user = await userService.createUser(req.body);
        res.status(201).json(user);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * Get all users with dynamic filtering and pagination
 * Handles GET /api/users
 * Supports query params: name, age, role, isActive, page, limit
 */
export const getUsers = async (req: Request, res: Response) => {
    const { name, age, role, isActive, page = 1, limit = 10 } = req.query;

    const pageNumber = parseInt(page as string, 10) || 1;
    const pageSize = parseInt(limit as string, 10) || 10;
    const skip = (pageNumber - 1) * pageSize;

    // Build the where object dynamically based on provided filters
    const where: any = {};

    if (name) {
        where.OR = [
            { firstname: { contains: String(name), mode: 'insensitive' as const } },
            { lastname: { contains: String(name), mode: 'insensitive' as const } }
        ];
    }
    if (age) {
        where.age = Number(age);
    }
    if (role) {
        where.role = { equals: String(role), mode: 'insensitive' as const };
    }
    if (isActive !== undefined) {
        where.isActive = String(isActive).toLowerCase() === 'true';
    }

    // Fetch paginated and filtered users, and total count
    const [users, total] = await Promise.all([
        prisma.users.findMany({
            where,
            skip,
            take: pageSize,
        }),
        prisma.users.count({ where }),
    ]);

    res.json({
        users,
        total,
        page: pageNumber,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
    });
};

/**
 * Get users with filtering and pagination (alternative endpoint)
 * Handles GET /api/users/filter
 */
export const getUsersFiltered = async (req: Request, res: Response) => {
    const { name, age, role, isActive, page = 1, limit = 10 } = req.query;

    const pageNumber = parseInt(page as string, 10) || 1;
    const pageSize = parseInt(limit as string, 10) || 10;
    const skip = (pageNumber - 1) * pageSize;

    // Build the where object dynamically
    const where: any = {};

    if (name) {
        where.OR = [
            { firstname: { contains: String(name), mode: 'insensitive' as const } },
            { lastname: { contains: String(name), mode: 'insensitive' as const } }
        ];
    }
    if (age) {
        where.age = Number(age);
    }
    if (role) {
        where.role = { equals: String(role), mode: 'insensitive' as const };
    }
    if (isActive !== undefined) {
        where.isActive = String(isActive).toLowerCase() === 'true';
    }

    const [users, total] = await Promise.all([
        prisma.users.findMany({
            where,
            skip,
            take: pageSize,
        }),
        prisma.users.count({ where }),
    ]);

    res.json({
        users,
        total,
        page: pageNumber,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
    });
};

/**
 * Get a user by ID
 * Handles GET /api/users/:id
 */
export const getUserById = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;
        const user = await userService.getUserById(id);
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(user);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * Update a user by ID
 * Handles PUT /api/users/:id
 */
export const updateUser = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;
        const user = await userService.updateUser(id, req.body);
        res.json(user);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * Delete a user by ID
 * Handles DELETE /api/users/:id
 */
export const deleteUser = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;
        await userService.deleteUser(id);
        res.json({ message: 'User deleted successfully' });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * User login
 * Handles POST /api/users/login
 * Stores JWT token in DB and as a cookie
 */
export const login = async (req: Request, res: Response) => {
    const { email, password } = req.body;
    try {
        const result = await userService.loginUser(email, password);
        // Store the token in the database
        await prisma.tokens.create({
            data: {
                token: result.token,
                userId: result.user.id,
                isValid: true,
            }
        });
        // Set the token as an HTTP-only cookie
        res.cookie('token', result.token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 3600 * 1000, // 1 hour
            sameSite: 'lax'
        });
        res.json(result);
    } catch (err: any) {
        res.status(401).json({ error: err.message });
    }
};

/**
 * User logout
 * Handles POST /api/users/logout
 * Invalidates the JWT token in DB and clears the cookie
 */
export const logout = async (req: Request, res: Response): Promise<void> => {
    const authHeader = req.headers.authorization;
    let token: string | undefined;
    if (authHeader) {
        token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
        token = req.cookies.token;
    }
    if (!token) {
        res.status(401).json({ error: 'No token provided' });
        return;
    }
    // Invalidate the token in the database
    await prisma.tokens.updateMany({
        where: { token, isValid: true },
        data: { isValid: false }
    });
    // Clear the token cookie
    res.clearCookie('token');
    res.json({ message: 'Logged out successfully' });
};

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

// Schedule a task to run every day at midnight
cron.schedule('0 0 * * *', async () => {
    console.log(`[${new Date().toISOString()}] Running scheduled token cleanup...`);
    // Delete tokens that are invalid or expired (older than 1 hour)
    const oneHourAgo = new Date(Date.now() - 3600 * 1000);
    await prisma.tokens.deleteMany({
        where: {
            OR: [
                { isValid: false },
                { createdAt: { lt: oneHourAgo } }
            ]
        }
    });
    console.log('Token cleanup complete.');
});

