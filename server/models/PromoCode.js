import mongoose from "mongoose";

const promoCodeSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true, uppercase: true },
    description: String,
    discountType: { 
        type: String, 
        enum: ['percentage', 'fixed'], 
        required: true 
    },
    discountValue: { 
        type: Number, 
        required: true, 
        min: 0 
    },
    minOrderAmount: { 
        type: Number, 
        default: 0 
    },
    maxDiscountAmount: { 
        type: Number 
    },
    usageLimit: { 
        type: Number, 
        default: null // null means unlimited
    },
    usedCount: { 
        type: Number, 
        default: 0 
    },
    validFrom: { 
        type: Date, 
        required: true 
    },
    validUntil: { 
        type: Date, 
        required: true 
    },
    applicableCategories: [String], // Which package categories this applies to
    createdBy: { 
        type: String, // Clerk ID of admin/agency who created it
        required: true 
    },
    isActive: { 
        type: Boolean, 
        default: true 
    }
}, { timestamps: true });

// Index for efficient lookup
promoCodeSchema.index({ code: 1 });
promoCodeSchema.index({ validFrom: 1, validUntil: 1 });

export default mongoose.model('PromoCode', promoCodeSchema);