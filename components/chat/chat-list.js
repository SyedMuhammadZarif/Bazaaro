"use client"

import { useState, useEffect } from "react"
import { MessageCircle, Search, Plus } from "lucide-react"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import { Badge } from "../ui/badge"
import { formatDistanceToNow } from "date-fns"
import { useAuth } from "../../lib/auth-context"

export default function ChatList({ onChatSelect, selectedChatId }) {
  const [chats, setChats] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [showNewChatModal, setShowNewChatModal] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    fetchChats()
  }, [])

  const fetchChats = async () => {
    try {
      const response = await fetch("/api/chat", {
        credentials: "include",
      })

      if (response.ok) {
        const data = await response.json()
        setChats(data)
      }
    } catch (error) {
      console.error("Error fetching chats:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredChats = chats.filter((chat) => {
    const otherParticipant = chat.participants.find((p) => p._id !== user?._id)
    return otherParticipant?.name.toLowerCase().includes(searchTerm.toLowerCase())
  })

  const handleNewChat = () => {
    setShowNewChatModal(true)
  }

  const startNewChat = async (sellerId) => {
    try {
      const response = await fetch("/api/chat/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ sellerId }),
      })

      if (response.ok) {
        const newChat = await response.json()
        setChats((prev) => [newChat, ...prev])
        onChatSelect(newChat)
        setShowNewChatModal(false)
      }
    } catch (error) {
      console.error("Error starting new chat:", error)
    }
  }

  if (loading) {
    return (
      <div className="w-80 border-r border-gray-200 bg-white">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Messages</h2>
            <Button size="sm" variant="outline">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input placeholder="Search conversations..." className="pl-10" disabled />
          </div>
        </div>
        <div className="p-4">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-80 border-r border-gray-200 bg-white">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Messages</h2>
          <Button size="sm" variant="outline" onClick={handleNewChat}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search conversations..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="overflow-y-auto h-full">
        {filteredChats.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-sm">No conversations yet</p>
            <p className="text-xs text-gray-400 mt-1">Start chatting with sellers!</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredChats.map((chat) => {
              const otherParticipant = chat.participants.find((p) => p._id !== user?._id)
              const isSelected = chat._id === selectedChatId

              return (
                <div
                  key={chat._id}
                  onClick={() => onChatSelect(chat)}
                  className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                    isSelected ? "bg-red-50 border-r-2 border-red-500" : ""
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={otherParticipant?.avatar || "/placeholder.svg"} />
                        <AvatarFallback className="bg-red-100 text-red-600">
                          {otherParticipant?.name?.charAt(0)?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {/* Online indicator */}
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-gray-900 truncate">{otherParticipant?.name}</h3>
                        <div className="flex items-center space-x-2">
                          {chat.unreadCount > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              {chat.unreadCount}
                            </Badge>
                          )}
                          <span className="text-xs text-gray-500">
                            {formatDistanceToNow(new Date(chat.lastMessageTime), { addSuffix: true })}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-1">
                        <p className="text-sm text-gray-600 truncate">{chat.lastMessageContent || "No messages yet"}</p>
                        {otherParticipant?.userType === "seller" && (
                          <Badge variant="outline" className="text-xs">
                            Seller
                          </Badge>
                        )}
                      </div>

                      {chat.productContext && (
                        <div className="flex items-center mt-2 p-2 bg-gray-50 rounded text-xs">
                          <img
                            src={chat.productContext.images?.[0] || "/placeholder.svg"}
                            alt={chat.productContext.name}
                            className="w-6 h-6 rounded object-cover mr-2"
                          />
                          <span className="truncate">{chat.productContext.name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {showNewChatModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Start New Chat</h3>
            <p className="text-gray-600 mb-4">
              To start a new chat, visit a seller's profile or product page and click "Message" or "Contact Seller".
            </p>
            <div className="flex gap-2">
              <Button onClick={() => setShowNewChatModal(false)} variant="outline" className="flex-1">
                Close
              </Button>
              <Button
                onClick={() => {
                  setShowNewChatModal(false)
                  window.location.href = "/"
                }}
                className="flex-1"
              >
                Browse Products
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
