import { Router } from 'express';
import { authenticate } from '../../middleware/authMiddleware';
import { validateUserRegistration, validateLogin } from '../../middleware/validationMiddleware';
import * as userController from './users.controllers';
import {
    createUser,
    getUsers,
    updateUser,
    deleteUser,
} from './users.controllers';
import { PrismaClient } from '@prisma/client';
import morgan from 'morgan';
import fs from 'fs';
import path from 'path';

const router = Router();
const prisma = new PrismaClient();

// Create a write stream (in append mode)
const logDirectory = path.join(__dirname, '../logs');
if (!fs.existsSync(logDirectory)) {
    fs.mkdirSync(logDirectory);
}
const accessLogStream = fs.createWriteStream(
    path.join(logDirectory, 'access.log'),
    { flags: 'a' }
);

// Define a custom format with timestamp
morgan.token('date', () => new Date().toISOString());
const format = '[:date] :method :url :status :res[content-length] - :response-time ms';

// Use morgan middleware for logging to file
router.use(morgan(format, { stream: accessLogStream }));

// (Optional) Also log to console in dev
if (process.env.NODE_ENV !== 'production') {
    router.use(morgan(format));
}

/**
 * @swagger
 * /api/users/login:
 *   post:
 *     summary: User login
 *     description: Authenticate user and return JWT token
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 example: Password123
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', validateLogin, userController.login);

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users (with filtering and pagination)
 *     description: Retrieve all users with optional filters and pagination.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         required: false
 *         description: Name to filter by (matches firstname or lastname)
 *       - in: query
 *         name: age
 *         schema:
 *           type: integer
 *         required: false
 *         description: Age to filter by
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *         required: false
 *         description: Role to filter by (case-insensitive)
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         required: false
 *         description: Filter by active status (true/false)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         required: false
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         required: false
 *         description: Number of users per page
 *     responses:
 *       200:
 *         description: List of users with pagination
 *       401:
 *         description: No token provided
 *       403:
 *         description: Invalid or expired token
 */
router.get('/', authenticate, userController.getUsers);
// router.get('/:id', authenticate, userController.getUserById); // protected

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Create new user
 *     description: Register a new user account
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - firstname
 *               - lastname
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 example: Password123
 *               firstname:
 *                 type: string
 *                 example: John
 *               lastname:
 *                 type: string
 *                 example: Doe
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Validation error
 */
router.post('/', validateUserRegistration, createUser);
// router.get('/:id', getUserById);    // ✅

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Update a user
 *     description: Update user details by ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               firstname:
 *                 type: string
 *                 example: John
 *               lastname:
 *                 type: string
 *                 example: Doe
 *     responses:
 *       200:
 *         description: User updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: No token provided
 *       403:
 *         description: Invalid or expired token
 *       404:
 *         description: User not found
 */
router.put('/:id', updateUser);

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Delete a user
 *     description: Delete a user by ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       401:
 *         description: No token provided
 *       403:
 *         description: Invalid or expired token
 *       404:
 *         description: User not found
 */
router.delete('/:id', deleteUser);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     description: Retrieve a user by their ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User found
 *       401:
 *         description: No token provided
 *       403:
 *         description: Invalid or expired token
 *       404:
 *         description: User not found
 */
// router.get('/:id', authenticate, userController.getUserById);

/**
 * @swagger
 * /api/users/filter:
 *   get:
 *     summary: Filter users by name
 *     description: Retrieve users whose first or last name contains the given name (case-insensitive), with pagination.
 *     tags: [Users]
 *     parameters:
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         required: false
 *         description: Name to filter by (matches firstname or lastname)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         required: false
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         required: false
 *         description: Number of users per page
 *     responses:
 *       200:
 *         description: List of filtered users
 *       400:
 *         description: Bad request
 */
router.get('/filter', require('./users.controllers').getUsersFiltered);

/**
 * @swagger
 * /api/users/logout:
 *   post:
 *     summary: Logout user
 *     description: Invalidate the current JWT token (logout)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out successfully
 *       401:
 *         description: No token provided
 *       403:
 *         description: Invalid or expired token
 */
router.post('/logout', authenticate, userController.logout);

export default router;
