
import CategoryMOdel from "../models/Category.js";
import skillModel from "../models/SkillStore.js";
import interestModel from "../models/Inerest.js";




 const seed = async()=>{



//  const categories =
//  await CategoryMOdel.insertMany([

//   {name:"Moving Help"},
//   {name:"Event Help"},
//   {name:"Companion"},
//   {name:"Sports Activity"},
//   {name:"Daily Help"},
//   {name:"Pet Care"}

//  ]);



//  await skillModel.insertMany([
//      {
//    name:"Box cricket ",
//     category:categories[3]._id
//   },
//       {
//    name:"cooking Helps",
//    category:categories[4]._id
//   },
//       {
//    name:"shopping clothes",
//    category:categories[4]._id
//   },
//       {
//    name:"Gardening help",
//    category:categories[4]._id
//   },
//       {
//    name:"helping in studies",
//    category:categories[4]._id
//   },

//      {
//    name:"Talking",
//    category:categories[2]._id
//   },
//      {
//    name:"Movies",
//    category:categories[2]._id
//   },
//      {
//    name:"Travel",
//    category:categories[2]._id
//   },
//      {
//    name:"Emotional Support",
//    category:categories[2]._id
//   },
//      {
//    name:"Shopping Companion",
//    category:categories[2]._id
//   },

//    {
//    name:"Decoration",
//    category:categories[1]._id
//   },

//    {
//    name:"Table setup ",
//    category:categories[1]._id
//   },

//    {
//    name:"Stage setup",
//    category:categories[1]._id
//   },

//    {
//    name:"Clean up",
//    category:categories[1]._id
//   },

//   {
//    name:"Furniture Arrangement",
//    category:categories[0]._id
//   },

//   {
//    name:"Box Labeling",
//    category:categories[0]._id
//   },

//   {
//    name:"Lifting",
//    category:categories[0]._id
//   },

//   {
//    name:"Packing",
//    category:categories[0]._id
//   },

//   {
//    name:"Cricket Partner",
//    category:categories[3]._id
//   },
//   {
//    name:"Football Partner",
//    category:categories[3]._id
//   },
//   {
//    name:"Running Partner",
//    category:categories[3]._id
//   },
//   {
//    name:"Yoga Partner",
//    category:categories[3]._id
//   },
//   {
//    name:"ChessPartner",
//    category:categories[3]._id
//   },
//   {
//    name:"badmantan Partner",
//    category:categories[3]._id
//   },

//   {
//    name:"pet Walking",
//    category:categories[5]._id
//   },
//   {
//    name:"pet sitting",
//    category:categories[5]._id
//   },
//   {
//    name:"Feeding Pets",
//    category:categories[5]._id
//   },
//   {
//    name:"Grooming Assistance",
//    category:categories[5]._id
//   }

//  ]);



 await interestModel.insertMany([

 

  {name:"painting"},
  {name:"Artist"},
  {name:"Gaming"},
  {name:"socaliable"},
  {name:"City Guide"},
 

 ]);



 console.log("Data inserted");

 process.exit();

};
export default seed



