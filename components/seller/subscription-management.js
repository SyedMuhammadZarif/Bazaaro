"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import { Crown, Calendar, CreditCard, CheckCircle, AlertTriangle, Zap, Package, X } from "lucide-react"

export default function SubscriptionManagement() {
  const [subscription, setSubscription] = useState(null)
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => {
    fetchSubscription()
  }, [])

  const fetchSubscription = async () => {
    try {
      const response = await fetch("/api/analytics/subscription", {
        credentials: "include",
      })

      if (response.ok) {
        const data = await response.json()
        setSubscription(data)
      }
    } catch (error) {
      console.error("Error fetching subscription:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpgrade = async (planType, duration = 1) => {
    try {
      const response = await fetch("/api/payments/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ planType, duration }),
        credentials: "include",
      })

      if (response.ok) {
        const { url } = await response.json()
        window.location.href = url
      } else {
        console.error("Failed to create checkout session")
      }
    } catch (error) {
      console.error("Error creating checkout session:", error)
    }
  }

  const handleCancelSubscription = async () => {
    if (!confirm("Are you sure you want to cancel your subscription? You'll lose access to premium features.")) {
      return
    }

    setCancelling(true)
    try {
      const response = await fetch("/api/payments/cancel-subscription", {
        method: "POST",
        credentials: "include",
      })

      if (response.ok) {
        await fetchSubscription() // Refresh subscription data
        alert("Subscription cancelled successfully")
      } else {
        alert("Failed to cancel subscription")
      }
    } catch (error) {
      console.error("Error cancelling subscription:", error)
      alert("Failed to cancel subscription")
    } finally {
      setCancelling(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded w-64 animate-pulse"></div>
        <div className="grid gap-6 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded w-24 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  const plans = [
    {
      name: "Free",
      price: 0,
      type: "free",
      features: [
        "Up to 5 products",
        "Up to 5 posts",
        "Basic chat support",
        "Standard listing visibility",
        "Basic analytics",
      ],
      icon: Package,
      color: "gray",
    },
    {
      name: "Entrepreneur",
      price: 10,
      type: "entrepreneur",
      features: [
        "Up to 20 products",
        "Up to 50 posts",
        "Priority chat support",
        "Enhanced listing visibility",
        "Advanced analytics",
        "3 featured product slots",
      ],
      icon: Zap,
      color: "blue",
      popular: true,
    },
    {
      name: "Enterprise",
      price: 50,
      type: "enterprise",
      features: [
        "Up to 100 products",
        "Up to 200 posts",
        "24/7 premium support",
        "Maximum visibility boost",
        "Comprehensive analytics",
        "10 featured product slots",
        "Custom branding options",
      ],
      icon: Crown,
      color: "purple",
    },
  ]

  const currentPlan = subscription?.activePlan
  const daysRemaining = currentPlan
    ? Math.ceil((new Date(currentPlan.endDate) - new Date()) / (1000 * 60 * 60 * 24))
    : null

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Subscription Management</h2>
        <p className="text-gray-600">Manage your subscription plan and billing</p>
      </div>

      {/* Current Plan Status */}
      {currentPlan && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <CardTitle className="text-green-800">Active Subscription</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-green-100 text-green-800 capitalize">{currentPlan.planType}</Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancelSubscription}
                  disabled={cancelling}
                  className="text-red-600 border-red-200 hover:bg-red-50 bg-transparent"
                >
                  {cancelling ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                  ) : (
                    <>
                      <X className="h-4 w-4 mr-1" />
                      Cancel
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-green-700">Plan Type</p>
                <p className="font-semibold text-green-900 capitalize">{currentPlan.planType}</p>
              </div>
              <div>
                <p className="text-sm text-green-700">Amount Paid</p>
                <p className="font-semibold text-green-900">${currentPlan.price * currentPlan.duration}</p>
              </div>
              <div>
                <p className="text-sm text-green-700">Expires</p>
                <p className="font-semibold text-green-900">{new Date(currentPlan.endDate).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-green-700">Days Remaining</p>
                <p className="font-semibold text-green-900">{daysRemaining} days</p>
              </div>
            </div>

            {daysRemaining <= 7 && (
              <div className="mt-4 p-3 bg-yellow-100 border border-yellow-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <p className="text-sm text-yellow-800">
                    Your subscription expires soon. Renew to continue enjoying premium features.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Plan Options */}
      <div className="grid gap-6 md:grid-cols-3">
        {plans.map((plan) => {
          const Icon = plan.icon
          const isCurrentPlan = currentPlan?.planType === plan.type || (!currentPlan && plan.type === "free")

          return (
            <Card
              key={plan.type}
              className={`relative ${
                plan.popular ? "border-blue-200 shadow-lg" : ""
              } ${isCurrentPlan ? "ring-2 ring-green-500" : ""}`}
            >
              {plan.popular && (
                <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-blue-500">Most Popular</Badge>
              )}

              <CardHeader className="text-center">
                <div
                  className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center ${
                    plan.color === "gray" ? "bg-gray-100" : plan.color === "blue" ? "bg-blue-100" : "bg-purple-100"
                  }`}
                >
                  <Icon
                    className={`h-6 w-6 ${
                      plan.color === "gray"
                        ? "text-gray-600"
                        : plan.color === "blue"
                          ? "text-blue-600"
                          : "text-purple-600"
                    }`}
                  />
                </div>
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <div className="text-3xl font-bold">
                  ${plan.price}
                  <span className="text-sm font-normal text-gray-500">/month</span>
                </div>
              </CardHeader>

              <CardContent>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                {isCurrentPlan ? (
                  <Button disabled className="w-full">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Current Plan
                  </Button>
                ) : plan.type === "free" ? (
                  <Button variant="outline" disabled className="w-full bg-transparent">
                    Downgrade to Free
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleUpgrade(plan.type)}
                    className={`w-full ${
                      plan.popular ? "bg-blue-500 hover:bg-blue-600" : "bg-red-500 hover:bg-red-600"
                    }`}
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    {currentPlan ? "Upgrade" : "Subscribe"}
                  </Button>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Billing History */}
      {subscription?.planHistory && subscription.planHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Billing History</CardTitle>
            <CardDescription>Your recent subscription transactions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {subscription.planHistory.map((plan) => (
                <div key={plan._id} className="flex items-center justify-between py-3 border-b last:border-b-0">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        plan.isActive ? "bg-green-100" : "bg-gray-100"
                      }`}
                    >
                      <Calendar className={`h-4 w-4 ${plan.isActive ? "text-green-600" : "text-gray-600"}`} />
                    </div>
                    <div>
                      <p className="font-medium capitalize">{plan.planType} Plan</p>
                      <p className="text-sm text-gray-500">
                        {new Date(plan.startDate).toLocaleDateString()} - {new Date(plan.endDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">${plan.price * plan.duration}</p>
                    <Badge
                      variant={
                        plan.isActive ? "default" : plan.paymentStatus === "cancelled" ? "destructive" : "secondary"
                      }
                      className="text-xs"
                    >
                      {plan.isActive ? "Active" : plan.paymentStatus === "cancelled" ? "Cancelled" : "Expired"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
