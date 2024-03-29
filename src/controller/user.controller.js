import {asyncHandler} from '../utils/asyncHandler.js'
import {ApiError} from '../utils/apiError.js'
import { User } from '../models/user.model.js'
import {uploadCloudinary} from '../utils/cloudinary.js'
import { ApiResponse } from '../utils/apiResponse.js'
import jwt from  "jsonwebtoken"
import { Mongoose } from 'mongoose'


const generateAccessAndRefreshToken =  async (userId) =>{ 

    try {
        const userToken = await User.findById(userId)
        const accessToken = userToken.grantAccessToken()
        const refreshToken = userToken.grantRefreshToken()

        userToken.refreshToken= refreshToken
        await userToken.save({validateBeforeSave:false})

        return {accessToken, refreshToken}

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating tokens")
    }
}

const registerUser = asyncHandler( async (req, res) => {

    // 
    const  {username, email, password, fullName} = req.body;
    
    console.log("Email:", email);

    //check these field should not be empty
    if([username, email, password, fullName].some((field) =>field?.trim() === ""))
    {
        throw new ApiError(400, "All fields are required")
    } 


    // check if user already exist in the database or not
    const userExist = await User.findOne({
        $or:[{email}, {username}]
    })
    if(userExist){
        throw new ApiError(409,"User already exists.")
    }


    // const avatarLocalPath = req.files?.avatar[0]?.path;
    //const coverImageLocalPath = req.files?.coverImage[0]?.path;
    let avatarLocalPath;
    if (req.files && Array.isArray(req.files.avatar) && req.files.avatar.length > 0) {
        avatarLocalPath = req.files.avatar[0].path
    }

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
    }
        coverImageLocalPath = req.files.coverImage[0].path
    
    console.log(coverImageLocalPath);
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }

    const avatar = await uploadCloudinary(avatarLocalPath)
    const coverImage = await uploadCloudinary(coverImageLocalPath)

    if (!avatar) {
        throw new ApiError(400, "Avatar file is required")
    }

    console.log(avatar.url);
    console.log(coverImage.url);

    //store all data in user variable and create 
    const user = await User.create({
        fullName,
        username,
        avatar: avatar.url,
        coverImage: coverImage?.url || " ",
        password,
        email,
    })

    console.log("user" , user);
    
    const createduser = await User.findById(user._id).select('-password -grantRefreshToken')

   

    if(!createduser){
        throw new ApiError(500,'Something went wrong while reggistring the user! Please try again')
    }
    return res.status(200).json(
        new ApiResponse(200, createduser, "User registerd successfully")
        
        )
   
});

const loginUser = asyncHandler(async(req, res) =>{

    const  {username, password, email} = req.body;

    console.log(email);

    if (!(email || username)){
        throw new ApiError(400,"Username or Email field is missing");
    }

    const login_user = await User.findOne({
        $or:[
            {"username": username},
            {'email': email}]
    })

    

    if (!login_user){
        throw new ApiError(401, 'User not found');
    }

    const isPasswordCorrect = await login_user.matchPasswords(password);

    if(!isPasswordCorrect){
        throw new ApiError(401, 'Incorrect Password');
    }

    console.log(isPasswordCorrect);

    const {accessToken, refreshToken} = await generateAccessAndRefreshToken(login_user._id)
    console.log("accessToken: ",accessToken, "refreshToken", refreshToken);

    const loggedinUser = await User.findById(login_user._id).
    select("-password -refreshToken")
    
    const option = {
        httpOnly : true,
        secure: true
    }

    return  res
    .status(200)
    .cookie("accessToken", accessToken, option)
    .cookie("refreshToken", refreshToken, option)
    .json(
        new ApiResponse(200, {
            login_user: loggedinUser, accessToken, refreshToken
        }, "User Logged in successfully!" )
    )   
})

const logoutUser = asyncHandler(async (req,res)=>{

    await User.findByIdAndUpdate(
        req.userId, {$unset:{refreshToken : 1}} ,
        {new:true} //return the updated document
    )
    const option = {
        httpOnly : true,
        secure: true
    } 
    return res
    .status(200)
    .clearCookie( "accessToken" ,option)
    .clearCookie( "refreshToken" ,option)
    .json(new ApiResponse(200, {}, "Logged out Successfully"))

})

const refreshAccessToken =  asyncHandler(async (req,res)=> {

    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken){
        throw new ErrorAuth(401, 'No token provided')
    }

    try {
        
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)

        const user = await User.findById(decodedToken._id)

        if(!user) {
            throw new ErrorAuth(401, 'Invalid refresh token authentication failed!')
        }

        // here optional chek for refreshtoken in user because that may be null or undefined 
        if(incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(403, "Refresh token is expired or used")
        }

        const {accessToken, newRefreshToken} = await generateAccessAndRefreshToken(user._id)

        const option ={
            httpOnly: true,
            secure:true
        }

        return res
        .status(200)
        .cookie("accessToken", accessToken, option)
        .cookie("refreshToken", newRefreshToken, option)
        .json(
            new ApiResponse(
                200,
                {accessToken, refreshToken:newRefreshToken},
                "New access token generated successfully" 
                )
        )

    } catch (error) {
        throw new ApiError(400, error?.message || "trouble in generating new access token" )
    }
})


const changePassword  = asyncHandler(async (req, res) => {

    const {oldPassword, newPassword} = req.body;

    const  user = await User.findById(req.user?._id)

    if (!user) {
       throw new ErrorAuth(401,"User not found");
    }

    const isPasswordValid = await user.matchPasswords(oldPassword);

    if(!isPasswordValid){
        throw new ErrorAuth(401,'Invalid old password')

    }

    user.password = newPassword
    await user.save({validateBeforeSave : false});

    return res
    .status(200)
    .json(
        new ApiResponse( 200, {}, "Password changed Successfully!" )
    )
})


const getCurrentUser = asyncHandler(async (req,res)=>{

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            req.user,
            "user fetched successfully"
        )
    )
})

const accountDetails  = asyncHandler(async (req,res)=>{

    const {email , username} = req.body;

    if( !email && !username ){
        throw new ErrorAuth(400,"provide an email or a username")
    }

    const user = await User.findByIdAndUpdate(req.user?._id,
        { $set:{fullName, email}},
        {new:true}).select("-password");

    
    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Account details updated!")
    )
     
});

const updateUserAvatar = asyncHandler(async(req, res)=>{

    const avatarLocalpath = req.file?.path

    if (!avatarLocalpath) {
        throw new ApiError(400,'Avatar file is missing')
    }

    //  Save image to cloudinary and get the url of the image

    const avatar = await uploadCloudinary(avatarLocalpath);

    if(!avatar.url){
        throw new ApiError(400, "error while uploading avatar on cloudinery")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set :{
                avatar: avatar.url
            }
        },
        {
            new: true
        }
    )


    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user,
            "Avatar Updated Successfully"
        )
    )
})


const updateUserCoverImage = asyncHandler(async(req, res)=>{

    const coverImagePathLocal = req.file?.path

    if (!coverImagePathLocal) {
        throw new ApiError(400,'Avatar file is missing')
    }

    //  Save image to cloudinary and get the url of the image

    const coverImage = await uploadCloudinary(coverImagePathLocal);

    if(!coverImage.url){
        throw new ApiError(400, "error while uploading coverImage on cloudinery")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set :{
                coverImage: coverImage.url
            }
        },
        {
            new: true
        }
    )


    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user,
            "CoverImage Updated Successfully"
        )
    )
})


const getUserChannelProfile = asyncHandler (async (req ,res)=>{

    const {username} =  req.params;

    if(!username?.trim()){
        throw ApiError (400,"Username is missing");
    }

    const channel = await User.aggregate([
        {
            $match:{
                username: username.toLowerCase(),
            }
        },
        {
           $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"channel",
                as: "Subscribers"
           } 
        },
        {
           $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"subscriber",
                as: "SubscribedTo"
           } 
        },
        {
            $addFields:{
                SubscribersCount:{
                    $size: "$Subscribers"
                },
                ChannelSubscribersCount:{
                    $size: "$SubscribedTo"
                },
                isSubscribed:{
                    $cond:{
                        if: { $in : [req.user?._id, "Subscribers.subscriber"]},
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project:{
                fullName:1,
                email:1,
                username:1,
                avatar:1,
                coverImage:1,
                isSubscribed:1,
                SubscribersCount:1,
                ChannelSubscribersCount:1,

            }
        }

    ])

    if(!channel?.length){
        throw new ApiError(404,"Channel not found")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, channel[0], "channel fetched successfully")
    )
})


const getwatchHistory = asyncHandler(async (req,res)=>{

    const user = await User.aggregate([
        {
            $match:{
                _id : new Mongoose.Types.ObjectId(req.user._id), 
            }
        },
        {
            $lookup:{
                from: "videos",
                localField:"watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline:[
                    {
                        $lookup:{
                            from:"users",
                            localField:"owner",
                            foreignField:"_id",
                            as: "owner",
                            pipeline:[
                                {
                                    $project:{
                                        fullName:1,
                                        username:1,
                                        avatar:1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                            owner:{
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        }

    ])

    return res
    .status(200)
    .json(
        new ApiResponse(
            200, user[0].watchHistory , "Successfully retrieved the watch history of this user."
        )
    )
})


export {registerUser,
        loginUser,
        logoutUser,
        refreshAccessToken,
        changePassword,
        getCurrentUser,
        accountDetails,
        updateUserAvatar,
        updateUserCoverImage,
        getUserChannelProfile,
        getwatchHistory
    }