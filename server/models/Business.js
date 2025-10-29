import mongoose from "mongoose";

const addressSchema = new mongoose.Schema({
    street:String,
    city:String,
    state:String,
    zipcode:String,
    country:String
})


const socialSchema = new mongoose.Schema({
    facebook:String,
    instagram:String,
    twitter:String,
    youtube:String,
    linkedin:String
})

const businessSchema = new mongoose.Schema({
    ownerClerkId:{type:String,required:true},
    agencyName:{type :String, required:true}, // Changed from businessName
    businessName:{type:String}, // Keep for backward compatibility
    description:{type:String},
    category:{
        type:String,
        enum:[
            'Adventure Tours', 'Beach Holidays', 'City Breaks', 'Cultural Tours',
            'Cruise Packages', 'Mountain Expeditions', 'Safari Tours', 'Luxury Travel',
            'Budget Travel', 'Family Packages', 'Honeymoon Specials', 'Business Travel',
            'Religious Tours', 'Educational Tours', 'Food & Wine Tours', 'Other'
        ],
        required:true
    },
    email:{type:String,required:true},
    phone:{type:String,required:true},
    website:{type:String},
    imageUrl:{type:String}, // Agency image
    address:{type:addressSchema,default: () => ({}) },
    socialMedia: { type: socialSchema, default: () => ({}) },



},{timestamps:true })
export default mongoose.model('Business',businessSchema)