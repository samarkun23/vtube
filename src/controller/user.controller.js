import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {User} from "../models/user.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js";
import {ApiResponse} from "../utils/ApiResponse.js";

//in current situation we dont have userid || we have generateAccessToken or refreshtoken method in the user.model 
const generateAccessAndRefreshTokens = async(userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.gegenerateAccessToken()
        const refreshToken = user.generateRefreshToken()

        //refreshtoken ko database mai dal rahe hai 
        user.refreshToken = refreshToken
        await user.save({validateBeforeSave: false}) //mongo db se aya hai .save, to ab jitni baar save karoge utni baar password manga hai so validateBeforeSave: false ab password nhi mangegea 


        //now access and refreshtoken return karo
        return{accessToken,refreshToken}



    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating access token")
    }
}



const registerUser = asyncHandler(async(req, res) => {
    //get userdetails from front end 
    // Validation - non empty
    // check if user allready exists: email , username
    //check for images , check for avatar
    // upload them in cloudinary


    //user details from frontend || agar form ya json data aa rha hai then .body se ayega or agar url se aya to baad mai dekege
    const {fullname, email, username, password} = req.body
    // console.log("email:", email);


    //validation

    //ek ek method par bhi laga sakte ho if if karke
    if(
        [fullname, email, username, password].some((field) => field?.trim() === "")
    ){
        throw new ApiError(400, "All field is required")
    }



    //Check user already exit or not
    const exitedUser = await User.findOne({
        $or: [{username}, {email}]
    })

    if (exitedUser) {
        throw new ApiError(409, "User with email or username already exists")
    }
    // console.log(req.files);

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





const loginUser =  asyncHandler(async (req, res) => {
//TODOS
// sabse pahle user se data lo
//(find)then check karo user hai ki nhi hai
//if user not than error if yes than check password
//if password is correct than login if its not corret than error    
//access and refresh token generate karo or send it to user
// kaise send karoge cookie ke throw send karo 


// DATA 
    const {email, username, password} = req.body
    if (!username || !email) {
        throw new ApiError(400, "username or password is required")
    }
    
    //Finding username or email in database 
    const user = await User.findOne({
        $or: [{username},{email}]
    })

    if(!user){
        throw new ApiError(404, "User doesn't exits")
    }

    //checking password now 
    const isPasswordValid = await user.isPasswordCorrect(password) //(password ) ye wala aya jo humne abhi user se liya
    if (!isPasswordValid) {
        throw new ApiError(401, "Password is incorrect")
    }


    //now make access and refresh token ye jada  baar call karna padega so lets make its tamplete

})




export {registerUser,loginUser}