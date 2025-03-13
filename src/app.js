import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'

const app = express ()

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



export { app  }