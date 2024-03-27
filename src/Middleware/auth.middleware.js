import {User} from '../models/user.model.js'
import jwt from  "jsonwebtoken";
import {asyncHandler} from '../utils/asyncHandler.js'
import {ApiError} from '../utils/apiError.js'

export const verifyJwt = asyncHandler(async(req, _ , next)=>{
    try {
        // Get token from header
        let token = req.cookies?.accessToken ||  req.header('Authorization')?.replace("Bearer ", "") ;

        console.log(token);

        if(!token ){
            throw new ApiError(401,"Not authenticated")
        }

        token = String(token);

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)

        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")

        if  (!user){
           throw new ApiError (404, "The user with this token does not exist.");
       }
       req.user = user;
       next();
        
    } catch (error) {
        throw new ApiError(200, error?.message || "Invalid assess token ")
    }
})