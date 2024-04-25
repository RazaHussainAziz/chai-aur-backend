import User from "../models/user.models.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {uploadOnCloudinary} from '../utils/cloudinary.js'
import  JWT  from "jsonwebtoken";



//register new user
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
        

});

//login user
const loginUser = asyncHandler(async(req,res)=>{

        const {email,password} = req.body;
        //check if user does not exist
        const user = await User.findOne({email});

        if(!user) return res.status(404).json({ message:"User does not exist"});

        const checkPassword = await user.isCorrectPassword(password);

        if(!checkPassword) return res.status(401).json({ message:"Invalid Credentials"});

        const accessToken = await user.generateAccessToken();
        const refreshToken = await user.generateRefreshToken();

        user.refreshToken = refreshToken;
        
        await user.save({validateBeforeSave:false});

        const loggedInUser = await User.findById(user._id).select(
          "-password -refreshToken"
        );

        const cookieOptions = {
          httpOnly:true,
          secure:true
        }



       return res
       .status(200)
       .cookie("accessToken",accessToken,cookieOptions)
       .cookie("refreshToken",refreshToken,cookieOptions)
       .json({ message:"Login Successful" });
 
        
})

//Logout User
const logoutUser = asyncHandler(async(req,res)=>{

        const decodedInfo = req.decodedInfo;

        await User.findByIdAndUpdate(decodedInfo.id,{
          $set:{
            refreshToken:null
          },
        },
        {
             new:true
        }
          )
        
        const cookieOptions = {
            httpOnly:true,
            secure:true
          }
        return res
        .status(200)
        .clearCookie("accessToken",cookieOptions)
        .clearCookie("refreshToken",cookieOptions)
        .json({ message:"logout successfull" })
})

//Re-generate AccessToken
const refreshedAccessToken = asyncHandler(async(req,res)=>{
        const incomingRefreshToken = req.cookies?.refreshToken;

        if(!incomingRefreshToken) return res.status(401).json({message:"Token not Found"});
        
        const verifyToken = JWT.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET);

        if(!verifyToken) return res.status(401).json({message:"Invalid Token"});

        const user = await User.findById(verifyToken.id);

        if(!user) return res.status(401).json({message:"User not Found"});

        if(user.refreshToken !== incomingRefreshToken) return res.status(401).json({message:"Invalid Token"});

        const generateRefreshedAccessToken = await user.generateAccessToken();
        
        const cookieOptions = {
          httpOnly:true,
          secure:true
        };

        return res
        .cookie("accessToken",generateRefreshedAccessToken,cookieOptions)
        .cookie("refreshToken",incomingRefreshToken,cookieOptions)
        .json({message:"New Token Generated"});




})

//Change Password
const changePassword = asyncHandler(async(req,res)=>{

        const userID = req.decodedInfo.id;

        if(!userID) return res.status(401).json({message:"UnAutorized User"});

        const {oldPassword,newPassword} = req.body;
        
        const user = await User.findById(userID);

        const checkPassword = await user.isCorrectPassword(oldPassword);
        
        if(!checkPassword) return res.status(400).json({message:"Wrong Password"});

        const updatePassword = await User.findByIdAndUpdate(
          userID,
          {
            $set:{
              password:newPassword
            }
          },
          {
            new:true
          }
      )

      return res.status(204).json({ message:"Password Changed Successfully" });


})

//get user
const getUser = asyncHandler(async(req,res)=>{

        const userInfo = req.decodedInfo;

        const userData = await User.findOne({email:userInfo.email}).select(
          "-password -refreshToken"
        );

        return res.status(200).json({data:userData});
})

//change Avatar i.e Profile Image
const changeAvatar = asyncHandler(async(req,res)=>{

        const decodedInfo = req.decodedInfo;
        const fileLocalPath = req.file?.path;

        if(!fileLocalPath) return res.status(400).json({message:"File not Found"});

        const uploadFile = await uploadOnCloudinary(fileLocalPath);

        if(!uploadFile) return res.status(400).json({message:"File Upload Failed"});

        const newData = await User.findByIdAndUpdate(
          decodedInfo.id,
          {
            $set:{
              avatar:uploadFile.url
            }
          },
          {
            new:true
          }
        ).select("-password -refreshToken")

        return res.status(200).json(
          {
            message:"Profile Image Changed",
            data:newData
          });
})

//get subscribers and subcribeTo count
const getChannelProfile = asyncHandler(async(req,res)=>{

        const { username } = req.params;

        if(!username?.trim()) return res.status(404).json({message:"User not Found"});

        const channelData = await User.aggregate([

            {
              $match:{
                username:username
              }
            },
            {
              $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"channel",
                as:"subscribers"
              }
            },
            {
              $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"subscriber",
                as:"subscribedTo"
              }
            },
            {
              $addFields:{
                  noOfSubscribers:{
                      $size:"$subscribers"
                  },
                  subscribedToCount:{
                      $size:"$subscribedTo"
                  },
                  isSubcribed:{
                      $cond:{
                        if:{
                          $in:[req.decodedInfo?.id,"$subscribers.subscriber"]
                        },
                        then:true,
                        else:false
                      }
                  }
              }
            },
            {
              $project:{
                username:1,
                fullName:1,
                noOfSubscribers:1,
                subscribedToCount:1,
                isSubcribed:1,
                email:1,
                avatar:1,
                coverImage:1
              }
            }
            
        ]);

        if(!channelData?.length) return res.status(404).json({message:"channel does not exist"})
        return res.status(200).json({
          data:channelData[0]
        })
})
 
export  { 
  registerUser,
  loginUser,
  logoutUser,
  refreshedAccessToken,
  changePassword,
  getUser,
  changeAvatar,
  getChannelProfile
 }