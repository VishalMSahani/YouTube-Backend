import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {Subscription} from '../models/subscription.model.js'



const toogleSubscribe = asyncHandler(async(req, res) =>{

    const {channelId} = req.params

    const channel =  await Subscription.findById(channelId);

    if (!channel) {
        throw new ApiError(400, "Channel not found")
    }

    const isSubscribed = Subscription.findOne({
            subscriber: req.user._id,
            channel:channelId
    })

    if (isSubscribed) {
        await Subscription.findByIdAndDelete(isSubscribed?._id)

        return res
        .status(200)
        .json(new ApiResponse(200, {isSubscribed:false}, "Unsubscribe success"))
    }

    await Subscription.create({
        subscriber:req.user._id,
         channel:channelId
    })
    return res
    .status(201)
    .json(new ApiResponse(200, {isSubscribed:true},"Subscribe Success"));

})