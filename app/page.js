"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { ShoppingBasket, MessageCircle, Share2, Search, User, Store, Menu, Plus, Send, ImageIcon, Heart } from "lucide-react"
import { useAuth } from "../lib/auth-context"
import { apiClient } from "../lib/api-client"
import Navbar from "../components/layout/navbar"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Settings } from "lucide-react"

export default function HomePage() {
  const [activeTab, setActiveTab] = useState("feed")
  const [likedPosts, setLikedPosts] = useState(new Set())
  const [merchantPosts, setMerchantPosts] = useState([])
  const [storeProducts, setStoreProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [showPostForm, setShowPostForm] = useState(false)
  const [postContent, setPostContent] = useState("")
  const [postImage, setPostImage] = useState(null)

  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const urlTab = searchParams.get("tab")
    if (urlTab) setActiveTab(urlTab)
    
    const urlSearch = searchParams.get("search")
    const urlType = searchParams.get("type")
    
    fetchData()
  }, [activeTab, searchParams])

  const fetchData = async () => {
    setLoading(true)
    try {
      if (activeTab === "feed") {
        const [postsResponse, productsResponse] = await Promise.all([
          apiClient.getAllPosts({ limit: 20 }),
          apiClient.getFeaturedProducts(),
        ])

        const newLikedPosts = new Set()

        const posts = postsResponse.posts.map((post) => {
          // Check if current user has liked this post
          if (user && post.likes?.some((like) => like.user._id === user._id)) {
            newLikedPosts.add(post._id)
          }

          return {
            id: post._id,
            merchant: {
              name: post.author?.name || "Unknown User",
              avatar: post.author?.profilePicture || "/placeholder.svg?height=40&width=40",
              verified: post.author?.role === "seller",
            },
            content: post.content,
            images: post.images,
            likes: post.likes?.length || 0,
            comments: post.comments?.length || 0,
            timeAgo: new Date(post.createdAt).toLocaleDateString(),
            isPost: true,
          }
        })

        const products = productsResponse.map((product) => ({
          id: product._id,
          merchant: {
            name: product.owner?.name || "Unknown Seller",
            avatar: product.owner?.profilePicture || "/placeholder.svg?height=40&width=40",
            verified: true,
          },
          product: {
            name: product.name,
            price: `$${product.price}`,
            image: product.images?.[0] || "/placeholder.svg?height=400&width=400",
          },
          description: product.description,
          likes: 0, // Products don't have likes
          comments: 0, // Products don't have comments
          timeAgo: product.createdAt ? new Date(product.createdAt).toLocaleDateString() : "Recently",
          isPost: false,
        }))

        setLikedPosts(newLikedPosts)

        const combinedFeed = [...posts, ...products].sort((a, b) => new Date(b.timeAgo) - new Date(a.timeAgo))
        setMerchantPosts(combinedFeed)
      } else {
        const response = await apiClient.getAllProducts()
        const searchTerm = searchParams.get("search") || ""

        let filteredProducts = response
        if (searchTerm) {
          filteredProducts = response.filter(
            (product) =>
              product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              product.owner?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              product.category?.toLowerCase().includes(searchTerm.toLowerCase()),
          )
        }

        setStoreProducts(
          filteredProducts.map((product) => ({
            id: product._id,
            name: product.name,
            price: `$${product.price}`,
            image: product.images?.[0] || "/placeholder.svg?height=200&width=200",
            store: product.owner?.name || "Unknown Store",
            category: product.category,
            sellerId: product.owner?._id,
          })),
        )
      }
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePost = async () => {
    if (!postContent.trim()) return

    try {
      const response = await apiClient.createPost({
        content: postContent,
        images: postImage ? [postImage] : [],
      })

      const newPost = {
        id: response.post._id,
        merchant: {
          name: user?.name || "You",
          avatar: user?.profilePicture || "/placeholder.svg?height=40&width=40",
          verified: user?.role === "seller",
        },
        content: postContent,
        images: postImage ? [postImage] : [],
        likes: 0,
        comments: 0,
        timeAgo: "now",
        isPost: true,
      }

      setMerchantPosts((prev) => [newPost, ...prev])
      setPostContent("")
      setPostImage(null)
      setShowPostForm(false)
    } catch (error) {
      console.error("Error creating post:", error)
      alert("Failed to create post. Please try again.")
    }
  }

  const toggleLike = async (postId, isPost = false) => {
    if (!isAuthenticated) {
      alert("Please login to like posts")
      return
    }

    try {
      if (isPost) {
        const response = await apiClient.toggleLikePost(postId)

        // Update the post's like count in the UI
        setMerchantPosts((prev) =>
          prev.map((post) => (post.id === postId ? { ...post, likes: response.likesCount } : post)),
        )
      }

      const newLiked = new Set(likedPosts)
      if (newLiked.has(postId)) {
        newLiked.delete(postId)
      } else {
        newLiked.add(postId)
      }
      setLikedPosts(newLiked)
    } catch (error) {
      console.error("Error toggling like:", error)
    }
  }

  const handlePickItem = async (productId) => {
    if (!isAuthenticated) {
      alert("Please login to pick items")
      return
    }

    console.log("[v0] Frontend: Attempting to pick item with ID:", productId)
    console.log("[v0] Frontend: ProductId type:", typeof productId)

    try {
      const response = await apiClient.addPickedItem(productId)
      console.log("[v0] Frontend: Pick item response:", response)
      alert("Item added to your picked items!")
      window.location.reload()
    } catch (error) {
      console.error("Error picking item:", error)
      if (error.message && error.message.includes("already picked")) {
        alert("This item is already in your picked items!")
      } else {
        alert("Failed to pick item. Please try again.")
      }
    }
  }

  const handleChatWithSeller = async (sellerId, productId = null) => {
    if (!isAuthenticated) {
      alert("Please login to chat with sellers")
      return
    }

    try {
      const response = await fetch("/api/chat/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          participantId: sellerId,
          productId: productId,
        }),
      })

      if (response.ok) {
        const chat = await response.json()
        window.location.href = `/chat?chatId=${chat._id}`
      } else {
        alert("Error starting chat. Please try again.")
      }
    } catch (error) {
      console.error("Error creating chat:", error)
      alert("Error starting chat. Please try again.")
    }
  }

  const filteredProducts = storeProducts.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.store.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const categories = ["all", ...new Set(storeProducts.map((product) => product.category).filter(Boolean))]

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      

      <main className="pb-20 pt-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
          </div>
        ) : (
          <>
            {activeTab === "feed" && (
              <div className="max-w-md mx-auto pt-2">
                {isAuthenticated && user?.role === "seller" && (
                  <Card className="mb-4 mx-4 border-0 shadow-sm">
                    <CardContent className="p-4">
                      {!showPostForm ? (
                        <Button
                          variant="ghost"
                          className="w-full justify-start text-muted-foreground"
                          onClick={() => setShowPostForm(true)}
                        >
                          What's on your mind?
                        </Button>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={user?.profilePicture || "/placeholder.svg"} />
                              <AvatarFallback>{user?.name?.[0]}</AvatarFallback>
                            </Avatar>
                            <span className="font-semibold text-sm">{user?.name}</span>
                          </div>
                          <Textarea
                            placeholder="Share something with your customers..."
                            value={postContent}
                            onChange={(e) => setPostContent(e.target.value)}
                            className="min-h-[80px] resize-none border-0 p-0 focus-visible:ring-0"
                          />
                          <div className="flex items-center justify-between">
                            <Button variant="ghost" size="sm">
                              <ImageIcon className="h-4 w-4 mr-2" />
                              Photo
                            </Button>
                            <div className="flex gap-2">
                              <Button variant="ghost" size="sm" onClick={() => setShowPostForm(false)}>
                                Cancel
                              </Button>
                              <Button size="sm" onClick={handleCreatePost} disabled={!postContent.trim()}>
                                <Send className="h-4 w-4 mr-2" />
                                Post
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {merchantPosts.map((post) => (
                  <Card key={post.id} className="mb-4 mx-4 border-0 shadow-sm">
                    <CardContent className="p-0">
                      <div className="flex items-center justify-between p-4 pb-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={post.merchant.avatar || "/placeholder.svg"} />
                            <AvatarFallback>{post.merchant.name[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-1">
                              <span className="font-semibold text-sm">{post.merchant.name}</span>
                              {post.merchant.verified && (
                                <Badge variant="secondary" className="h-4 px-1 text-xs">
                                  ✓
                                </Badge>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground">{post.timeAgo}</span>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Menu className="h-4 w-4" />
                        </Button>
                      </div>

                      {post.isPost ? (
                        <div className="px-4 pb-2">
                          <p className="text-sm">{post.content}</p>
                          {post.images && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                              {post.images.map((image, index) => (
                                <img
                                  key={index}
                                  src={image || "/placeholder.svg"}
                                  alt="Post image"
                                  className="w-full aspect-video object-cover rounded-lg"
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="relative">
                          <img
                            src={post.product.image || "/placeholder.svg"}
                            alt={post.product.name}
                            className="w-full aspect-square object-cover"
                          />
                          <div className="absolute top-3 right-3">
                            <Badge className="bg-primary text-primary-foreground">{post.product.price}</Badge>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between p-4 pb-2">
                        <div className="flex items-center gap-4">
                          {post.isPost && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => toggleLike(post.id, post.isPost)}
                            >
                              <Heart
                                className={`h-5 w-5 ${likedPosts.has(post.id) ? "fill-primary text-primary" : ""}`}
                              />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleChatWithSeller(post.merchant.id, post.isPost ? null : post.id)}
                          >
                            <MessageCircle className="h-5 w-5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Share2 className="h-5 w-5" />
                          </Button>
                        </div>
                        {!post.isPost && user?.role !== "seller" && (
                          <Button
                            size="sm"
                            className="bg-primary hover:bg-primary/90"
                            onClick={() => handlePickItem(post.id)}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Pick Item
                          </Button>
                        )}
                        {!post.isPost && user?.role === "seller" && (
                          <Button
                            size="sm"
                            className="bg-primary hover:bg-primary/90"
                            onClick={() => handleChatWithSeller(post.merchant.id, post.id)}
                          >
                            <MessageCircle className="h-4 w-4 mr-1" />
                            Chat
                          </Button>
                        )}
                      </div>

                      <div className="px-4 pb-4">
                        {post.isPost && (
                          <div className="flex items-center gap-1 mb-2">
                            <span className="text-sm font-semibold">{post.likes} likes</span>
                            <span className="text-sm text-muted-foreground">•</span>
                            <span className="text-sm text-muted-foreground">{post.comments} comments</span>
                          </div>
                        )}
                        {!post.isPost && (
                          <>
                            <h3 className="font-semibold text-sm mb-1">{post.product.name}</h3>
                            <p className="text-sm text-muted-foreground">{post.description}</p>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {activeTab === "store" && (
              <div className="p-4">
                <div className="mb-6">
                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search products..."
                      className="pl-10 bg-input border-border"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {categories.map((category) => (
                      <Badge
                        key={category}
                        variant={selectedCategory === category ? "default" : "outline"}
                        className="whitespace-nowrap cursor-pointer capitalize"
                        onClick={() => setSelectedCategory(category)}
                      >
                        {category}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {filteredProducts.map((product) => (
                    <Card key={product.id} className="border-border">
                      <CardContent className="p-0">
                        <div className="relative">
                          <img
                            src={product.image || "/placeholder.svg"}
                            alt={product.name}
                            className="w-full aspect-square object-cover rounded-t-lg"
                          />
                          {user?.role !== "seller" && (
                            <Button
                              size="icon"
                              className="absolute top-2 right-2 h-8 w-8 bg-background/80 hover:bg-background text-foreground"
                              onClick={() => handlePickItem(product.id)}
                            >
                              <ShoppingBasket className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        <div className="p-3">
                          <h3 className="font-semibold text-sm mb-1 line-clamp-2">{product.name}</h3>
                          <p className="text-xs text-muted-foreground mb-2">{product.store}</p>
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-primary">{product.price}</span>
                            <div className="flex gap-1">
                              {user?.role !== "seller" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 px-2 text-xs bg-transparent"
                                  onClick={() => handleChatWithSeller(product.sellerId, product.id)}
                                >
                                  <MessageCircle className="h-3 w-3" />
                                </Button>
                              )}
                              {user?.role !== "seller" && (
                                <Button
                                  size="sm"
                                  className="h-7 px-2 text-xs"
                                  onClick={() => handlePickItem(product.id)}
                                >
                                  <Plus className="h-3 w-3 mr-1" />
                                  Pick
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border">
        <div className="flex items-center justify-around py-2">
          <Button
            variant={activeTab === "feed" ? "default" : "ghost"}
            size="icon"
            className="flex-col gap-1 h-12"
            onClick={() => (window.location.href = "/?tab=feed")}
          >
            <div
              className={`h-6 w-6 ${activeTab === "feed" ? "bg-primary-foreground" : "bg-primary"} rounded-full flex items-center justify-center`}
            >
              <div
                className={`h-2 w-2 ${activeTab === "feed" ? "bg-primary" : "bg-primary-foreground"} rounded-full`}
              ></div>
            </div>
            <span className="text-xs">Feed</span>
          </Button>
          <Button
            variant={activeTab === "store" ? "default" : "ghost"}
            size="icon"
            className="flex-col gap-1 h-12"
            onClick={() => (window.location.href = "/?tab=store")}
          >
            <Store className="h-6 w-6" />
            <span className="text-xs">Store</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="flex-col gap-1 h-12"
            onClick={() => (window.location.href = "/chat")}
          >
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
  )
}
