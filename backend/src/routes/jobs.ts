import { NextFunction, Request, Response, Router } from 'express';
import { JobService } from '../services/jobService.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { parseJobQuery } from '../validators/jobQuerySchema.js';

const router = Router();
const jobService = new JobService();

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = parseJobQuery(req.query);
    const data = await jobService.searchJobs(query);

    sendSuccess(req, res, data);
  } catch (error) {
    next(error);
  }
});

router.get('/:slug', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await jobService.getJobBySlug(req.params.slug);

    sendSuccess(req, res, data);
  } catch (error) {
    next(error);
  }
});

export default router;
