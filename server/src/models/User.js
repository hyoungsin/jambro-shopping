import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    email: { 
      type: String, 
      required: true, 
      trim: true,
      unique: true,
      lowercase: true
    },
    name: { 
      type: String, 
      required: true, 
      trim: true 
    },
    password: { 
      type: String, 
      required: true 
    },
    userType: { 
      type: String, 
      required: true,
      enum: ['customer', 'admin'],
      default: 'customer'
    },
    address: { 
      type: String, 
      required: false,
      trim: true
    }
  },
  { timestamps: true }
);

export const User = mongoose.model('User', userSchema);

