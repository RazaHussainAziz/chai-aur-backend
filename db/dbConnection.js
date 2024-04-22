import mongoose from "mongoose";
import { config } from "dotenv";

config();

const dbConnection = async()=>{
        try {

            await mongoose.connect(process.env.MONGODB_URI);
            console.log("DB Connection Successful");
         
        } catch (error) {
            
            console.log('💀 Data_Base Connection Error');
            process.exit(1);
        }
}

export default dbConnection;