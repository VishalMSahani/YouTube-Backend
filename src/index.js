import connectDB from "./database/index.js";
import dotenv, { config } from "dotenv";

dotenv.config({
    path: './env'
});

connectDB()


