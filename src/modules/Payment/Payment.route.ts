import { Router } from 'express';
import express from 'express';
import { adminOnly, authMiddleware } from '../../middleware/auth.middleware';
import * as paymentController from './Payment.controller';

const router = Router();

//  Webhook must use raw body — register BEFORE express.json()
router.post(
	'/webhook',
	express.raw({ type: 'application/json' }),
	paymentController.handleWebhook
);

router.post('/init',          authMiddleware, paymentController.initPayment);
router.get('/verify',         authMiddleware, paymentController.verifySession);
router.get('/access/:ideaId', authMiddleware, paymentController.checkAccess);
router.get('/admin',          authMiddleware, adminOnly, paymentController.getAllPaymentsForAdmin);

export default router;