import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";
// import dotenv from "dotenv";
// dotenv.config();

const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGO_URI}/${DB_NAME}`);
        console.log(`mongodb connnected || DB Host: ${connectionInstance.connection.host}`)
    } catch (error) {
        console.log("Error:", error);
        process.exit(1);
    };
};

export default connectDB;
