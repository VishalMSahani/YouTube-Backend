import mongoose from 'mongoose'
import { ApiError } from '../utils/apiError.js'
import {ApiResponse} from "../utils/apiRespose.js";
import Comment from '../models/comment.model.js'
import {asyncHandler} from '../utils/asyncHandler.js'
import Video from '../controller/video.controller.js' 
import { Like } from '../models/likes.model.js';

const getVideoComment = asyncHandler(async(req, res)=>{

    const {videoId} = req.params
    const {page = 1 , limit = 10} = req.query

    const video = await Video.findById(videoId)

    if (video) {
        throw new ApiError(400, "Video not found")
    }

    const commentAggregate = await Comment.aggregate([
        {
            $match:{
                video: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner"
              }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "comment",
                as: "likes"
              }
        },
        {
            $addFields:{
                likeCoutn:{
                    $size:"$likes"
                },
                owner :{
                    $first:"$owner"
                },
                isLiked:{
                    if:{$in:[req.user?._id, "likes.likedBy"] }
                }
            }
        },
        {
            $sort:{
                createdAt:1
            }
        },
        {
            $project:{
                content:1,
                likeCoutn:1,
                createdAt:1,
                owner:{
                    username:1,
                    fullName:1,
                    "avatar.url":1
                },
                isLiked:1
            }
        }
    ])

    const options =  {
        page:parseInt(page,10),
        limit:parseInt(limit,10)
    }

    const comments = await Comment.aggregatePaginate(
        commentAggregate,
        options
    );

    return res
    .status(200)
    .json(
        new ApiResponse(200, comments, "COmment fetched successfully")
    )

})

const addComment = asyncHandler(async(req, res)=>{

    const {videoId, connent} = req.params;
    

    if(!connent) {
        throw new ApiError(400,"Content is required")
    }
    
    const video = await Video.findById(videoId)
    
    if(!video) {
        throw new ApiError(400,"IVideo Not found")
    }

    const comment = await Comment.create({
        connent,
        video : videoId,
        owner : req.user?._id
    })

    if (comment) {
        throw new ApiError(400, "faild to add comment please try again")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, comment, "Comment added successfully")
    )


})

const updateComment = asyncHandler(async(req,res)=> {

    const {content} = req.params
    const {commentId} = req.params

    if (!content) {
        throw new ApiError(400, "content is required")
    }

    const comment = await Comment.findById(commentId)
    
    if (!comment) {
        throw new ApiError(400, "comment not found")
    }

    if(comment.owner.toString() !== req.user?._id.toString()){
        throw new ApiError(400, "Only owner can edit this comment")
    }

    const updateComment = await Comment.findById(comment?._id,
        {
            $set:{content}
        },
        {
            new:true
        }
        );
    
    if (!updateComment) {
        throw new ApiError(400,"Unable to update the comment please try again")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, updateComment, "comment updated successfully")
    )

})

const deleteComment = asyncHandler(async(req, res)=>{
    const {commentId} = req.params;

    const comment = await Comment.findById(commentId)

    if (comment) {
        throw new ApiError(400, "omment not found" )
    }

    if (comment?.owner.toString() !== req.user?._id.toString() ) {
        throw new ApiError(400, "Only owner of this commet can delete this")
    }

    await Comment.findByIdAndDelete(commentId);

    await Like.deleteMany({
        comment:commentId,
        likedBy: req.user
    })

    return res
    .status(200)
    .json(
        new ApiResponse(200, {commentId} , "Comment deleted successfully")
    )
})

export {
        getVideoComment,
        addComment,
        deleteComment,
        updateComment
    };