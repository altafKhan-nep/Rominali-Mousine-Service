import { Router } from 'express';
import { protect, requireRole } from '../middleware/auth.js';
import * as ride from '../controllers/rideController.js';
import * as payment from '../controllers/paymentController.js';

const router = Router();

// All ride routes require auth
router.use(protect);

router.post('/', requireRole('passenger'), ride.createRide);
router.get('/available', requireRole('driver'), ride.availableRides);
router.get('/', ride.listRides);
router.get('/:id', ride.getRide);
router.patch('/:id', requireRole('passenger'), ride.editRide);
router.patch('/:id/accept', requireRole('driver'), ride.acceptRide);
router.patch('/:id/status', requireRole('driver'), ride.updateStatus);
router.patch('/:id/cancel', ride.cancelRide);
router.post('/:id/rate', requireRole('passenger'), ride.rateRide);
router.get('/:id/messages', ride.getMessages);
router.post('/:id/messages', ride.postMessage);
router.post('/:rideId/pay', requireRole('passenger'), payment.payRide);
router.post('/:rideId/payment-intent', requireRole('passenger'), payment.createIntent);

export default router;
