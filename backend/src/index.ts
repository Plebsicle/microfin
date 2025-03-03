import express from 'express'
import sessionMiddleware from './middlewares/session';
import signupRoute from './routes/signup'
import cors from './middlewares/cors';
import dotenv from 'dotenv'
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const app = express();
app.use(express.json());
app.use(cors);

app.use(sessionMiddleware)

app.use(signupRoute);


app.disable('x-powered-by');
app.listen(8000,()=>{
    console.log("Server Started on Port 8000");
});