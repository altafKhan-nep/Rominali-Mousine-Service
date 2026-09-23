import { Router } from 'express';
import { protect, requireRole } from '../middleware/auth.js';
import * as payment from '../controllers/paymentController.js';

const router = Router();

router.use(protect);

router.get('/', payment.listPayments);
router.get('/requests', payment.listRefundRequests);
router.get('/:id', payment.getPayment);
// Passenger asks for refund — admin approves via /requests/:requestId/decision
router.post('/:id/request-refund', payment.requestRefund);
// Admin only: direct refund + decide on requests
router.post('/:id/refund', requireRole('admin','super_admin','finance'), payment.refundPayment);
router.post('/requests/:requestId/decision', requireRole('admin','super_admin','finance'), payment.decideRefund);

export default router;
