import mongoose, {isValidObjectId} from 'mongoose'
import { ApiError } from '../utils/apiError'
import { ApiResponse } from '../utils/apiResponse'
import Video from '../models/video.model.js'
import Playlist from '../models/playlist.model.js'
import { asyncHandler } from '../utils/asyncHandler'

const createPlaylist = asyncHandler(async(req, res) => {

    const {name, description} = req.body


    if(!name || !description){
        throw new ApiError(400,'Name and description is required ')
    }

    const playlist = await Playlist.create({
        name,
        description,
        owner:req.user?._id,
    })

    if (!playlist) {
        throw new ApiResponse(400, "Faild to create playlist please try again!!")
    }
    
    return res
    .status(200)
    .json(
        new ApiResponse(200,playlist, "Playlist created successfully")
    )

});

const addVideoToPlaylist = asyncHandler(async(req, res)=>{

    const {videoId, playlistId}= req.params;

    const playlist =await Playlist.findById(playlistId);
    
    if(!playlist){
        throw new ApiError(400,'Playlist not found')
    }

    const video = await Video.findById(videoId);

    if(!video){ 
        throw new ApiError(400, 'Video not found')
    }

    if (playlist.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(400,"only owner can update this playlist")
    }

    const addVideo = await Playlist.findByIdAndUpdate(
        playlist?._id,
        {
           $addToSet:{
                videos :videoId
           } 
        },{new:true})

    if (!addVideo) {
        throw new ApiError(400, "Failed to update or add video to the playlist")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, addVideo, "Added video to playlist successfully")

    )
});

const updatePlaylist  = asyncHandler(async (req, res)=>{

    const {description, name} = req.body
    const {playlistId} = req.params

    if(!description || !name){
        throw new ApiError(400, "Name and description is required")
    }

    const playlist = await Playlist.findById(playlistId);

    if (playlist) {
        throw new ApiError(400,"playlist not found")
    }

    if (playlist.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(400, "You can not update playlist only owner can")
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlist?._id,
        {    name: name,
             description :description
            },{new:true})

    if (!updatedPlaylist) {
        throw new ApiError(400,"filed to update playlist")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, "Playlist updated successfully")
    )
})

const deletePlaylist = asyncHandler(async(req,res)=>{

    const {playlistId} = req.params;

    const playlist = await Playlist.findById(playlistId)

    if (!playlist) {
        throw new ApiResponse(200, "Playlist not found")
    }

    if (playlist.owner.toString() !== req.user?._id.toString()){
        throw new ApiError(400, "Only owner can delete this playlist")
    }

    const deletedPlaylist = await Playlist.findByIdAndDelete(playlist?._id)

    if (!deletedPlaylist) {
        throw new ApiError(400, "Filed to delete playlist")
    }

    return res
    .status(200)
    .json(
        new ApiResponse
        (200, {},"playlist deleted successfully")
        )

})

const removeVideoFromPlaylist = asyncHandler(async(req,res)=>{

    const {playlistId, videoId} = req.params

    const video = await Video.findById(videoId)

    const playlist = await Playlist.findById(playlistId)

    if (!video) {
        throw new ApiError(400, "video not found")
    }

    if (!playlist) {
        throw new ApiError(400, "playlist not found")
    }

    if (playlist.owner.toString() !== req.user?._id.toString()){
        throw new ApiError(400, "Only owner can delete video from this playlist")
    }

    const removeFromPlaylist = await Playlist.findByIdAndUpdate(
        playlist?._id,
        { 
            $pull:{
                videos:videoId
            }},{new:true}
    )

    return res
    .status(200)
    .json(
        new ApiResponse(
            400,removeFromPlaylist , "Video removed successfully from the playlist"
        )
    )
})
 
const getUserPlaylist = asyncHandler(async(req, res)=>{

    const {userId} = req.params

    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid userId");
    }

    const playlist = await Playlist.aggregate([
        {
            $match: {
                owner:new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup:{
                from: "videos",
                localField: "videos",
                foreignField: "_id",
                as: "videos"
            }
        },
        {
           $addFields:{
            totalVideos:{
                $size:"$videos"
            },
            totalView:{
                $sum:"$videos.views"
            }
           }
        },
        {
            $project:{
                _id:1,
                name:1,
                description:1,
                totalVideos:1,
                totalView:1,
                updatedAt:1

            }
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(200,playlist, "User Playlist Fetched Successfully")
    )

})




const getPlaylistById = asyncHandler(async(req, res)=>{

    const {playlistId} = req.params

    if (!isValidObjectId(playlistId)){
        throw new ApiError(400, "Playlist does not exist")
    }

    const playlist = await Playlist.findById(playlistId);

    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    const playListVideos = await Playlist.aggregate([
        {
            $match:{
                _id:new mongoose.Types.ObjectId(playlistId)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "videos",
                foreignField: "_id",
                as: "videos",
            }
        },
        {
            $match:{
                "videos.isPublished": true
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
            } 
        },
        {
            $addFields: {
                totalVideos: {
                    $size: "$videos"
                },
                totalViews: {
                    $sum: "$videos.views"
                },
                owner: {
                    $first: "$owner"
                }
            }
        },
        {
            $project: {
                name: 1,
                description: 1,
                createdAt: 1,
                updatedAt: 1,
                totalVideos: 1,
                totalViews: 1,
                videos: {
                    _id: 1,
                    "videoFile.url": 1,
                    "thumbnail.url": 1,
                    title: 1,
                    description: 1,
                    duration: 1,
                    createdAt: 1,
                    views: 1
                },
                owner: {
                    username: 1,
                    fullName: 1,
                    "avatar.url": 1
                }
            }
        }
    ])

    return res
    .json(200)
    .json(
        new ApiResponse(200, playListVideos, "Playlist by id fetched successfully")
    )

})

export {createPlaylist,
        addVideoToPlaylist,
        updatePlaylist,
        deletePlaylist,
        removeVideoFromPlaylist,
        getUserPlaylist,
        getPlaylistById
        }
