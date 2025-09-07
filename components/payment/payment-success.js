"use client"
import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { CheckCircle, ArrowRight, Crown } from "lucide-react"

export default function PaymentSuccess() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [paymentData, setPaymentData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    const sessionId = searchParams.get("session_id")
    if (sessionId) {
      confirmPayment(sessionId)
    } else {
      setError("No session ID found")
      setLoading(false)
    }
  }, [searchParams])

  const confirmPayment = async (sessionId) => {
    try {
      const response = await fetch(`/api/payments/checkout-success?session_id=${sessionId}`, {
        credentials: "include",
      })

      if (response.ok) {
        const data = await response.json()
        setPaymentData(data)
      } else {
        setError("Payment confirmation failed")
      }
    } catch (error) {
      console.error("Error confirming payment:", error)
      setError("Payment confirmation failed")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Confirming your payment...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-red-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push("/seller/dashboard")}
            className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    )
  }

  const plan = paymentData?.plan

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md mx-auto text-center">
        <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
        <p className="text-gray-600 mb-8">Your subscription has been activated successfully.</p>

        {plan && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <div className="flex items-center justify-center mb-4">
              <Crown className="w-8 h-8 text-yellow-500 mr-2" />
              <h2 className="text-xl font-semibold capitalize">{plan.planType} Plan</h2>
            </div>

            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Plan Duration:</span>
                <span className="font-medium">
                  {plan.duration} month{plan.duration > 1 ? "s" : ""}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Amount Paid:</span>
                <span className="font-medium">${plan.price * plan.duration}</span>
              </div>
              <div className="flex justify-between">
                <span>Valid Until:</span>
                <span className="font-medium">{new Date(plan.endDate).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="mt-6 p-4 bg-green-50 rounded-lg">
              <h3 className="font-medium text-green-800 mb-2">What's included:</h3>
              <ul className="text-sm text-green-700 space-y-1">
                {plan.planType === "entrepreneur" ? (
                  <>
                    <li>• Up to 20 products</li>
                    <li>• 3 featured product slots</li>
                    <li>• Priority chat support</li>
                    <li>• Advanced analytics</li>
                  </>
                ) : (
                  <>
                    <li>• Up to 100 products</li>
                    <li>• 10 featured product slots</li>
                    <li>• 24/7 premium support</li>
                    <li>• Comprehensive analytics</li>
                    <li>• Custom branding options</li>
                  </>
                )}
              </ul>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={() => router.push("/seller/dashboard")}
            className="w-full bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center"
          >
            Go to Dashboard
            <ArrowRight className="w-4 h-4 ml-2" />
          </button>

          <button
            onClick={() => router.push("/store")}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Browse Products
          </button>
        </div>
      </div>
    </div>
  )
}
