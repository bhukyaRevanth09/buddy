import mongoose from "mongoose";

const interestSchema = new mongoose.Schema({

 name:{
  type:String,
  required:true,
  unique:true
 },

 isActive:{
  type:Boolean,
  default:true
 }

},
{timestamps:true});

const interestModel =  mongoose.model(
 "Interest",
 interestSchema
);

export default interestModel