import { getme, loginUser, registerUser } from './auth.service';
export const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const result = await registerUser(name, email, password);
        res.cookie('accessToken', result.accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 15 * 60 * 1000, // 15 minutes
        });
        res.cookie('refreshToken', result.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });
        res.status(201).json({ message: "User registered successfully", ...result });
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
};
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const result = await loginUser(email, password);
        res.cookie('accessToken', result.accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 15 * 60 * 1000, // 15 minutes
        });
        res.cookie('refreshToken', result.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });
        res.status(200).json({ message: "User logged in successfully", ...result });
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
};
export const getMe = async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await getme(userId);
        res.status(200).json({ message: "User details fetched successfully", ...result });
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
};
