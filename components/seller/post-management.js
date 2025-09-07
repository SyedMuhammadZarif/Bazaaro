"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { Textarea } from "../ui/textarea"
import { Badge } from "../ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import {
  Plus,
  ImageIcon,
  Video,
  Calendar,
  Heart,
  MessageCircle,
  Share2,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  FileText,
} from "lucide-react"
import { useAuth } from "../../lib/auth-context"
import { apiClient } from "../../lib/api-client"

export default function PostManagement() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingPost, setEditingPost] = useState(null)
  const [newPost, setNewPost] = useState({
    content: "",
    images: [],
    isPublic: true,
  })
  const [imageFiles, setImageFiles] = useState([])
  const [imagePreviews, setImagePreviews] = useState([])
  const { user } = useAuth()

  useEffect(() => {
    fetchPosts()
  }, [])

  const fetchPosts = async () => {
    try {
      const data = await apiClient.getUserPosts(user._id)
      setPosts(data.posts || [])
    } catch (error) {
      console.error("Error fetching posts:", error)
      // Fallback to empty array if API fails
      setPosts([])
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePost = async (e) => {
    e.preventDefault()
    if (!newPost.content.trim()) return

    try {
      if (editingPost) {
        await handleUpdatePost(e)
        return
      }

      // Process images
      let processedImages = []
      if (imageFiles.length > 0) {
        const imagePromises = imageFiles.map((file) => {
          return new Promise((resolve) => {
            const reader = new FileReader()
            reader.onload = (e) => resolve(e.target.result)
            reader.readAsDataURL(file)
          })
        })
        processedImages = await Promise.all(imagePromises)
      }

      // Create new post
      const newPostData = await apiClient.createPost({
        content: newPost.content,
        images: processedImages,
        isPublic: newPost.isPublic,
      })

      setPosts([newPostData.post, ...posts])
      setNewPost({ content: "", images: [], isPublic: true })
      setImageFiles([])
      setImagePreviews([])
      setShowCreateForm(false)
      alert("Post created successfully!")
    } catch (error) {
      console.error("Error creating post:", error)
      alert("Failed to create post. Please try again.")
    }
  }

  const handleEditPost = (post) => {
    setEditingPost(post)
    setNewPost({
      content: post.content,
      images: post.images || [],
      isPublic: post.isPublic,
    })
    setImagePreviews(post.images || [])
    setImageFiles([]) // Clear file uploads for editing
    setShowCreateForm(true)
  }

  const handleCancelEdit = () => {
    setEditingPost(null)
    setNewPost({ content: "", images: [], isPublic: true })
    setImageFiles([])
    setImagePreviews([])
    setShowCreateForm(false)
  }

  const compressImage = (file, maxWidth = 800, quality = 0.8) => {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      const img = new Image()

      img.onload = () => {
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height)
        canvas.width = img.width * ratio
        canvas.height = img.height * ratio

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        canvas.toBlob(resolve, "image/jpeg", quality)
      }

      img.src = URL.createObjectURL(file)
    })
  }

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files).filter((file) => file.type.startsWith("image/"))

    if (files.length + imagePreviews.length > 3) {
      alert("You can only upload up to 3 images")
      return
    }

    for (const file of files) {
      try {
        const compressedFile = await compressImage(file)
        const reader = new FileReader()
        reader.onload = (e) => {
          setImagePreviews((prev) => [...prev, e.target.result])
          setImageFiles((prev) => [...prev, compressedFile])
        }
        reader.readAsDataURL(compressedFile)
      } catch (error) {
        console.error("Error compressing image:", error)
      }
    }
  }

  const handleImageRemove = (index) => {
    setImagePreviews((prev) => prev.filter((_, i) => i !== index))
    setImageFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleUpdatePost = async (e) => {
    e.preventDefault()
    if (!newPost.content.trim()) return

    try {
      // Process images - combine existing images with new uploads
      let processedImages = [...(editingPost.images || [])]
      
      if (imageFiles.length > 0) {
        const imagePromises = imageFiles.map((file) => {
          return new Promise((resolve) => {
            const reader = new FileReader()
            reader.onload = (e) => resolve(e.target.result)
            reader.readAsDataURL(file)
          })
        })
        const newImages = await Promise.all(imagePromises)
        processedImages = [...processedImages, ...newImages]
      }

      const updatedPost = await apiClient.updatePost(editingPost._id, {
        content: newPost.content,
        images: processedImages,
        isPublic: newPost.isPublic,
      })

      setPosts(posts.map((post) => (post._id === editingPost._id ? updatedPost.post : post)))
      setEditingPost(null)
      setNewPost({ content: "", images: [], isPublic: true })
      setImageFiles([])
      setImagePreviews([])
      setShowCreateForm(false)
      alert("Post updated successfully!")
    } catch (error) {
      console.error("Error updating post:", error)
      alert("Failed to update post. Please try again.")
    }
  }

  const handleDeletePost = async (postId) => {
    if (!confirm("Are you sure you want to delete this post?")) return

    try {
      await apiClient.deletePost(postId)
      setPosts(posts.filter((post) => post._id !== postId))
      alert("Post deleted successfully!")
    } catch (error) {
      console.error("Error deleting post:", error)
      alert("Failed to delete post. Please try again.")
    }
  }

  const formatTimeAgo = (dateString) => {
    const now = new Date()
    const postDate = new Date(dateString)
    const diffInHours = Math.floor((now - postDate) / (1000 * 60 * 60))

    if (diffInHours < 1) return "Just now"
    if (diffInHours < 24) return `${diffInHours}h ago`
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays}d ago`
    return postDate.toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="h-8 bg-gray-200 rounded w-32 animate-pulse"></div>
          <div className="h-10 bg-gray-200 rounded w-24 animate-pulse"></div>
        </div>
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                <div className="h-32 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Merchant Posts</h2>
          <p className="text-gray-600">Share updates, stories, and engage with your customers</p>
        </div>
        <Button onClick={() => setShowCreateForm(!showCreateForm)}>
          <Plus className="h-4 w-4 mr-2" />
          {editingPost ? "Cancel Edit" : "Create Post"}
        </Button>
      </div>

      {/* Create Post Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingPost ? "Edit Post" : "Create New Post"}</CardTitle>
            <CardDescription>
              {editingPost ? "Update your post content" : "Share something with your customers"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreatePost} className="space-y-4">
              <div className="flex items-start space-x-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user?.profilePicture || "/placeholder.svg"} />
                  <AvatarFallback className="bg-red-100 text-red-600">
                    {user?.name?.charAt(0)?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <Textarea
                    placeholder="What's happening in your store?"
                    value={newPost.content}
                    onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                    className="min-h-[100px] resize-none border-0 p-0 text-lg placeholder:text-gray-500 focus-visible:ring-0"
                  />
                </div>
              </div>

              {/* Image Previews */}
              {imagePreviews.length > 0 && (
                <div className="mt-4">
                  <div className="grid grid-cols-2 gap-2">
                    {imagePreviews.map((image, index) => (
                      <div key={index} className="relative">
                        <img
                          src={image}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2 h-6 w-6 p-0"
                          onClick={() => handleImageRemove(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center space-x-4">
                  <label htmlFor="post-image-upload" className="cursor-pointer">
                    <Button type="button" variant="ghost" size="sm" asChild>
                      <div>
                        <ImageIcon className="h-4 w-4 mr-2" />
                        Photo
                      </div>
                    </Button>
                  </label>
                  <input
                    id="post-image-upload"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <Button type="button" variant="ghost" size="sm" disabled>
                    <Video className="h-4 w-4 mr-2" />
                    Video
                  </Button>
                  <Button type="button" variant="ghost" size="sm" disabled>
                    <Calendar className="h-4 w-4 mr-2" />
                    Schedule
                  </Button>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setNewPost({ ...newPost, isPublic: !newPost.isPublic })}
                    >
                      {newPost.isPublic ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </Button>
                    <span className="text-sm text-gray-500">{newPost.isPublic ? "Public" : "Private"}</span>
                  </div>
                  <div className="flex space-x-2">
                    <Button type="submit" disabled={!newPost.content.trim()}>
                      {editingPost ? "Update Post" : "Post"}
                    </Button>
                    {editingPost && (
                      <Button type="button" variant="outline" onClick={handleCancelEdit}>
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Posts List */}
      <div className="space-y-4">
        {posts.length > 0 ? (
          posts.map((post) => (
            <Card key={post._id}>
              <CardContent className="p-6">
                {/* Post Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user?.profilePicture || "/placeholder.svg"} />
                      <AvatarFallback className="bg-red-100 text-red-600">
                        {user?.name?.charAt(0)?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold text-gray-900">{user?.name}</h3>
                        <Badge variant="secondary" className="text-xs">
                          Verified Seller
                        </Badge>
                        {!post.isPublic && (
                          <Badge variant="outline" className="text-xs">
                            <EyeOff className="h-3 w-3 mr-1" />
                            Private
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">{formatTimeAgo(post.createdAt)}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleEditPost(post)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeletePost(post._id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Post Content */}
                <div className="mb-4">
                  <p className="text-gray-900 whitespace-pre-wrap">{post.content}</p>
                </div>

                {/* Post Images */}
                {post.images && post.images.length > 0 && (
                  <div className="mb-4">
                    <div className={`grid gap-2 ${post.images.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
                      {post.images.map((image, index) => (
                        <img
                          key={index}
                          src={image || "/placeholder.svg"}
                          alt={`Post image ${index + 1}`}
                          className="rounded-lg object-cover w-full h-64"
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Post Stats */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center space-x-6 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Heart className="h-4 w-4" />
                      <span>{post.likes}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <MessageCircle className="h-4 w-4" />
                      <span>{post.comments}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Share2 className="h-4 w-4" />
                      <span>{post.shares}</span>
                    </div>
                  </div>

                  <Badge variant="outline" className="text-xs">
                    {post.isPublic ? "Visible to all" : "Only you can see this"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No posts yet</h3>
              <p className="text-gray-500 mb-4">Start sharing updates and stories with your customers</p>
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Post
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
