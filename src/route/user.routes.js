import { Router } from "express";
import {loginUser, logoutUser, registerUser} from  '../controller/user.controller.js'
import { upload } from "../Middleware/multer.js";
import {verifyJwt} from "../Middleware/auth.middleware.js"

const router = Router()

router.route('/register').post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1,
        },
        {
            name:"coverImage",
            maxCount: 1,
        }
    ]),registerUser)

router.route('/login').post(loginUser)
router.route('/logout').post( verifyJwt, logoutUser)

export default router