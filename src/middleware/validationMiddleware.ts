import { Request, Response, NextFunction } from 'express';

export const validateUserRegistration = (req: Request, res: Response, next: NextFunction): void => {
    const { email, password, firstname, lastname } = req.body;

    // Check if all required fields are present
    if (!email || !password || !firstname || !lastname) {
        res.status(400).json({
            error: 'All fields are required: email, password, firstname, lastname'
        });
        return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        res.status(400).json({
            error: 'Please provide a valid email address'
        });
        return;
    }

    // Password validation
    if (password.length < 6) {
        res.status(400).json({
            error: 'Password must be at least 6 characters long'
        });
        return;
    }

    // Check for at least one uppercase letter, one lowercase letter, and one number
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
    if (!passwordRegex.test(password)) {
        res.status(400).json({
            error: 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
        });
        return;
    }

    // Name validation
    if (firstname.trim().length < 2) {
        res.status(400).json({
            error: 'First name must be at least 2 characters long'
        });
        return;
    }

    if (lastname.trim().length < 2) {
        res.status(400).json({
            error: 'Last name must be at least 2 characters long'
        });
        return;
    }

    // If all validations pass, continue to the next middleware/controller
    next();
};

export const validateLogin = (req: Request, res: Response, next: NextFunction): void => {
    const { email, password } = req.body;

    // Check if email and password are provided
    if (!email || !password) {
        res.status(400).json({
            error: 'Email and password are required'
        });
        return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        res.status(400).json({
            error: 'Please provide a valid email address'
        });
        return;
    }

    // Password should not be empty
    if (password.trim().length === 0) {
        res.status(400).json({
            error: 'Password cannot be empty'
        });
        return;
    }

    next();
}; 