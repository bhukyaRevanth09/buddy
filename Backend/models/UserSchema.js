import mongoose from 'mongoose'



const userSchema = new mongoose.Schema({

 name:{
    type:String,
    required:true,
    trim:true
 },
 email:{
    type:String,
    required:true,
    lowercase:true,
    unique:true,
    index:true
 },
 password:{type:String,required:true},
 phone:{type:String,unique:true},
 role:{
    type:String,
    enum:["user"],
    default:"user",
    index:true
 },
 isActive:{type:Boolean,default:true},
 walletBalance:{type:Number,default:0},
 profile:{type:String},
 address:{
    city:String,
    state:String,
    pincode:String
 },
 geoLocation:{
    type:{
        type:String,
        enum:["Point"],
        default:"Point"
    },
    coordinates:{
        type:[Number]
    }
 },



},{timestamps:true});

userSchema.index({geoLocation: "2dsphere"});


const userModel = mongoose.model("user",userSchema)

export default userModel