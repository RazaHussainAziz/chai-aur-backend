import express from "express";
import dbConnection from "./db/dbConnection.js";
import cookieParser from 'cookie-parser';
import cors from "cors";

import { config } from "dotenv";

config();


const app = express();
const port = process.env.PORT || 4000;

//connnecting to mongoDB database
dbConnection();

//middlewares
app.use(express.json({limit:"70kb"}));
app.use(express.urlencoded({extended:true}));
app.use(express.static("/public"))
app.use(cookieParser());
app.use(cors({
    origin:process.env.CORS_ORIGIN
}))

//routers

import router from "./routes/user.routes.js";


app.use("/api/v1/users",router);


app.listen(port,()=>{
    console.log(`⚙ Server started at port ${port}`);
})

 