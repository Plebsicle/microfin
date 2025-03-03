import express from 'express'
import signupController from '../controllers/signupController';
import { tempFunction } from '../controllers/tempController';

const router = express.Router();

router.post('/api/signup',signupController);
router.get('/api/testing',tempFunction);


export default router;