import {vi,it,describe,expect} from 'vitest'
import request from 'supertest'
import { hashPassword } from '../../utility/passwordHash';

vi.mock("../../database/db");
import {app} from '../../index'
import {pool} from '../../database/__mocks__/db'



describe('testing out signin controller',()=> {
    it('should sign user in',async ()=>{
         console.log('Pool mock:', pool);
         const password = await hashPassword("Hello1JpAsto");
        pool.query.mockResolvedValue({
            rows : [
                {
                    id : "1",
                    name : "Praval",
                    password
                }
            ]
        });

        const res = await request(app).post('/api/signin').send({
            email : "praval.parikh@gmail.com",
            password : "Hello1JpAsto"
        });

        expect(res.status).toBe(200);
    });
     it('should return 400 when user does not exist',async ()=>{
        // Mock empty result (no user found)
        pool.query.mockResolvedValue({
            rows : []
        });

        const res = await request(app).post('/api/signin').send({
            email : "nonexistent@gmail.com",
            password : "Hello1JpAsto"
        });

        expect(res.status).toBe(400);
        expect(res.body.message).toBe("Signup First");
    });
});


describe('testing out signup controller',()=> {
    it('should sign user in',async ()=>{
        console.log('Pool mock:', pool);
        pool.query.mockResolvedValue({
            rows : [
                {
                    id : "1"
                }
            ]
        });

        const res = await request(app).post('/api/signup').send({
            name : "Pravz",
            email : "praval.parikh@gmail.com",
            password : "Hello1JpAsto"
        });

        expect(res.status).toBe(200);
    });
    it('should return 400 when email is already in use',async ()=>{
        // Mock result with rowCount 0 (conflict occurred, no insertion)
        pool.query.mockResolvedValue({
            rows : [],
            rowCount : 0
        });

        const res = await request(app).post('/api/signup').send({
            name : "Pravz",
            email : "existing@gmail.com",
            password : "Hello1JpAsto"
        });

        expect(res.status).toBe(400);
        expect(res.body.message).toBe("Email in Use");
    });
});


