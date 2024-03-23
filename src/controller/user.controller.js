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

    // creck for avatar and cover image if there or not 
    const avatarLocalpath  = req.files?.avatar[0]?.path;

    // let coverImageLoaclpath;
    // if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
    //     coverImageLoaclpath = req.files.coverImage[0].path;
    // }  

    //chek for avatar 
    if(!avatarLocalpath){
        throw new ApiError(422,'Avatar is required')
    }

    // // uploading to cloudinary
    const avatar =  await uploadCloudinary(avatarLocalpath);
    // const coverImage =  await uploadCloudinary(coverImageLoaclpath);

    //chek for avatar should uploded on clodinary
    if(!avatar){
        throw new ApiError(422,'Avatar is required')
    }

    //store all data in user variable and create 
    const user = await User.create({
        fullName,
        username,
        avatar: avatar.url,
        // coverImage: coverImage?.url || " ",
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