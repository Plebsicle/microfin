"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const accountController_1 = __importDefault(require("../controllers/accountController"));
const transactionController_1 = require("../controllers/transactionController");
const router = express_1.default.Router();
router.get('/api/accountGeneration', accountController_1.default);
router.post('/api/deposit', transactionController_1.depositController);
router.post('/api/transfer', transactionController_1.transferController);
router.post('/api/withdraw', transactionController_1.withdrawController);
router.post('/api/moneyTransfer');
exports.default = router;
