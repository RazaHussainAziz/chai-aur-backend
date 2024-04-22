import User from "../models/user.models.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {uploadOnCloudinary} from '../utils/cloudinary.js'

const registerUser = asyncHandler(async(req,res)=>{

        const {username,email,fullName,password} = req.body;
        
        //checking if any field is missing
        if(
            [username,email,fullName,password].some((field)=>field?.trim()==="")
          ) 
          {
            return res.status(400).json({message:"fullname required"})
          }
       
        if(!email.includes("@gmail.com")){
            return res.status(400).json({message:"invalid email"});
        }


        const existedUser = await User.findOne({email});
        
        //checking if user already exist
        if(existedUser) return res.status(409).json({message:"user already exist"});

        //getting local paths of file before uloading
        const avatarLocalPath = req.files?.avatar[0]?.path;
        const coverImageLocalPath = req.files?.coverImage[0]?.path;

        console.log(req.files)

        if(!avatarLocalPath) return res.status(400).json({message:"Avatar file required"});
        
        //upload files on cloudinary
        const avatar = await uploadOnCloudinary(avatarLocalPath);
        const coverImage = await uploadOnCloudinary(coverImageLocalPath);

        if(!avatar) return res.status(400).json({message:"Avatar file required"});

        //creating user
        const user = await User.create({
            username:username,
            fullName,
            email,
            password,
            avatar:avatar.url,
            coverImage:coverImage?.url || ""
        });
        
        const isRegistered = await User.findById(user._id).select(
          "-password -refreshToken "
          );

        if(!isRegistered) return res.status(500).json({message:"Something went wrong"});
        
        return res.status(200).json({
          message:"Registration Successfull",
          success:true,
          data:isRegistered
        })
        

})

export default registerUser;