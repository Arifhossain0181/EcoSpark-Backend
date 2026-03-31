import { Router } from 'express';
import { adminOnly, authMiddleware } from '../../middleware/auth.middleware';
import * as paymentController from './Payment.controller';

const router = Router();

router.post('/init',          authMiddleware, paymentController.initPayment);
router.get('/verify',         authMiddleware, paymentController.verifySession);
router.get('/access/:ideaId', authMiddleware, paymentController.checkAccess);
router.get('/my-ideas',       authMiddleware, paymentController.getMyPurchasedIdeas);
router.get('/admin',          authMiddleware, adminOnly, paymentController.getAllPaymentsForAdmin);

export default router;