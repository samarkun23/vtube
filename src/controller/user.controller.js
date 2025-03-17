import {asyncHandler} from "../utils/asyncHandler.js";;
import {ApiError} from "../utils/ApiError.js";
import {User} from "../models/user.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js";
import {ApiResponse} from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async(req, res) => {
    //get userdetails from front end 
    // Validation - non empty
    // check if user allready exists: email , username
    //check for images , check for avatar
    // upload them in cloudinary


    //user details from frontend || agar form ya json data aa rha hai then .body se ayega or agar url se aya to baad mai dekege
    const {fullName, email, username, password} = req.body
    console.log("email:", email);


    //validation

    //ek ek method par bhi laga sakte ho if if karke
    if(
        [fullName, email, username, password].some((field) => field?.trim() === "")
    ){
        throw new ApiError(400, "All field is required")
    }



    //Check user already exit or not
    const exitedUser = User.findOne({
        $or: [{username}, {email}]
    })

    if (exitedUser) {
        throw new ApiError(409, "User with email or username already exists")
    }

    //Checking images and avatar
    const avatarLocalPath = req.files?.avatar[0]?.path; //ye file li hai humne
    const coverImageLocalPath = req.files?.coverImage[0]?.path;


    //Checking avatar local path
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required ")
    }
    //see in utils Apierror has much use 

    //upload them in cloudinary using cloudinary.js
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    //checking avatar uploaded or not 
    if (!avatar) {
        throw new ApiError(400, "Avatar is required ")
    }

    //create object and enter in database
    //only user is talking to database
    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })
    //db jab bhi new user create karta hai tab _id apne aap generate hota hai 
    const createdUser = User.findById(user._id).select(
        "-password -refreshToken"
    )




    // user is done or not
    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }


    //return res with help apiresponse
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User register successfully")
    )




})

export {registerUser}