import mongoose from "mongoose";

const categorySchema = new mongoose.Schema({

 name:{
  type:String,
  required:true,
  unique:true,
  trim:true
 },

 icon:String,

 isActive:{
  type:Boolean,
  default:true
 },

 order:Number

},
{timestamps:true});

const CategoryMOdel =  mongoose.model(
 "Category",
 categorySchema
);
export default CategoryMOdel;