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
        likeVideo: videoId,
        likedBy:req.user?._id
    })

    if(isLiked){
        await Like.findByIdAndDelete(isLiked?._id)

        return res
        .status(200)
        .json(new ApiResponse(200,{isLiked:false}));
    }

    await Like.create({
        likeVideo:videoId,
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

    if (tweet.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(400, "Only owner can like and dislike this tweet")
    }

    const isTweetLiked = await Like.findOne(
        {
            likeTweet: tweetId,
            likedBy: req.user?._id
        }
    )

    if (isTweetLiked) {
        await Tweet.findByIdAndDelete(isTweetLiked?._id)

        return res
        .status(200)
        .json(
            new ApiResponse(200,{isTweetLiked:false}, "Tweet disliked successfully")
        )
    }

    await Like.create({
        likeTweet:tweetId,
        likedBy:req.user?._id
    })

    return res
    .status(200)
    .json(
        new ApiResponse(200, { isLiked: true }, "tweet liked successfully ")
    )

})


const toogleCommentLike = asyncHandler(async(req,res)=>{

    const {commentId} = req.params

    const comment = await Comment.findById(commentId)

    if (!comment) {
        throw new ApiError(400, "comment not found")
    }

    if (comment.owner.toString !== req.user?._id.toString()) {
        throw new ApiResponse(400,"only owner can like and dislike this comment")
    }

    const isCommentLiked = await Like.findOne(
        {
            likeComment:commentId,
            likedBy:req.user?._id
        }
    )

    if (isCommentLiked) {
        await Like.findByIdAndDelete(isCommentLiked?._id)

        return res
        .status(200)
        .json ( 
            new ApiResponse(200,{ isCommentLiked: false }, "comment disliked successfully")
        )
    }

    await Like.create(
        { 
            likeComment: commentId,
            likedBy: req.user?._id 
        }
    )

    return res
    .status(200)
    .json(
        new ApiResponse(200, {isCommentLiked:true}, "comment liked successfully")
    )
    
})