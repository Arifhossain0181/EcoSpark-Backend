import { Request, Response } from 'express';
import axios from 'axios';
import {
    getme,
    loginOrRegisterSocialUser,
    loginUser,
    refreshAccessToken,
    registerUser,
} from './auth.service';

const getCookieValue = (cookieHeader: string | undefined, key: string): string | undefined => {
    if (!cookieHeader) return undefined;

    const parts = cookieHeader.split(';').map((part) => part.trim());
    const cookie = parts.find((part) => part.startsWith(`${key}=`));
    if (!cookie) return undefined;

    return decodeURIComponent(cookie.split('=').slice(1).join('='));
};

const getErrorStatus = (error: unknown, fallback = 400) => {
    const maybeError = error as Error & { statusCode?: number };
    return maybeError?.statusCode ?? fallback;
};

const getErrorMessage = (error: unknown) => {
    if (error instanceof Error) return error.message;
    return 'Unexpected error';
};

const getClientBaseUrl = () => process.env.CLIENT_URL || 'http://localhost:3000';

const getServerBaseUrl = (req: Request) => {
    if (process.env.SERVER_PUBLIC_URL) return process.env.SERVER_PUBLIC_URL;
    return `${req.protocol}://${req.get('host')}`;
};

const getRedirectUri = (req: Request, provider: 'google' | 'facebook') => {
    return `${getServerBaseUrl(req)}/api/auth/${provider}/callback`;
};

const setAuthCookies = (
    res: Response,
    accessToken: string,
    refreshToken: string
) => {
    res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 15 * 60 * 1000,
    });

    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });
};

const redirectWithAuthPayload = (
    res: Response,
    payload: {
        accessToken: string;
        refreshToken: string;
        user: { id: string; name: string; email: string; role: string };
    }
) => {
    setAuthCookies(res, payload.accessToken, payload.refreshToken);

    const encodedUser = Buffer.from(JSON.stringify(payload.user)).toString('base64url');
    const callbackUrl = `${getClientBaseUrl()}/auth/social-callback` +
        `?accessToken=${encodeURIComponent(payload.accessToken)}` +
        `&refreshToken=${encodeURIComponent(payload.refreshToken)}` +
        `&user=${encodeURIComponent(encodedUser)}`;

    return res.redirect(callbackUrl);
};

const redirectWithAuthError = (res: Response, message: string) => {
    const callbackUrl = `${getClientBaseUrl()}/auth/social-callback?error=${encodeURIComponent(message)}`;
    return res.redirect(callbackUrl);
};

export const register = async (req: Request, res: Response) => {
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
    } catch (error) {
        res.status(getErrorStatus(error, 400)).json({ error: getErrorMessage(error) });
    }
}

export const login = async (req: Request, res: Response) => {
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
    } catch (error) {
        res.status(getErrorStatus(error, 400)).json({ error: getErrorMessage(error) });
    }
}

export const refresh = async (req: Request, res: Response) => {
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
    } catch (error) {
        res.status(getErrorStatus(error, 401)).json({ error: getErrorMessage(error) });
    }
}

export const getMe = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const result = await getme(userId);
        res.status(200).json({ message: "User details fetched successfully", ...result });
    } catch (error) {
        res.status(getErrorStatus(error, 400)).json({ error: getErrorMessage(error) });
    }
}

export const startGoogleAuth = async (req: Request, res: Response) => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = getRedirectUri(req, 'google');

    if (!clientId) {
        return res.status(500).json({ error: 'Google OAuth is not configured' });
    }

    const googleAuthUrl =
        'https://accounts.google.com/o/oauth2/v2/auth' +
        `?client_id=${encodeURIComponent(clientId)}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        '&response_type=code' +
        '&scope=openid%20email%20profile' +
        '&prompt=select_account';

    return res.redirect(googleAuthUrl);
};

export const googleCallback = async (req: Request, res: Response) => {
    try {
        const code = req.query.code as string | undefined;
        if (!code) {
            return redirectWithAuthError(res, 'Missing Google authorization code');
        }

        const clientId = process.env.GOOGLE_CLIENT_ID;
        const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
        const redirectUri = getRedirectUri(req, 'google');

        if (!clientId || !clientSecret) {
            return redirectWithAuthError(res, 'Google OAuth is not configured');
        }

        const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
            code,
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uri: redirectUri,
            grant_type: 'authorization_code',
        });

        const idToken = tokenResponse.data?.id_token as string | undefined;
        const accessToken = tokenResponse.data?.access_token as string | undefined;

        let googleProfile: { id?: string; email?: string; name?: string } = {};

        if (idToken) {
            const profileResponse = await axios.get('https://oauth2.googleapis.com/tokeninfo', {
                params: { id_token: idToken },
            });
            googleProfile = {
                id: profileResponse.data?.sub,
                email: profileResponse.data?.email,
                name: profileResponse.data?.name,
            };
        } else if (accessToken) {
            const profileResponse = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
                headers: { Authorization: `Bearer ${accessToken}` },
            });
            googleProfile = {
                id: profileResponse.data?.id,
                email: profileResponse.data?.email,
                name: profileResponse.data?.name,
            };
        }

        if (!googleProfile.id && !googleProfile.email) {
            return redirectWithAuthError(res, 'Unable to fetch Google profile');
        }

        const payload = await loginOrRegisterSocialUser({
            provider: 'google',
            providerId: googleProfile.id || googleProfile.email || 'unknown',
            email: googleProfile.email,
            name: googleProfile.name,
        });

        return redirectWithAuthPayload(res, payload);
    } catch (error) {
        return redirectWithAuthError(res, getErrorMessage(error));
    }
};

export const startFacebookAuth = async (req: Request, res: Response) => {
    const clientId = process.env.FACEBOOK_CLIENT_ID;
    const redirectUri = getRedirectUri(req, 'facebook');

    if (!clientId) {
        return res.status(500).json({ error: 'Facebook OAuth is not configured' });
    }

    const facebookAuthUrl =
        'https://www.facebook.com/v20.0/dialog/oauth' +
        `?client_id=${encodeURIComponent(clientId)}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        '&response_type=code' +
        '&scope=email,public_profile';

    return res.redirect(facebookAuthUrl);
};

export const facebookCallback = async (req: Request, res: Response) => {
    try {
        const code = req.query.code as string | undefined;
        if (!code) {
            return redirectWithAuthError(res, 'Missing Facebook authorization code');
        }

        const clientId = process.env.FACEBOOK_CLIENT_ID;
        const clientSecret = process.env.FACEBOOK_CLIENT_SECRET;
        const redirectUri = getRedirectUri(req, 'facebook');

        if (!clientId || !clientSecret) {
            return redirectWithAuthError(res, 'Facebook OAuth is not configured');
        }

        const tokenResponse = await axios.get('https://graph.facebook.com/v20.0/oauth/access_token', {
            params: {
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uri: redirectUri,
                code,
            },
        });

        const providerAccessToken = tokenResponse.data?.access_token as string | undefined;
        if (!providerAccessToken) {
            return redirectWithAuthError(res, 'Unable to fetch Facebook access token');
        }

        const profileResponse = await axios.get('https://graph.facebook.com/me', {
            params: {
                fields: 'id,name,email',
                access_token: providerAccessToken,
            },
        });

        const profile = {
            id: profileResponse.data?.id as string | undefined,
            name: profileResponse.data?.name as string | undefined,
            email: profileResponse.data?.email as string | undefined,
        };

        if (!profile.id && !profile.email) {
            return redirectWithAuthError(res, 'Unable to fetch Facebook profile');
        }

        const payload = await loginOrRegisterSocialUser({
            provider: 'facebook',
            providerId: profile.id || profile.email || 'unknown',
            email: profile.email,
            name: profile.name,
        });

        return redirectWithAuthPayload(res, payload);
    } catch (error) {
        return redirectWithAuthError(res, getErrorMessage(error));
    }
};