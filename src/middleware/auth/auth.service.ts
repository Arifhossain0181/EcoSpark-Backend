

import { prisma } from '../../config/Prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

type Role = 'MEMBER' | 'ADMIN';

export const registerUser = async (name: string, email: string, password: string) => {
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
        throw new Error("User already exists");
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
        data: {
            name,
            email,
            password: hashedPassword,
            role: 'MEMBER' // Default role, adjust as needed
        }
    });

    const accessToken = jwt.sign(
        { userId: user.id, role: user.role },
        process.env.JWT_SECRET as string,
        { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
        { userId: user.id, role: user.role },
        process.env.JWT_SECRET as string,
        { expiresIn: '7d' }
    );

    return {
        accessToken,
        refreshToken,
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
        },
    };
}
export const loginUser = async (email: string, password: string) => {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        throw new Error("Invalid credentials");
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        throw new Error("Invalid credentials");
    }

    const accessToken = jwt.sign(
        { userId: user.id, role: user.role },
        process.env.JWT_SECRET as string,
        { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
        { userId: user.id, role: user.role },
        process.env.JWT_SECRET as string,
        { expiresIn: '7d' }
    );

    return {
        accessToken,
        refreshToken,
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
        },
    };
}
export const getme = async (userId: string) => {
    const user = await prisma.user.findUnique({ where: { id: userId },
        select: {
            id: true,
            name: true,
            email: true,
            role: true
        }});
    if (!user) {
        throw new Error("User not found");
    }
    return user;
}