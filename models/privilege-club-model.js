const mongoose = require("mongoose");

const privilegeClubSchema = new mongoose.Schema(
  {
    fullname: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    phone: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "active", "inactive"],
      default: "active",
    },

    joinedAt: {
      type: Date,
      default: Date.now,
    },

    benefits: {
      exclusiveDiscount: {
        type: Number,
        default: 15, // 15% discount
      },
      freeShipping: {
        type: Boolean,
        default: true,
      },
      earlyAccess: {
        type: Boolean,
        default: true,
      },
      watchServicing: {
        type: Boolean,
        default: true, // Free watch servicing once per year
      },
      watchCleanPolish: {
        type: Boolean,
        default: true, // Free cleaning and polishing service
      },
      extendedWarranty: {
        type: Number,
        default: 1, // Extended warranty in years
      },
      lastServicingDate: {
        type: Date,
        default: null, // Track last servicing for annual limit
      },
    },
  },
  { timestamps: true },
);

const PrivilegeClub = mongoose.model("privilegeClub", privilegeClubSchema);
module.exports = PrivilegeClub;
