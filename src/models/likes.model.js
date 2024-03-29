import mongoose, {Schema} from 'mongoose'

const likeSchema = new  Schema({

    likeComment:{
        type: Schema.Types.ObjectId,
        ref: "Comment"
    },

    likeVideo:{
        type: Schema.Types.ObjectId,
        ref: "Video",
    },

    likeTweet:{
        type:Schema.Types.ObjectId,
        ref: "Tweet"
    },

    like:{
        type: Schema.Types.ObjectId,
        ref: "User"
    }
},{timestamps:true})

export const  Like= mongoose.model("Like",likeSchema)