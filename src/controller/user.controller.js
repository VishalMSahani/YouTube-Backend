import {asyncHandler} from '../utils/asyncHandler.js'
import {ApiError} from '../utils/apiError.js'
import { User } from '../models/user.model.js'
import {uploadCloudinary} from '../utils/cloudinary.js'
import { ApiResponse } from '../utils/apiResponse.js'


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
   
})

export {registerUser}