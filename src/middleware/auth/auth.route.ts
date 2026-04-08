import { Router } from 'express'
import * as authController from './auth.controller'

import { authMiddleware } from '../auth.middleware';

const router = Router()

router.post('/register', authController.register)
router.post('/login',    authController.login)
router.post('/refresh',  authController.refresh)
router.get('/me',        authMiddleware, authController.getMe)
router.get('/google', authController.startGoogleAuth)
router.get('/google/callback', authController.googleCallback)
router.get('/facebook', authController.startFacebookAuth)
router.get('/facebook/callback', authController.facebookCallback)

export default router