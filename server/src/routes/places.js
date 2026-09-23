import { Router } from 'express';
import * as place from '../controllers/placeController.js';

const router = Router();

router.get('/search', place.search);
router.get('/reverse', place.reverse);

export default router;