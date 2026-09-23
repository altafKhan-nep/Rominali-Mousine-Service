import { Router } from 'express';
import { protect, requireRole } from '../middleware/auth.js';
import * as admin from '../controllers/adminController.js';

const router = Router();

router.use(protect, requireRole('admin'));

router.get('/analytics', admin.analytics);
router.get('/rides', admin.rides);
router.patch('/rides/:id/driver', admin.assignDriver);
router.patch('/rides/:id', admin.updateRide);
router.get('/drivers', admin.drivers);
router.patch('/drivers/:id', admin.toggleDriver);
router.get('/users', admin.users);
router.post('/users', admin.createUser);
router.patch('/users/:id/suspend', admin.suspendUser);
router.patch('/users/:id/unsuspend', admin.unsuspendUser);
router.patch('/users/:id', admin.updateUser);
router.delete('/users/:id', admin.deleteUser);
router.get('/payments', admin.payments);
router.get('/content', admin.listContent);
router.patch('/content', admin.updateContent);
router.get('/settings', admin.settings);
router.patch('/settings', admin.updateAppSettings);

export default router;
