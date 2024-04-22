import mongoose,{ Schema } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema = new Schema({
       username:{
            type:String,
            required:true,
            unique:true,
            trim:true
       },
       email:{
            type:String,
            required:true,
            unique:true
       },
       fullName:{
            type:String,
            required:true
       },
       password:{
            type:String,
            required:true
       },
       avatar:{
            type:String
       },
       coverImage:{
            type:String
       },
       watchHistory:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:"Video"
        }
    ],
       refreshToken:{
            type:String,
       }
       
},
{
    timestamps:true
}
);

//Encrypting password
userSchema.pre("save",async function(next){

        if(!this.isModified("password")) return next();
        this.password = await bcrypt.hash(this.password,10);
        next();
})

//Checking Password (is Password correct or not)
userSchema.methods.isCorrectPassword = async function(password){

        return await bcrypt.compare(password,this.password);
}

userSchema.methods.generateAccessToken = async function(){
 
        return jwt.sign({
            id:this._id,
            username:this.username,
            email:this.email
        },
            process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn:process.env.ACCESS_TOKEN_EXPIRY
        });
}

userSchema.methods.generateRefreshToken = async function(){
 
    return jwt.sign({
        id:this._id,
    },
        process.env.REFRESH_TOKEN_SECRET,
    {
        expiresIn:process.env.REFRESH_TOKEN_EXPIRY
    });
}

const User = mongoose.model("User",userSchema);

export default User;