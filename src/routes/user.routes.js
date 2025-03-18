import { Router } from "express";
import { loginUser, registerUser } from "../controller/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";


const router = Router()

//if maine url mai /register lagaya to ye register method call ho jayega
router.route("/register").post(
    //ye uplaod hai middleware 
    upload.fields([
        {
            name: "avatar",
            maxCount: 1 
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser
)

router.route("/login").post(loginUser)

export default router
