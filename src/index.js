// require('dotenv').config({path: './env'})  this code fine but its breaks consitancy of code so we write impove code 
import dotenv from 'dotenv'
import connectDB from "./db/index.js"; 

dotenv.config({
    path: './env'
})

connectDB()


















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