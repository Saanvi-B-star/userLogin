import express from 'express';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import userRoutes from './modules/users/users.routes';
import { logger } from './middleware/loggerMiddleware';
import swaggerSpec from './docs/api/swagger';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import fs from 'fs';
import path from 'path';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Middleware to parse cookies
app.use(cookieParser());

// Set up logging to a file with timestamps using morgan
const logDirectory = path.join(__dirname, '../logs');
if (!fs.existsSync(logDirectory)) {
    fs.mkdirSync(logDirectory);
}
const accessLogStream = fs.createWriteStream(
    path.join(logDirectory, 'access.log'),
    { flags: 'a' }
);
// Custom log format with ISO timestamp
morgan.token('date', () => new Date().toISOString());
const format = '[:date] :method :url :status :res[content-length] - :response-time ms';
app.use(morgan(format, { stream: accessLogStream }));
// Also log to console in development
if (process.env.NODE_ENV !== 'production') {
    app.use(morgan(format));
}

// Custom logger middleware (optional, for extra logs)
app.use(logger);

// Root route for health check or welcome message
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to the User Login API' });
});

// Swagger UI for API documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Mount user-related routes under /api/users
app.use('/api/users', userRoutes);

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`API Documentation available at http://localhost:${PORT}/api-docs`);
});
