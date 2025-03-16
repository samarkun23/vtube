import { Router } from "express";
import { registerUser } from "../controller/user.controller.js";

const router = Router()

//if maine url mai /register lagaya to ye register method call ho jayega
router.route("/register").post(registerUser)


export default router
