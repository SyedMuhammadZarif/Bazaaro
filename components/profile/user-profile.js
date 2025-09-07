"use client"
import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { useAuth } from "../../lib/auth-context"
import { apiClient } from "../../lib/api-client"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Textarea } from "../ui/textarea"
import { Edit, Save, X, Home, Upload, LogOut } from "lucide-react"

export default function UserProfile() {
  const { userId } = useParams()
  const router = useRouter()
  const { user: currentUser, isAuthenticated, logout } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("about")
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    name: "",
    bio: "",
    profilePicture: "",
    coverPicture: "",
  })
  const [imageFiles, setImageFiles] = useState({
    profile: null,
    cover: null,
  })

  const isOwnProfile = isAuthenticated && currentUser?._id === userId

  const fetchProfile = useCallback(async () => {
    try {
      console.log("[v0] Fetching profile for userId:", userId)
      const data = await apiClient.getUserProfile(userId)
      console.log("[v0] Profile API response:", data)
      setProfile(data)
      if (data.user) {
        setEditForm({
          name: data.user.name || "",
          bio: data.user.bio || "",
          profilePicture: data.user.profilePicture || "",
          coverPicture: data.user.coverPicture || "",
        })
      } else {
        console.log("[v0] Warning: Profile data received but user field is missing")
      }
    } catch (error) {
      console.error("[v0] Error fetching profile:", error)
      if (error.message?.includes("401") || error.message?.includes("unauthorized")) {
        // User not authenticated, redirect to login
        router.push("/login")
        return
      } else if (error.message?.includes("404") || error.message?.includes("User not found")) {
        // User not found, set profile to null to show error message
        setProfile(null)
      } else if (error.message?.includes("400") || error.message?.includes("Invalid user ID format")) {
        // Invalid user ID format, set profile to null to show error message
        setProfile(null)
      } else {
        // Other errors, set profile to null to show error message
        setProfile(null)
      }
    } finally {
      setLoading(false)
    }
  }, [userId, router])

  useEffect(() => {
    console.log("[v0] Profile component mounted")
    console.log("[v0] userId from params:", userId)
    console.log("[v0] currentUser:", currentUser)
    console.log("[v0] isAuthenticated:", isAuthenticated)
    fetchProfile()
  }, [userId, fetchProfile])

  const handleEditToggle = () => {
    setIsEditing(!isEditing)
    if (!isEditing && profile?.user) {
      setEditForm({
        name: profile.user.name || "",
        bio: profile.user.bio || "",
        profilePicture: profile.user.profilePicture || "",
        coverPicture: profile.user.coverPicture || "",
      })
    }
  }

  const handleImageUpload = (type, file) => {
    console.log("[v0] handleImageUpload called with type:", type, "file:", file)
    
    if (!file) {
      console.log("[v0] No file selected")
      return
    }
    
    if (!file.type.startsWith("image/")) {
      console.log("[v0] File is not an image:", file.type)
      alert("Please select an image file")
      return
    }
    
    console.log("[v0] Processing image file:", file.name, "size:", file.size)
    
    const reader = new FileReader()
    reader.onload = (e) => {
      console.log("[v0] FileReader onload triggered, setting image data")
      setEditForm((prev) => ({
        ...prev,
        [type === "profile" ? "profilePicture" : "coverPicture"]: e.target.result,
      }))
    }
    reader.onerror = (error) => {
      console.error("[v0] FileReader error:", error)
      alert("Error reading file. Please try again.")
    }
    reader.readAsDataURL(file)
    setImageFiles((prev) => ({ ...prev, [type]: file }))
  }

  const handleSaveProfile = async () => {
    try {
      const updatedData = await apiClient.updateProfile(editForm)
      setProfile(updatedData)
      setIsEditing(false)
      alert("Profile updated successfully!")
    } catch (error) {
      console.error("Error updating profile:", error)
      alert("Failed to update profile. Please try again.")
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
      router.push("/")
    } catch (error) {
      console.error("Error logging out:", error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">User not found</h2>
          <p className="text-gray-600">The profile you're looking for doesn't exist.</p>
          <Link href="/">
            <Button className="mt-4">
              <Home className="h-4 w-4 mr-2" />
              Go Home
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  if (!profile || !profile.user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">User not found</h2>
          <p className="text-gray-600">
            {userId && !userId.match(/^[0-9a-fA-F]{24}$/) 
              ? "Invalid user ID format." 
              : "The profile you're looking for doesn't exist."
            }
          </p>
          <div className="mt-4 p-4 bg-gray-100 rounded-lg text-left text-sm">
            <p>
              <strong>Debug Info:</strong>
            </p>
            <p>User ID from URL: {userId}</p>
            <p>Current User ID: {currentUser?._id || "Not logged in"}</p>
            <p>Profile object exists: {profile ? "Yes" : "No"}</p>
            <p>Profile.user exists: {profile?.user ? "Yes" : "No"}</p>
          </div>
          <Link href="/">
            <Button className="mt-4">
              <Home className="h-4 w-4 mr-2" />
              Go Home
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const { user, sellerData } = profile

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <Home className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          {isOwnProfile && (
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          )}
        </div>
      </div>

      {/* Cover Photo */}
      <div className="relative h-64 bg-gradient-to-r from-red-500 to-yellow-500">
        {user?.coverPicture && (
          <Image
            src={user.coverPicture || "/placeholder.svg?height=256&width=1200"}
            alt="Cover"
            fill
            className="object-cover"
          />
        )}
        <div className="absolute inset-0 bg-black bg-opacity-20"></div>
        {isEditing && (
          <div className="absolute bottom-4 right-4">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                console.log("[v0] Cover image input changed, files:", e.target.files)
                handleImageUpload("cover", e.target.files[0])
              }}
              className="hidden"
              id="cover-upload"
            />
            <label htmlFor="cover-upload" className="cursor-pointer">
              <div className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md text-sm font-medium transition-all bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 h-8 px-3 cursor-pointer">
                <Upload className="h-4 w-4 mr-2" />
                Change Cover
              </div>
            </label>
          </div>
        )}
      </div>

      {/* Profile Header */}
      <div className="max-w-6xl mx-auto px-4 -mt-16 relative z-10">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex flex-col md:flex-row items-start md:items-end gap-6">
            {/* Profile Picture */}
            <div className="relative">
              <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg overflow-hidden bg-gray-200">
                <Image
                  src={user.profilePicture || "/placeholder.svg?height=128&width=128"}
                  alt={user.name}
                  width={128}
                  height={128}
                  className="w-full h-full object-cover"
                />
              </div>
              {user.role === "seller" && (
                <div className="absolute -bottom-2 -right-2 bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                  Seller
                </div>
              )}
              {isEditing && (
                <div className="absolute -bottom-2 -left-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      console.log("[v0] Profile image input changed, files:", e.target.files)
                      handleImageUpload("profile", e.target.files[0])
                    }}
                    className="hidden"
                    id="profile-upload"
                  />
                  <label htmlFor="profile-upload" className="cursor-pointer">
                    <div className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md text-sm font-medium transition-all bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 h-8 w-8 p-0 cursor-pointer">
                      <Upload className="h-4 w-4" />
                    </div>
                  </label>
                </div>
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              {isEditing ? (
                <div className="space-y-4">
                  <Input
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="text-2xl font-bold"
                    placeholder="Your name"
                  />
                  <Textarea
                    value={editForm.bio}
                    onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                    placeholder="Tell us about yourself..."
                    rows={3}
                  />
                </div>
              ) : (
                <>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{user.name}</h1>
                  {user.bio && <p className="text-gray-600 mb-4 max-w-2xl">{user.bio}</p>}
                </>
              )}
              <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
                {sellerData && (
                  <>
                    <span>•</span>
                    <span>{sellerData.totalProducts} Products</span>
                    <span>•</span>
                    <span>{sellerData.totalChats} Conversations</span>
                  </>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              {isOwnProfile ? (
                <div className="flex gap-2">
                  {isEditing ? (
                    <>
                      <Button onClick={handleSaveProfile} size="sm">
                        <Save className="h-4 w-4 mr-2" />
                        Save
                      </Button>
                      <Button onClick={handleEditToggle} variant="outline" size="sm">
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <Button onClick={handleEditToggle} variant="outline" size="sm">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Button>
                  )}
                </div>
              ) : (
                <>
                  <button className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                    Message
                  </button>
                  {user.role === "seller" && (
                    <Link
                      href={`/store/${user._id}`}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-2 rounded-lg font-medium transition-colors"
                    >
                      Visit Store
                    </Link>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content Tabs */}
      <div className="max-w-6xl mx-auto px-4 mt-8">
        <div className="bg-white rounded-lg shadow-lg">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab("about")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "about"
                    ? "border-red-500 text-red-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                About
              </button>
              {user.role === "seller" && (
                <button
                  onClick={() => setActiveTab("products")}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === "products"
                      ? "border-red-500 text-red-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Products ({sellerData?.totalProducts || 0})
                </button>
              )}
              {isOwnProfile && user.pickedItems && user.pickedItems.length > 0 && (
                <button
                  onClick={() => setActiveTab("picked")}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === "picked"
                      ? "border-red-500 text-red-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Picked Items ({user.pickedItems.length})
                </button>
              )}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === "about" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">About {user.name}</h3>
                  <p className="text-gray-600">{user.bio || `${user.name} is a ${user.role} on Bazaaro Media.`}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Member Since</h4>
                    <p className="text-gray-600">
                      {new Date(user.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Account Type</h4>
                    <p className="text-gray-600 capitalize">{user.role}</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "products" && sellerData && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sellerData.products.map((product) => (
                  <div
                    key={product._id}
                    className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <div className="aspect-square relative bg-gray-100">
                      <Image
                        src={product.images?.[0] || "/placeholder.svg?height=200&width=200"}
                        alt={product.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="font-medium text-gray-900 mb-1 line-clamp-1">{product.name}</h3>
                      <p className="text-red-600 font-semibold">${product.price}</p>
                      <p className="text-sm text-gray-500 capitalize">{product.category}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "picked" && user.pickedItems && user.pickedItems.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {user.pickedItems.map((item) => (
                  <div
                    key={item._id}
                    className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <div className="aspect-square relative bg-gray-100">
                      <Image
                        src={item.product?.images?.[0] || "/placeholder.svg?height=200&width=200"}
                        alt={item.product?.name || "Product"}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="font-medium text-gray-900 mb-1 line-clamp-1">{item.product?.name || "Product"}</h3>
                      <p className="text-red-600 font-semibold">${item.product?.price || "0"}</p>
                      <p className="text-sm text-gray-500 capitalize">{item.product?.category || "Category"}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
