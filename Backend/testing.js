 import buddyModel from "./models/BuddySchema.js"
import skillModel from "./models/SkillStore.js"
 

 export const selectcategory =  async( req,res)=>{
  
//  const categoryId = "69d757cf549501ed01eae8ad"

//   const findtheperson = await buddyModel.find({category:categoryId})

//   console.log("checking :: ",findtheperson)

const skillId = "69d757d1549501ed01eae8c2"
 const findSkill = await buddyModel.find({skills:skillId})
 console.log(findSkill)
}


