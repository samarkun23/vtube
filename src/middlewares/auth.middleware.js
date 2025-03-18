//ye srif verify karega ki user hai ki nhi hai 

import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"
import { User } from "../models/user.model.js";

// jo cookie di hai usse verfiy karo if all things true than add Object req.user
export const verifyJWT = asyncHandler(async(req,res, next) => {
   try {
     // token ka access lo kaise req ke pass cookies ka access hai usse
     const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
     
     if(!token){
         throw new ApiError(401, "Unauthorized request")
     }
    
     const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
 
     const user = await User.findById(decodedToken?._id).select("-password -refreshToken") 
 
 
     if(!user){
         throw new ApiError(401,"Invalid Access Token")
     }
 
     //user mil gaya hai to ab kya kroge 
     req.user = user;
     next()
   } catch (error) {
    throw new ApiError(401, error?.message || "Invalid Access Token")
   }


})