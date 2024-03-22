import mongoose, {Schema} from 'mongoose'

const videoSchema = new Schema({
    title:{
        type: String,
        required: [true, "title is required"],
    },
    videofile:{
        type: String,
        required: [true, "video is required"],
    },
    thumbnail:{
        type:String,
        required:true
    },
    description:{
        type:String,
        required:true
    },
    duration:{
        type:Number,
    },
    views:{
        type:Number,
        default: 0
    },
    isPublished:{
        type:Boolean,
        default : true
    },
    owner:{
        type: Schema.Types.ObjectId,
        ref: "User"
    }

},{timestamps:true})

export  const Video = mongoose.model("Video", videoSchema)