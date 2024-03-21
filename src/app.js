import express from 'express';
import cookieParser from 'cookie-parser';
import cors  from 'cors';

const app = express()

app.use(cors({
    origin: process.env.ORIGIN_CORS,
    credentials: true
}))
app.use(express.json({limit:"20kb"}));
app.use(express.urlencoded({ extended: false }));
app.use(express.static("public"));
app.use(cookieParser());
