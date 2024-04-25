import { asyncHandler } from "../utils/asyncHandler.js";
import User from "../models/user.models.js";
import Jwt  from "jsonwebtoken";
import { config } from "dotenv";
config();


const verifyJWT = asyncHandler(async(req,res,next)=>{
    
    try {

        const token = req.cookies?.accessToken;
    
        if(!token) return res.status(401).json({messsage:"UnAuthorized request"});
    
        const decodedInfo =  Jwt.verify(token,process.env.ACCESS_TOKEN_SECRET);
    
        req.decodedInfo = decodedInfo;
        next();

    } catch (error) {
        
        return res.status(401).json({messsage:"Invalid Token"});
    }

})

export default verifyJWT;