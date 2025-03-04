import {v4 as uuidv4} from 'uuid'

function generateAccountNumber(): string {
    const numericAccountNumber = uuidv4().replace(/\D/g, '').slice(0,12);
    return numericAccountNumber;
}

export default generateAccountNumber