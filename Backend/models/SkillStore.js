import mongoose from "mongoose";

const skillSchema = new mongoose.Schema({

 name:{
  type:String,
  required:true
 },

 category:{
  type:mongoose.Schema.Types.ObjectId,
  ref:"Category",
  required:true
 },

 isActive:{
  type:Boolean,
  default:true
 }

},
{timestamps:true});

const skillModel =  mongoose.model(
 "Skill",
 skillSchema
);

export default  skillModel