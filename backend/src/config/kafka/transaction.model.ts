
export interface WithdrawalTransaction{
    type: 'WITHDRAWAL';
    accountNumber: string;
    accountId: string;
    amount: number;
    userId : string
    transactionId : string
}

export interface DepositTransaction{
    type: 'DEPOSIT';
    accountNumber: string;
    accountId: string;
    amount: number;
    userId : string
    transactionId : string

}

export interface TransferTransaction{
    type: 'TRANSFER';
    senderAccountNumber: string;
    receiverAccountNumber: string;
    senderAccountId: string;
    receiverAccountId: string;
    amount: number;
    userId : string
    transactionId : string

}

export type Transaction = WithdrawalTransaction | DepositTransaction | TransferTransaction;

export type TransactionStatus = 'PENDING' | 'COMPLETED' | 'FAILED';