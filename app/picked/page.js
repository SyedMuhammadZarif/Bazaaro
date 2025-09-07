"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Heart, MessageCircle, Trash2 } from "lucide-react"
import { useAuth } from "../../lib/auth-context"
import { apiClient } from "../../lib/api-client"
import Navbar from "../../components/layout/navbar"

export default function PickedItemsPage() {
  const [pickedItems, setPickedItems] = useState([])
  const [loading, setLoading] = useState(true)
  const { user, isAuthenticated } = useAuth()

  useEffect(() => {
    if (isAuthenticated) {
      fetchPickedItems()
    }
  }, [isAuthenticated])

  const fetchPickedItems = async () => {
    try {
      console.log("[v0] Fetching picked items for user:", user?._id)
      const response = await apiClient.getPickedItems()
      console.log("[v0] Picked items API response:", response)
      setPickedItems(response.pickedItems || [])
    } catch (error) {
      console.error("Error fetching picked items:", error)
    } finally {
      setLoading(false)
    }
  }

  const removePickedItem = async (productId) => {
    try {
      await apiClient.removePickedItem(productId)
      setPickedItems((prev) => prev.filter((item) => item.product._id !== productId))
    } catch (error) {
      console.error("Error removing picked item:", error)
    }
  }

  const startChatAndRemove = async (item) => {
    try {
      const sellerId = item.product.owner?._id || item.product.seller
      console.log("[v0] Starting chat with seller:", sellerId, "for product:", item.product._id)

      // Create chat first using the same API as store tab
      const response = await fetch("/api/chat/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          participantId: sellerId,
          productId: item.product._id,
        }),
      })

      if (response.ok) {
        const chat = await response.json()
        
        // Remove item from picked list
        await apiClient.removePickedItem(item.product._id)
        setPickedItems((prev) => prev.filter((pickedItem) => pickedItem.product._id !== item.product._id))

        // Redirect to chat with the created chat ID
        window.location.href = `/chat?chatId=${chat._id}`
      } else {
        alert("Error starting chat. Please try again.")
      }
    } catch (error) {
      console.error("Error starting chat and removing item:", error)
      alert("Error starting chat. Please try again.")
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Heart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Login Required</h2>
            <p className="text-gray-600 mb-6">Please login to view your picked items</p>
            <Button onClick={() => (window.location.href = "/login")}>Login</Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-4xl mx-auto p-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Picked Items</h1>
          <p className="text-gray-600">Items you&apos;ve saved for later</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
          </div>
        ) : pickedItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pickedItems.map((item) => (
              <Card key={item._id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="aspect-square relative">
                    <img
                      src={item.product.images?.[0] || "/placeholder.svg"}
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-lg mb-2">{item.product.name}</h3>
                    <p className="text-red-600 font-bold text-xl mb-2">${item.product.price}</p>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{item.product.description}</p>

                    <div className="flex gap-2">
                      <Button className="flex-1" onClick={() => startChatAndRemove(item)}>
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Start Chat
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => removePickedItem(item.product._id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Heart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No picked items yet</h2>
            <p className="text-gray-600 mb-6">Start browsing and pick items you like!</p>
            <Button onClick={() => (window.location.href = "/?tab=store")}>Browse Products</Button>
          </div>
        )}
      </div>
    </div>
  )
}
