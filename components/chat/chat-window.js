"use client"

import { useState, useEffect, useRef } from "react"
import { Send, ImageIcon, Package, MoreVertical, Phone, Video, X, Flag, Trash2 } from "lucide-react"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import { Badge } from "../ui/badge"
import { ScrollArea } from "../ui/scroll-area"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog"
import { Textarea } from "../ui/textarea"
import { formatDistanceToNow } from "date-fns"
import io from "socket.io-client"
import { useAuth } from "../../lib/auth-context"

export default function ChatWindow({ chat, currentUserId, onChatUpdate }) {
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState("") // Initialize with empty string to fix uncontrolled input
  const [loading, setLoading] = useState(true)
  const [socket, setSocket] = useState(null)
  const [typing, setTyping] = useState(false)
  const [typingUsers, setTypingUsers] = useState([])
  const [showEndChatDialog, setShowEndChatDialog] = useState(false)
  const [showReportDialog, setShowReportDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [reportReason, setReportReason] = useState("")
  const messagesEndRef = useRef(null)
  const typingTimeoutRef = useRef(null)

  const { user } = useAuth()

  const otherParticipant = chat?.participants?.find((p) => p._id !== currentUserId)
  const isEnded = chat?.status === "ended"
  const canDelete = isEnded
  const canReport = isEnded && chat?.endedBy !== currentUserId

  useEffect(() => {
    if (chat?._id) {
      fetchMessages()
      initializeSocket()
    }

    return () => {
      if (socket) {
        socket.disconnect()
      }
    }
  }, [chat?._id])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const initializeSocket = async () => {
    try {
      const response = await fetch("/api/auth/socket-token", {
        credentials: "include",
      })

      if (!response.ok) {
        console.error("Failed to get socket token")
        return
      }

      const { socketToken } = await response.json()

      const newSocket = io(process.env.NODE_ENV === "production" ? "" : "http://localhost:5000", {
        withCredentials: true,
        auth: {
          token: socketToken, // Use proper JWT token instead of user ID
        },
      })

      newSocket.on("connect", () => {
        console.log("Connected to chat server")
        newSocket.emit("join_chat", chat._id)
      })

      newSocket.on("connect_error", (error) => {
        console.error("Socket connection error:", error)
      })

      newSocket.on("new_message", (data) => {
        if (data.chatId === chat._id) {
          setMessages((prev) => [...prev, data.message])
        }
      })

      newSocket.on("user_typing", (data) => {
        if (data.chatId === chat._id && data.userId !== currentUserId) {
          setTypingUsers((prev) => [...prev.filter((u) => u.userId !== data.userId), data])
        }
      })

      newSocket.on("user_stop_typing", (data) => {
        if (data.chatId === chat._id) {
          setTypingUsers((prev) => prev.filter((u) => u.userId !== data.userId))
        }
      })

      setSocket(newSocket)
    } catch (error) {
      console.error("Error initializing socket:", error)
    }
  }

  const fetchMessages = async () => {
    try {
      const response = await fetch(`/api/chat/${chat._id}/messages`, {
        credentials: "include",
      })

      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages)
      }
    } catch (error) {
      console.error("Error fetching messages:", error)
    } finally {
      setLoading(false)
    }
  }

  const sendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !socket) return

    const messageData = {
      chatId: chat._id,
      content: newMessage.trim(),
      messageType: "text",
    }

    socket.emit("send_message", messageData)
    setNewMessage("")

    // Stop typing indicator
    if (typing) {
      socket.emit("typing_stop", { chatId: chat._id })
      setTyping(false)
    }
  }

  const handleTyping = (e) => {
    setNewMessage(e.target.value)

    if (!socket) return

    if (!typing) {
      setTyping(true)
      socket.emit("typing_start", { chatId: chat._id })
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Set new timeout
    typingTimeoutRef.current = setTimeout(() => {
      if (typing) {
        socket.emit("typing_stop", { chatId: chat._id })
        setTyping(false)
      }
    }, 1000)
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const handleEndChat = async () => {
    try {
      const response = await fetch(`/api/chat/${chat._id}/end`, {
        method: "PUT",
        credentials: "include",
      })

      if (response.ok) {
        const result = await response.json()
        setShowEndChatDialog(false)
        
        // Update the local chat state to reflect the ended status
        if (result.chat) {
          // Update the chat object with the new status
          const updatedChat = { ...chat, ...result.chat }
          // Trigger a re-render by updating the parent component
          onChatUpdate?.()
        }
        
        alert("Chat ended successfully")
      } else {
        const errorData = await response.json()
        alert(errorData.message || "Failed to end chat")
      }
    } catch (error) {
      console.error("Error ending chat:", error)
      alert("Failed to end chat")
    }
  }

  const handleReportChat = async () => {
    if (!reportReason.trim()) {
      alert("Please provide a reason for reporting")
      return
    }

    try {
      const response = await fetch(`/api/chat/${chat._id}/report`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ reason: reportReason }),
      })

      if (response.ok) {
        setShowReportDialog(false)
        setReportReason("")
        onChatUpdate?.()
        alert("Chat reported successfully")
      } else {
        alert("Failed to report chat")
      }
    } catch (error) {
      console.error("Error reporting chat:", error)
      alert("Failed to report chat")
    }
  }

  const handleDeleteChat = async () => {
    try {
      const response = await fetch(`/api/chat/${chat._id}`, {
        method: "DELETE",
        credentials: "include",
      })

      if (response.ok) {
        setShowDeleteDialog(false)
        onChatUpdate?.()
        alert("Chat deleted successfully")
      } else {
        alert("Failed to delete chat")
      }
    } catch (error) {
      console.error("Error deleting chat:", error)
      alert("Failed to delete chat")
    }
  }

  if (!chat) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
            <Package className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Select a conversation</h3>
          <p className="text-gray-500">Choose a chat to start messaging</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex-1 flex flex-col">
        <div className="p-4 border-b bg-white">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
            </div>
          </div>
        </div>
        <div className="flex-1 p-4">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex space-x-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-3 bg-gray-200 rounded w-3/4 mb-2"></div>
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
    <div className="flex-1 flex flex-col bg-white">
      {/* Chat Header */}
      <div className="p-4 border-b bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={otherParticipant?.avatar || "/placeholder.svg"} />
              <AvatarFallback className="bg-red-100 text-red-600">
                {otherParticipant?.name?.charAt(0)?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-medium text-gray-900">{otherParticipant?.name}</h3>
              <div className="flex items-center space-x-2">
                {isEnded ? (
                  <Badge variant="destructive" className="text-xs">
                    Chat Ended
                  </Badge>
                ) : (
                  <>
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-500">Online</span>
                  </>
                )}
                {otherParticipant?.userType === "seller" && (
                  <Badge variant="outline" className="text-xs">
                    Seller
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm">
              <Phone className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Video className="h-4 w-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {!isEnded && (
                  <DropdownMenuItem onClick={() => setShowEndChatDialog(true)} className="text-red-600">
                    <X className="h-4 w-4 mr-2" />
                    End Chat
                  </DropdownMenuItem>
                )}
                {canReport && (
                  <DropdownMenuItem onClick={() => setShowReportDialog(true)} className="text-orange-600">
                    <Flag className="h-4 w-4 mr-2" />
                    Report to Admin
                  </DropdownMenuItem>
                )}
                {canDelete && (
                  <DropdownMenuItem onClick={() => setShowDeleteDialog(true)} className="text-red-600">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Chat
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {chat.productContext && (
          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <img
                src={chat.productContext.images?.[0] || "/placeholder.svg"}
                alt={chat.productContext.name}
                className="w-12 h-12 rounded-lg object-cover"
              />
              <div className="flex-1">
                <h4 className="font-medium text-sm">{chat.productContext.name}</h4>
                <p className="text-red-600 font-semibold">${chat.productContext.price}</p>
              </div>
              <Button variant="outline" size="sm">
                View Product
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message, index) => {
            const isOwn = message.sender._id === currentUserId
            const showAvatar = index === 0 || messages[index - 1].sender._id !== message.sender._id

            return (
              <div key={message._id || index} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                <div className={`flex max-w-xs lg:max-w-md ${isOwn ? "flex-row-reverse" : "flex-row"} space-x-2`}>
                  {!isOwn && showAvatar && (
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={message.sender.avatar || "/placeholder.svg"} />
                      <AvatarFallback className="bg-gray-100 text-gray-600 text-xs">
                        {message.sender.name?.charAt(0)?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  {!isOwn && !showAvatar && <div className="w-8"></div>}

                  <div
                    className={`px-4 py-2 rounded-lg ${isOwn ? "bg-red-500 text-white" : "bg-gray-100 text-gray-900"}`}
                  >
                    {message.messageType === "product" && message.productRef && (
                      <div className="mb-2 p-2 bg-white bg-opacity-20 rounded">
                        <div className="flex items-center space-x-2">
                          <img
                            src={message.productRef.images?.[0] || "/placeholder.svg"}
                            alt={message.productRef.name}
                            className="w-8 h-8 rounded object-cover"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">{message.productRef.name}</p>
                            <p className="text-xs opacity-75">${message.productRef.price}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    <p className="text-sm">{message.content}</p>
                    <p className={`text-xs mt-1 ${isOwn ? "text-red-100" : "text-gray-500"}`}>
                      {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}

          {typingUsers.length > 0 && (
            <div className="flex justify-start">
              <div className="flex items-center space-x-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-gray-100 text-gray-600 text-xs">
                    {typingUsers[0].user.name?.charAt(0)?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="bg-gray-100 px-4 py-2 rounded-lg">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Message Input */}
      <div className="p-4 border-t bg-white">
        {isEnded ? (
          <div className="text-center py-4">
            <p className="text-gray-500 text-sm">This chat has ended. No new messages can be sent.</p>
            {canReport && (
              <Button
                variant="outline"
                size="sm"
                className="mt-2 mr-2 bg-transparent"
                onClick={() => setShowReportDialog(true)}
              >
                <Flag className="h-4 w-4 mr-2" />
                Report to Admin
              </Button>
            )}
            {canDelete && (
              <Button
                variant="outline"
                size="sm"
                className="mt-2 bg-transparent"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Chat
              </Button>
            )}
          </div>
        ) : (
          <form onSubmit={sendMessage} className="flex items-center space-x-2">
            <Button type="button" variant="ghost" size="sm">
              <ImageIcon className="h-4 w-4" />
            </Button>
            <Button type="button" variant="ghost" size="sm">
              <Package className="h-4 w-4" />
            </Button>
            <Input value={newMessage} onChange={handleTyping} placeholder="Type a message..." className="flex-1" />
            <Button type="submit" disabled={!newMessage.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        )}
      </div>

      {/* End Chat Dialog */}
      <AlertDialog open={showEndChatDialog} onOpenChange={setShowEndChatDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>End Chat</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to end this chat? Once ended, no new messages can be sent. The other participant
              will be able to either end the chat or report it to admin.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleEndChat} className="bg-red-600 hover:bg-red-700">
              End Chat
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Report Chat Dialog */}
      <AlertDialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Report Chat to Admin</AlertDialogTitle>
            <AlertDialogDescription>
              Please provide a reason for reporting this chat. Our admin team will review your report.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Describe the issue..."
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleReportChat} className="bg-orange-600 hover:bg-orange-700">
              Submit Report
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Chat Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Chat</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this chat? This action cannot be undone and all messages will be
              permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteChat} className="bg-red-600 hover:bg-red-700">
              Delete Chat
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
