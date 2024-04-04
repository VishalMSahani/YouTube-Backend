import mongoose, {isValidObjectId} from 'mongoose'
import { ApiError } from '../utils/apiError'
import { ApiResponse } from '../utils/apiResponse'
import Video from '../models/video.model.js'
import Tweet from '../models/playlist.model.js'
import Comment from '../models/comment.model.js'
import { asyncHandler } from '../utils/asyncHandler'
import { Like } from '../models/likes.model.js'


const toogleVideoLike = asyncHandler(async(req,res)=>{

    const {videoId} = req.params

    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(400, "Video not found")
    }

    if (video.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(400, "only owner can like or dislike the video")
    }

    const isLiked = await Like.findOne({
        video: video,
        likedBy:req.user?._id
    })

    if(isLiked){
        await Like.findByIdAndDelete(isLiked?._id)

        return res
        .status(200)
        .json(new ApiResponse(200,{isLiked:false}));
    }

    await Like.create({
        video:video,
        likedBy:req.user?._id
    })

    return res
    .status(200)
    .json(
        new ApiResponse(200, {isLiked:true}, "Video Liked Successfully")
    )



})


const toogleTweetLike = asyncHandler(async(req,res)=>{

    const {tweetId} = req.params

    const tweet = await Tweet.findById(tweetId)

    if (!tweet) {
        throw new ApiError(400, "tweet not found")
    }

})


const toogleCommentLike = asyncHandler(async(req,res)=>{

    const {commentId} = req.params

    const comment = await Comment.findById(commentId)

    if (!comment) {
        throw new ApiError(400, "comment not found")
    }

})