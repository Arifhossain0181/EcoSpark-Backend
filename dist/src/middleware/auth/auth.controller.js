import { getme, loginUser, refreshAccessToken, registerUser } from './auth.service';
const getCookieValue = (cookieHeader, key) => {
    if (!cookieHeader)
        return undefined;
    const parts = cookieHeader.split(';').map((part) => part.trim());
    const cookie = parts.find((part) => part.startsWith(`${key}=`));
    if (!cookie)
        return undefined;
    return decodeURIComponent(cookie.split('=').slice(1).join('='));
};
const getErrorStatus = (error, fallback = 400) => {
    const maybeError = error;
    return maybeError?.statusCode ?? fallback;
};
const getErrorMessage = (error) => {
    if (error instanceof Error)
        return error.message;
    return 'Unexpected error';
};
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
        res.status(getErrorStatus(error, 400)).json({ error: getErrorMessage(error) });
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
        res.status(getErrorStatus(error, 400)).json({ error: getErrorMessage(error) });
    }
};
export const refresh = async (req, res) => {
    try {
        const fromCookie = getCookieValue(req.headers.cookie, 'refreshToken');
        const refreshToken = fromCookie || req.body?.refreshToken;
        const result = await refreshAccessToken(refreshToken);
        res.cookie('accessToken', result.accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 15 * 60 * 1000,
        });
        res.status(200).json({ message: 'Access token refreshed successfully', ...result });
    }
    catch (error) {
        res.status(getErrorStatus(error, 401)).json({ error: getErrorMessage(error) });
    }
};
export const getMe = async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await getme(userId);
        res.status(200).json({ message: "User details fetched successfully", ...result });
    }
    catch (error) {
        res.status(getErrorStatus(error, 400)).json({ error: getErrorMessage(error) });
    }
};
