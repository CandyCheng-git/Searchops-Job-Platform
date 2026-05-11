import { Router, Request, Response } from 'express';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  res.json({
    data: {
      status: 'ok',
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId: (req as any).requestId,
    },
  });
});

export default router;
