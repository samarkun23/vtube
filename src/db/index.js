import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async() => {
    try {
        const connectionInstace = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        console.log(`\n Mongo connected !! DB HOST: ${connectionInstace.connection.host}`); //assignment :- try to console.log connectionInstance   
    } catch (error) {
        console.log("MONGODB connection error", error);
        process.exit(1); //this is the method for exit pz visit this 
    }
}

export default connectDB