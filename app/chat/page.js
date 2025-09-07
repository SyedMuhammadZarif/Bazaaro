"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, MessageCircle, User, Store } from "lucide-react"
import { Button } from "../../components/ui/button"
import ChatList from "../../components/chat/chat-list"
import ChatWindow from "../../components/chat/chat-window"
import ProtectedRoute from "../../components/protected-route"
import { useAuth } from "../../lib/auth-context"
import { useSearchParams } from "next/navigation"

export default function ChatPage() {
  const [selectedChat, setSelectedChat] = useState(null)
  const { user, isAuthenticated } = useAuth()
  const searchParams = useSearchParams()

  useEffect(() => {
    const chatId = searchParams.get("chatId")
    const sellerId = searchParams.get("seller")

    if (chatId && isAuthenticated) {
      fetchChatById(chatId)
    } else if (sellerId && isAuthenticated) {
      createChatWithSeller(sellerId)
    }
  }, [searchParams, isAuthenticated])

  const fetchChatById = async (chatId) => {
    try {
      const response = await fetch(`/api/chat/${chatId}/messages`, {
        credentials: "include",
      })
      if (response.ok) {
        const data = await response.json()
        setSelectedChat(data.chat)
      }
    } catch (error) {
      console.error("Error fetching chat:", error)
    }
  }

  const createChatWithSeller = async (sellerId) => {
    try {
      const response = await fetch("/api/chat/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ participantId: sellerId }),
      })
      if (response.ok) {
        const chat = await response.json()
        setSelectedChat(chat)
      }
    } catch (error) {
      console.error("Error creating chat:", error)
    }
  }

  const handleChatSelect = (chat) => {
    setSelectedChat(chat)
  }

  const handleChatUpdate = () => {
    // Refresh the chat list when a chat is updated (ended, deleted, etc.)
    // This will trigger a re-render of ChatList component
    setSelectedChat(null)
    setTimeout(() => {
      // Small delay to ensure the chat list refreshes
      window.location.reload()
    }, 100)
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 pb-16">
        <div className="bg-white border-b border-gray-200 px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center">
            <Link href="/">
              <Button variant="ghost" size="sm" className="mr-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </Link>
            <h1 className="text-xl font-semibold text-gray-900">Messages</h1>
          </div>
        </div>

        <div className="max-w-7xl mx-auto">
          <div className="flex" style={{ height: "calc(100vh - 140px)" }}>
            <ChatList onChatSelect={handleChatSelect} selectedChatId={selectedChat?._id} />
            <ChatWindow chat={selectedChat} currentUserId={user?._id} onChatUpdate={handleChatUpdate} />
          </div>
        </div>

        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
          <div className="flex items-center justify-around py-2">
            <Button
              variant="ghost"
              size="icon"
              className="flex-col gap-1 h-12"
              onClick={() => (window.location.href = "/")}
            >
              <div className="h-6 w-6 bg-gray-300 rounded-full flex items-center justify-center">
                <div className="h-2 w-2 bg-gray-600 rounded-full"></div>
              </div>
              <span className="text-xs">Feed</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="flex-col gap-1 h-12"
              onClick={() => (window.location.href = "/?tab=store")}
            >
              <Store className="h-6 w-6" />
              <span className="text-xs">Store</span>
            </Button>
            <Button variant="default" size="icon" className="flex-col gap-1 h-12">
              <MessageCircle className="h-6 w-6" />
              <span className="text-xs">Chat</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="flex-col gap-1 h-12"
              onClick={() => (window.location.href = isAuthenticated ? `/profile/${user?._id}` : "/login")}
            >
              <User className="h-6 w-6" />
              <span className="text-xs">Profile</span>
            </Button>
          </div>
        </nav>
      </div>
    </ProtectedRoute>
  )
}
