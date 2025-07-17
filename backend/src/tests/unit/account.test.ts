
import {vi,it,describe,expect} from 'vitest'
import request from 'supertest'

vi.mock("../../database/db");

vi.mock("../../utility/accountNumberGenerator");

vi.mock("../../config/redis/cache.service");

import {app} from '../../index'
import {pool} from '../../database/__mocks__/db'
import { updateAccountCache } from '../../config/redis/__mocks__/cache.service';
import { generateAccountNumber } from '../../utility/__mocks__/accountGeneration';


describe('testing account controller', () => {
    
    it('should create new account successfully for logged in user', async () => {

        (generateAccountNumber as any).mockReturnValue("ACC123456789");

        pool.query.mockResolvedValue({
            rows: [
                {
                    accountNumber: "ACC123456789",
                    balance: 0
                }
            ]
        });


        (updateAccountCache as any).mockResolvedValue(undefined);

        const res = await request(app)
            .get('/api/accountGeneration')
            .send({}).set('Cookie', ['connect.sid=mock-session-id']);

        expect(res.status).toBe(200);
        expect(res.body.message).toBe("New Account Created Successfully");
        expect(res.body.accountNumber).toBe("ACC123456789");
        expect(res.body.balance).toBe(0);

        expect(pool.query).toHaveBeenCalledWith(
            'INSERT INTO "Account" (accountNumber, userId) VALUES ($1, $2) RETURNING accountNumber, balance',
            ["ACC123456789", expect.any(String)]
        );

        expect(updateAccountCache).toHaveBeenCalledWith("ACC123456789");
    });

    it('should return 401 when user is not logged in', async () => {

        (generateAccountNumber as any).mockReturnValue("ACC123456789");

        const res = await request(app)
            .get('/api/accountGeneration')
            .send({}).set('Cookie', ['connect.sid=mock-session-id']);

        expect(res.status).toBe(401);
        expect(res.body.message).toBe("User not logged in");
        expect(pool.query).not.toHaveBeenCalled();
        
        expect(generateAccountNumber).not.toHaveBeenCalled();

        expect(updateAccountCache).not.toHaveBeenCalled();
    });
});


