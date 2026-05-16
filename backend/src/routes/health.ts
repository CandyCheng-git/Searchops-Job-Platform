import { Router, Request, Response } from 'express';
import { sendSuccess } from '../utils/apiResponse.js';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  sendSuccess(req, res, {
    status: 'ok',
  });
});

export default router;
