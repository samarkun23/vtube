import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"

const userSchema = new Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        fullname: {
            type: String,
            required: true,
            trim: true,
            index: true
        },
        avatar: {
            type: String, //cloudnary service using 
            required: true,
        },
        coverImage: {
            type: String //cloudnary URL
        },
        watchHistory: [
            {
                type: Schema.Types.ObjectId,
                ref: "Video"
            }
        ],
        password: {
            type: String,
            required: [true, "Password is required"]
        },
        refreshToken: {
            type: String
        }
    }, { timestamps: true }
)
userSchema.pre("save", async function (next) {
    if(!this.isModified("password")) return next(); //with the help of this we can easily detect that password is modified or not when password modified than blow the code id run
    this.password =  await bcrypt.hash(this.password, 10)
    next()
})//we cannot use arrow function here because in arrow function there is no this function 

//Desing custom methods for passwordchecking 
userSchema.method.isPasswordCorrect = async function (password){
    return await bcrypt.compare(password, this.password) //IN this process await because of time lagta hai .compare karne mai thats why await 
}

//METHOD FOR GENERATING ACCESS TOKEN || 
userSchema.methods.generateAccessToken = function(){
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullname: this.fullname
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}
userSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        {
            _id: this._id,
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}



export const User = mongoose.Schema("User", userSchema)