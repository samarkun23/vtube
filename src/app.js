import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'

const app = express ()


//debugging
// app.use((req, res, next) => {
//     console.log("New Request Received:");
//     console.log("Method:", req.method);
//     console.log("URL:", req.url);
//     console.log("Headers:", req.headers);
//     console.log("Body:", req.body);
//     next();
// });




//configuring cors 
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true 
}))

//middle ware set for json data 
app.use(express.json({limit: "16kb"})) // accecpting json with limit

//configure url data
app.use(express.urlencoded({extended: true, limit: "16kb"}))

//some times we try to store file or images in my own server so we make public folder
app.use(express.static("public"))  //public folder banaya tha thats why 

//configure cookie parser
app.use(cookieParser())




// routes
import userRouter from './routes/user.routes.js'


//router declaration
app.use("/api/v1/users", userRouter) //jab router import karoge to get ki place par use ko use karna padega 
// ab url jo banega vo kuch ase banega http://localhost:8000/api/v1/users/register
//ismai register call kiya humne 



export { app  }