import { PrismaClient } from '@prisma/client';
import { CreateUserDTO, UpdateUserDTO } from './users.types';
import jwt, { SignOptions, Secret } from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export const loginUser = async (email: string, password: string) => {
    const user = await prisma.users.findUnique({ where: { email } });
    if (!user) throw new Error('User not found');

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) throw new Error('Invalid credentials');

    const signOptions: SignOptions = {
        expiresIn: parseInt(process.env.JWT_EXPIRES_IN || '3600') // 1 hour in seconds
    };

    const token = jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET as Secret,
        signOptions
    );

    return { token, user };
};

// ... existing code ...

export const createUser = async (userData: CreateUserDTO) => {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    return await prisma.users.create({
        data: {
            ...userData,
            password: hashedPassword
        }
    });
};

export const getAllUsers = async () => {
    return await prisma.users.findMany();
};

// Changed `id: number` to `id: string`
export const getUserById = async (id: string) => {
    return prisma.users.findUnique({ where: { id } });
};


export const updateUser = async (id: string, data: UpdateUserDTO) => {
    return prisma.users.update({ where: { id }, data });
};

export const deleteUser = async (id: string) => {
    return prisma.users.delete({ where: { id } });
};
