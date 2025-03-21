import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"
import { response } from "express";

//in current situation we dont have userid || we have generateAccessToken or refreshtoken method in the user.model 
const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        //refreshtoken ko database mai dal rahe hai 
        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false }) //mongo db se aya hai .save, to ab jitni baar save karoge utni baar password manga hai so validateBeforeSave: false ab password nhi mangegea 


        //now access and refreshtoken return karo
        return { accessToken, refreshToken }



    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating access token")
    }
}



const registerUser = asyncHandler(async (req, res) => {
    //get userdetails from front end 
    // Validation - non empty
    // check if user allready exists: email , username
    //check for images , check for avatar
    // upload them in cloudinary


    //user details from frontend || agar form ya json data aa rha hai then .body se ayega or agar url se aya to baad mai dekege
    const { fullname, email, username, password } = req.body
    console.log("email:", email);


    //validation

    //ek ek method par bhi laga sakte ho if if karke
    if (
        [fullname, email, username, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All field is required")
    }



    //Check user already exit or not
    const exitedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (exitedUser) {
        throw new ApiError(409, "User with email or username already exists")
    }
    console.log(req.files);

    //Checking images and avatar
    const avatarLocalPath = req.files?.avatar[0]?.path; //ye file li hai humne
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;
    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }

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
        fullname,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })
    //db jab bhi new user create karta hai tab _id apne aap generate hota hai 
    const createdUser = await User.findById(user._id).select(
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





const loginUser = asyncHandler(async (req, res) => {
    // console.log("Login Request Body : ", req.body);
    //TODOS
    // sabse pahle user se data lo
    //(find)then check karo user hai ki nhi hai
    //if user not than error if yes than check password
    //if password is correct than login if its not corret than error    
    //access and refresh token generate karo or send it to user
    // kaise send karoge cookie ke throw send karo 


    // DATA 
    const { email, username, password } = req.body
    console.log("Searching for user: ", { email, username })


    if (!(username || email)) {
        throw new ApiError(400, "username or password is required")
    }

    //Finding username or email in database 
    const user = await User.findOne({
        $or: [{ username }, { email }],
    });
    console.log("User found: ", user);


    if (!user) {
        throw new ApiError(404, "User doesn't exits");
    }
    console.log("Found User", user)

    //checking password now 
    const isPasswordValid = await user.isPasswordCorrect(password) //(password ) ye wala aya jo humne abhi user se liya
    if (!isPasswordValid) {
        throw new ApiError(401, "Password is incorrect")
    }


    //now make access and refresh token ye jada  baar call karna padega so lets make its tamplete
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id)

    //data base ko quiry maro ya fir update karo \\ upar wale data jaha liya hai uska user ka token hai vo khali hai
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    //now we want to send cookies 
    const options = {
        httpOnly: true,
        secure: true
    }//cookies jo hoti hai unhe koi bhi modify kar sakta hai but httponly jaise hi laga doge or secure true karoge tab ye cookies srif server se modifible hoti hai 

    //send cookies to user
    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser, accessToken, refreshToken
                },
                "user logged In Successfully"
            )
        )



})



//LOGOUT USER
const logoutUser = asyncHandler(async (req, res) => {
    //first clear cookies
    //desing middleware 
    // req.user ka access hai mere pass ab
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )
    // refreshToken remove ho gaye hai data base se 
    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User logged Out"))
    //ab user ke pass se bhi reomve ho gaya hai
})


//making refresh token controller
const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        throw new ApiError(401, "unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_EXPIRY
        )

        const user = await User.findById(decodedToken?._id)

        if (!user) {
            throw new ApiError(401, "Invalid refresh token")
        }

        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used")
        }

        const options = {
            httpOnly: true,
            secure: true
        }
        const { accessToken, newrefreshToken } = await generateAccessAndRefreshTokens(user._id)

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newrefreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    { accessToken, refreshToken: newrefreshToken },
                    "Access token Refreshed"
                )
            )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }




})


const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassoword } = req.body

    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid Old Password")
    }

    user.password = newPassoword
    await user.save({ validateBeforeSave: false })

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Password change successfully"))
})

const getCurrentUser = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(new ApiResponse(200, req.user, "current user fetched successfully"))
})

const updateAccountDetails = asyncHandler(async (req, res) => {
    const { fullName, email } = req.body

    if (!fullName || !email) {
        throw new ApiError(400, "All fields are required")
    }

    const user = User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName,
                email: email
            }
        },
        { new: true }
    ).select("-password")

    return res
        .status(200)
        .json(new ApiResponse(200, user, "Account details updated successfully"))
})

//files update 
const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path   //ye files multer middleware ke through mila hai

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if (!avatar.url) {
        throw new ApiError(400, "Error while uploading avatar")
    }

    //update time 
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar.url //srif url bharna hai 
            }
        },
        { new: true }
    ).select("-password")
    return res
        .status(200)
        .json(
            new ApiResponse(200, user, "Avatar image upload successfully ")
        )
})



const updateUserCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path   //ye files multer middleware ke through mila hai

    if (!coverImageLocalPath) {
        throw new ApiError(400, "Cover image file is missing")
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!coverImage.url) {
        throw new ApiError(400, "Error while uploading avatar")
    }

    //update time
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: coverImage.url //srif url bharna hai 
            }
        },
        { new: true }
    ).select("-password")

    return res
        .status(200)
        .json(
            new ApiResponse(200, user, "Cover image upload successfully ")
        )
})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage
}