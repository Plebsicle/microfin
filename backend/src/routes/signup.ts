import express from 'express'
import signupController from '../controllers/signupController';
import { tempFunction } from '../controllers/tempController';
import signinController from '../controllers/signinController';

const router = express.Router();

router.post('/api/signup',signupController);
router.get('/api/testing',tempFunction);
router.post("/api/signin",signinController);


export default router;