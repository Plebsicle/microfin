import express from 'express'
import accountController from '../controllers/accountController';
import { depositController, transferController, withdrawController } from '../controllers/transactionController';


const router = express.Router();


router.get('/api/accountGeneration',accountController);
router.post('/api/deposit',depositController);
router.post('/api/transfer',transferController);
router.post('/api/withdraw',withdrawController);
router.post('/api/moneyTransfer')

export default router;