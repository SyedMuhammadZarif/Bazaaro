import mongoose from "mongoose"

const planSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    planType: {
      type: String,
      enum: ["entrepreneur", "enterprise"],
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 1000,
    },
    duration: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
    startDate: {
      type: Date,
      default: Date.now,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
      default: function () {
        const d = new Date(this.startDate)
        d.setMonth(d.getMonth() + this.duration)
        return d
      },
    },
    isActive: {
      type: Boolean,
      default: false,
    },
    stripeSessionId: {
      type: String,
      default: null,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "completed", "failed", "cancelled"],
      default: "pending",
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
    features: {
      maxProducts: {
        type: Number,
        default: function () {
          return this.planType === "entrepreneur" ? 20 : 100
        },
      },
      maxPosts: {
        type: Number,
        default: function () {
          return this.planType === "entrepreneur" ? 50 : 200
        },
      },
      featuredProducts: {
        type: Number,
        default: function () {
          return this.planType === "entrepreneur" ? 3 : 10
        },
      },
      prioritySupport: {
        type: Boolean,
        default: function () {
          return this.planType === "enterprise"
        },
      },
    },
  },
  { timestamps: true },
)

planSchema.pre("save", function (next) {
  if (this.isModified("startDate") || this.isModified("duration")) {
    const endDate = new Date(this.startDate)
    endDate.setMonth(endDate.getMonth() + this.duration)
    this.endDate = endDate
  }
  next()
})

const Plan = mongoose.model("Plan", planSchema)
export default Plan
