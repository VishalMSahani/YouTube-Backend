import {asyncHandler} from '../utils/asyncHandler.js'
import {ApiError} from '../utils/apiError.js'
import { User } from '../models/user.model.js'
import {uploadCloudinary} from '../utils/cloudinary.js'
import { ApiResponse } from '../utils/apiResponse.js'


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


export {registerUser, loginUser, logoutUser}