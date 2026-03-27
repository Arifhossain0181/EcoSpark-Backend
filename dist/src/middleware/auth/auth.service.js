import { prisma } from '../../config/Prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const createHttpError = (message, statusCode) => {
    const err = new Error(message);
    err.statusCode = statusCode;
    return err;
};
const issueTokens = (payload) => {
    const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: '15m',
    });
    const refreshToken = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: '7d',
    });
    return { accessToken, refreshToken };
};
export const registerUser = async (name, email, password) => {
    if (!name?.trim()) {
        throw createHttpError('Name is required', 400);
    }
    if (!email?.trim() || !emailRegex.test(email)) {
        throw createHttpError('Valid email is required', 400);
    }
    if (!password || password.length < 6) {
        throw createHttpError('Password must be at least 6 characters long', 400);
    }
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
        throw createHttpError('User already exists', 409);
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
        data: {
            name: name.trim(),
            email: email.trim().toLowerCase(),
            password: hashedPassword,
            role: 'MEMBER' // Default role, adjust as needed
        }
    });
    const { accessToken, refreshToken } = issueTokens({ userId: user.id, role: user.role });
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
};
export const loginUser = async (email, password) => {
    if (!email?.trim() || !password) {
        throw createHttpError('Email and password are required', 400);
    }
    const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (!user) {
        throw createHttpError('Invalid credentials', 401);
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        throw createHttpError('Invalid credentials', 401);
    }
    const { accessToken, refreshToken } = issueTokens({ userId: user.id, role: user.role });
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
};
export const refreshAccessToken = async (refreshToken) => {
    if (!refreshToken) {
        throw createHttpError('Refresh token is required', 401);
    }
    let decoded;
    try {
        decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    }
    catch {
        throw createHttpError('Invalid or expired refresh token', 401);
    }
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user) {
        throw createHttpError('User not found', 404);
    }
    const accessToken = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '15m' });
    return {
        accessToken,
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
        },
    };
};
export const getme = async (userId) => {
    const user = await prisma.user.findUnique({ where: { id: userId },
        select: {
            id: true,
            name: true,
            email: true,
            role: true
        } });
    if (!user) {
        throw createHttpError('User not found', 404);
    }
    return user;
};
