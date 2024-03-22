import mongoose, {Schema}from 'mongoose'
import bcrypt from 'bcrypt'
import  jwt from 'jsonwebtoken'

const userSchema = new Schema({
    username:{
        type:String, 
        required:[true,'Username is required'],
        unique: true,
        lowercase: true,
        trim: true, //instructs Mongoose to automatically remove whitespace from the beginning and end of the string before saving it to the database. 
        index:true
    },
    email:{
        type:String, 
        required:[true,'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
    },
    fullName:{
        type:String, 
        required:[true,'Full Name is required'],
        trim: true,
        index:true,
    },
    avatar:{
        type:String, 
        required:true
    },
    covreImage:{
        type:String
    },
    watchHistory:[
        {
            type: Schema.Types.ObjectId,
            ref: "Video"
        }
    ],
    password:{
        type: String,
        required: [true,"Password is required"],
        
    },
    refreshToken:{
        type:String
    }

},{timestamps: true})


// Password Encryption 
userSchema.pre( 'save', async function (next) {
     if (!this.isModified('password')) return next();

     this.password = await bcrypt.hash(this.password ,10) 
     next()
 })

 userSchema.methods.matchPasswords=async function(password){
      return await bcrypt.compare(password, this.password)
}

// token 
userSchema.method.grantAccessToken = function(){
    return jwt.sign({
        _id: this._id,
        email : this.email,
        username: this.username,
        fullName:this.fullName
    },
    process.env.ACCESS_TOKEN_SECRET,
    {expiresIn:'1d'} 
    )
}
userSchema.method.grantRefreshToken = function(){
    return jwt.sign({
        _id: this._id
    },
    process.env.REFRESH_TOKEN_SECRET,
    {expiresIn:'30d'} 
    )
}


export const  User = mongoose.model("User", userSchema)
