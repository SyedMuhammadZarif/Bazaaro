"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Badge } from "../ui/badge"
import { Progress } from "../ui/progress"
import { Package, MessageCircle, TrendingUp, Crown, AlertTriangle } from "lucide-react"

export default function DashboardOverview() {
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/analytics/dashboard", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setAnalytics(data)
      }
    } catch (error) {
      console.error("Error fetching analytics:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
              <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-16 animate-pulse mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-24 animate-pulse"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">Failed to load analytics data</p>
      </div>
    )
  }

  const { overview, planUsage } = analytics

  return (
    <div className="space-y-6">
      {/* Plan Status Alert */}
      {planUsage.daysRemaining && planUsage.daysRemaining <= 7 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <p className="text-yellow-800">
                Your {planUsage.planType} plan expires in {planUsage.daysRemaining} days.
                <a href="/seller/subscription" className="underline ml-1">
                  Renew now
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Overview Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.totalProducts}</div>
            <p className="text-xs text-muted-foreground">{overview.featuredProducts} featured</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Chats</CardTitle>
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.activeChats}</div>
            <p className="text-xs text-muted-foreground">{overview.totalChats} total conversations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Inquiries</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.recentInquiries}</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Plan Usage</CardTitle>
            <Crown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {planUsage.currentProducts}/{planUsage.maxProducts}
            </div>
            <Progress value={(planUsage.currentProducts / planUsage.maxProducts) * 100} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              <Badge variant="outline" className="text-xs">
                {planUsage.planType}
              </Badge>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Top Products */}
      {analytics.topProducts && analytics.topProducts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Products</CardTitle>
            <CardDescription>Products with most inquiries</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.topProducts.map((item, index) => (
                <div key={item._id} className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <img
                      src={item.product.images?.[0] || "/placeholder.svg"}
                      alt={item.product.name}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{item.product.name}</p>
                    <p className="text-sm text-gray-500">${item.product.price}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary">{item.inquiries} inquiries</Badge>
                    <div className="flex items-center">
                      <span className="text-lg font-bold text-gray-900">#{index + 1}</span>
                    </div>
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
