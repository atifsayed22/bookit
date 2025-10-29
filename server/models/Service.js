import mongoose from "mongoose";

const serviceSchema = new mongoose.Schema({
    business:{type:mongoose.Schema.Types.ObjectId, ref:'Business',required:true,index:true},
    packageName:{type:String,required:true}, // Changed from 'name'
    destination:{type:String,required:true}, // New field for travel destination
    description:String,
    durationDays:{type:Number,required:true,min:1}, // Changed from durationMinutes
    price:{type:Number, required:true,min:0},
    discountPrice:{type:Number,min:0}, // New field for discounted pricing
    category:{
        type:String,
        enum:[
            'Adventure', 'Beach', 'City Break', 'Cultural', 'Cruise', 
            'Mountain', 'Safari', 'Luxury', 'Budget', 'Family', 
            'Honeymoon', 'Business', 'Religious', 'Educational', 'Food & Wine'
        ],
        default:"Adventure"
    },
    inclusions:[String], // What's included in the package
    exclusions:[String], // What's not included
    images:[String], // Package images
    availableDates:[Date], // Available departure dates
    isActive:{type:Boolean,default:true},
    // Promo Code fields
    promoCode: { type: String, default: "" }, // Promo code for discounts
    promoDiscount: { type: Number, default: 0, min: 0, max: 50 }, // Discount percentage
    promoCodeActive: { type: Boolean, default: false } // Whether promo is currently active

},{timestamps:true})

export default mongoose.model('Service',serviceSchema)