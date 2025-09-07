// controllers/payment.controller.js
import Stripe from "stripe"
import Plan from "../models/plan.model.js"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

// Create a checkout session
export const createCheckoutSession = async (req, res) => {
  try {
    const { planType, duration } = req.body
    const userId = req.user._id

    const planPrices = {
      entrepreneur: 1000, // $10
      enterprise: 5000, // $50
    }

    if (!planPrices[planType]) {
      return res.status(400).json({ message: "Invalid plan type" })
    }

    const price = planPrices[planType]

    // Deactivate any existing active plans
    await Plan.updateMany({ user: userId, isActive: true }, { isActive: false })

    // Create plan but keep inactive until confirmed
    const plan = new Plan({
      user: userId,
      planType,
      price,
      duration,
      isActive: false,
    })
    await plan.save()

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `${planType.charAt(0).toUpperCase() + planType.slice(1)} Plan (${duration} month${duration > 1 ? "s" : ""})`,
              description: `Bazaaro Media ${planType} subscription`,
            },
            unit_amount: price * duration,
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.CLIENT_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/seller/dashboard?tab=subscription`,
      metadata: {
        planId: plan._id.toString(),
        userId: userId.toString(),
      },
    })

    res.json({ id: session.id, url: session.url })
  } catch (error) {
    console.error("Payment session creation error:", error)
    res.status(500).json({ message: "Payment session creation failed" })
  }
}

// After Stripe redirects here (success page)
export const checkoutSuccess = async (req, res) => {
  try {
    const { session_id } = req.query

    if (!session_id) {
      return res.status(400).json({ message: "Session ID is required" })
    }

    const session = await stripe.checkout.sessions.retrieve(session_id)

    if (!session) {
      return res.status(404).json({ message: "Session not found" })
    }

    const planId = session.metadata.planId

    // Mark plan as active and set proper dates
    const updatedPlan = await Plan.findByIdAndUpdate(
      planId,
      {
        isActive: true,
        startDate: new Date(),
        stripeSessionId: session_id,
        paymentStatus: "completed",
      },
      { new: true },
    )

    if (!updatedPlan) {
      return res.status(404).json({ message: "Plan not found" })
    }

    res.json({
      message: "Payment successful, plan activated",
      plan: updatedPlan,
    })
  } catch (error) {
    console.error("Payment confirmation error:", error)
    res.status(500).json({ message: "Payment confirmation failed" })
  }
}

export const handleWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"]
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET

  let event

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret)
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message)
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  // Handle the event
  switch (event.type) {
    case "checkout.session.completed":
      const session = event.data.object
      const planId = session.metadata.planId

      // Activate the plan
      await Plan.findByIdAndUpdate(planId, {
        isActive: true,
        stripeSessionId: session.id,
        paymentStatus: "completed",
      })
      break

    case "checkout.session.expired":
      const expiredSession = event.data.object
      const expiredPlanId = expiredSession.metadata.planId

      // Remove the inactive plan
      await Plan.findByIdAndDelete(expiredPlanId)
      break

    default:
      console.log(`Unhandled event type ${event.type}`)
  }

  res.json({ received: true })
}

export const cancelSubscription = async (req, res) => {
  try {
    const userId = req.user._id

    // Deactivate current active plan
    const updatedPlan = await Plan.findOneAndUpdate(
      { user: userId, isActive: true },
      {
        isActive: false,
        cancelledAt: new Date(),
        paymentStatus: "cancelled",
      },
      { new: true },
    )

    if (!updatedPlan) {
      return res.status(404).json({ message: "No active subscription found" })
    }

    res.json({
      message: "Subscription cancelled successfully",
      plan: updatedPlan,
    })
  } catch (error) {
    console.error("Subscription cancellation error:", error)
    res.status(500).json({ message: "Subscription cancellation failed" })
  }
}
