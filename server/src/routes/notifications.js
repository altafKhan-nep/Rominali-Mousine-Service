import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import * as notifications from '../controllers/notificationController.js';

const router = Router();

router.use(protect);

router.get('/', notifications.list);
router.get('/unread-count', notifications.count);
router.patch('/read-all', notifications.markAllRead);
router.patch('/:id/read', notifications.markRead);
router.post('/subscribe', notifications.subscribe);
router.post('/unsubscribe', notifications.unsubscribe);

export default router;
