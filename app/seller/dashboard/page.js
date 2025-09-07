"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/tabs"
import DashboardOverview from "../../../components/seller/dashboard-overview"
import ProductManagement from "../../../components/seller/product-management"
import SubscriptionManagement from "../../../components/seller/subscription-management"
import ProtectedRoute from "../../../components/protected-route"
import { BarChart3, Package, Crown, MessageCircle, Settings, Home } from "lucide-react"
import { Button } from "../../../components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "../../../components/ui/avatar"
import { useAuth } from "../../../lib/auth-context"
import Link from "next/link"

export default function SellerDashboard() {
  const [activeTab, setActiveTab] = useState("overview")
  const { user, logout } = useAuth()
  const router = useRouter()

  const handleLogout = async () => {
    await logout()
    router.push("/")
  }

  return (
    <ProtectedRoute requiredRole="seller">
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-4">
                <Link href="/">
                  <Button variant="ghost" size="sm">
                    <Home className="h-4 w-4 mr-2" />
                    Home
                  </Button>
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">Seller Dashboard</h1>
              </div>

              <div className="flex items-center space-x-4">
                <Link href="/chat">
                  <Button variant="ghost" size="sm">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Messages
                  </Button>
                </Link>

                <div className="flex items-center space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.profilePicture || "/placeholder.svg"} />
                    <AvatarFallback className="bg-red-100 text-red-600">
                      {user?.name?.charAt(0)?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden sm:block">
                    <p className="text-sm font-medium">{user?.name}</p>
                    <p className="text-xs text-gray-500">Seller Account</p>
                  </div>
                </div>

                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview" className="flex items-center space-x-2">
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline">Overview</span>
              </TabsTrigger>
              <TabsTrigger value="products" className="flex items-center space-x-2">
                <Package className="h-4 w-4" />
                <span className="hidden sm:inline">Products</span>
              </TabsTrigger>
              <TabsTrigger value="subscription" className="flex items-center space-x-2">
                <Crown className="h-4 w-4" />
                <span className="hidden sm:inline">Subscription</span>
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center space-x-2">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Settings</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <DashboardOverview />
            </TabsContent>

            <TabsContent value="products">
              <ProductManagement />
            </TabsContent>

            <TabsContent value="subscription">
              <SubscriptionManagement />
            </TabsContent>

            <TabsContent value="settings">
              <div className="text-center py-12">
                <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Settings</h3>
                <p className="text-gray-500">Account settings and preferences coming soon</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </ProtectedRoute>
  )
}
