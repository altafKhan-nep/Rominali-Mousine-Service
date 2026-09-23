import { Router } from 'express';
import { asyncHandler } from '../middleware/error.js';
import { getContent } from '../services/contentService.js';

const router = Router();

// GET /api/content/:key — public CMS read; returns { key, value } (value null = defaults).
router.get(
  '/:key',
  asyncHandler(async (req, res) => res.json({ key: req.params.key, value: await getContent(req.params.key) }))
);

export default router;