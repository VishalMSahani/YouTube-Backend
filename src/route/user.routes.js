import { Router } from "express";

import {updataAccountDetails, 
        changePassword,
        getCurrentUser, 
        getUserChannelProfile,
        getwatchHistory, 
        loginUser, logoutUser, 
        registerUser, 
        updateUserAvatar, 
        updateUserCoverImage
    } from  '../controller/user.controller.js'

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
//secured router
router.route('/logout').post( verifyJwt, logoutUser)
router.route("/change-password").post(verifyJwt, changePassword)
router.route("/current-user").get(verifyJwt, getCurrentUser)
router.route("/update-account-details").patch(verifyJwt, updataAccountDetails)
router.route("/update-avatar").patch(verifyJwt, upload.single("avatar"), updateUserAvatar)
router.route("/update-Cover-Image").patch(verifyJwt, upload.single("coverImage"), updateUserCoverImage)
router.route("/c/:username").get(verifyJwt, getUserChannelProfile)
router.route("/watch-history").get(verifyJwt, getwatchHistory)


export default router