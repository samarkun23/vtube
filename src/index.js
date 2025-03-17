// require('dotenv').config({path: './env'})  this code fine but its breaks consitancy of code so we write impove code 
import dotenv from 'dotenv'
import connectDB from "./db/index.js"; 
import { app } from './app.js';


dotenv.config({
    path: './.env'
})

connectDB() //when ascycronus method complete its return promise 
.then(() => {
    app.listen(process.env.PORT || 8000, () => {
        console.log(`Server is running on port : ${process.env.PORT}`);
        
    })
})
.catch((err) => {
    console.log("MONGO DB connection fail !!!", err);   
})



















//FIRST APPROACH IS HERE 
/*
import express from "express"
const app = express()


// ; is just for clean 
( async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on("error", (err)=>{
            console.log("ERROR:", err);
            
        })
        
        
        app.listen(process.env.PORT, () => {
            console.log(`App is listening on port ${process.env.PORT}`);
            
        })

    } catch (error) {
        console.error("ERROR: ", error);
        throw err
    }
})()

*/