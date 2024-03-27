import {User} from '../models/user.model.js'
import jwt from  "jsonwebtoken";
import {asyncHandler} from '../utils/asyncHandler.js'
import {ApiError} from '../utils/apiError.js'

export const verifyJwt = asyncHandler(async(req, res, next)=>{
    try {
        // Get token from header
        const token = req.cookie?.accessToken ||  req.header('Authorization')?.replace("Bearer ", "") ;

        if(!token ){
            throw new ApiError(401,"Not authenticated")
        }

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)

        const user = await User.findById(decodedToken?._id).select("-password refreshToken")

        if  (!user){
           throw new ApiError (404, "The user with this token does not exist.");
       }
       req.user = user;
       next();
        
    } catch (error) {
        throw ApiError(200, error?.message || "Invalid assess token ")
    }
})