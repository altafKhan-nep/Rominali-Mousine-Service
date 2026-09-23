import { Router } from 'express';
import { protect, requireRole } from '../middleware/auth.js';
import * as admin from '../controllers/adminController.js';

const router = Router();

router.use(protect, requireRole('admin'));

router.get('/analytics', admin.analytics);
router.get('/rides', admin.rides);
router.patch('/rides/:id/driver', admin.assignDriver);
router.get('/drivers', admin.drivers);
router.patch('/drivers/:id', admin.toggleDriver);
router.get('/users', admin.users);
router.patch('/users/:id/suspend', admin.suspendUser);
router.patch('/users/:id/unsuspend', admin.unsuspendUser);
router.delete('/users/:id', admin.deleteUser);
router.get('/payments', admin.payments);
router.get('/settings', admin.settings);
router.patch('/settings', admin.updateAppSettings);

export default router;
