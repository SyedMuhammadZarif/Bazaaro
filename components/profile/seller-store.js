"use client"
import { useState, useEffect } from "react"
import { useParams, useSearchParams } from "next/navigation"
import Image from "next/image"

export default function SellerStore() {
  const { sellerId } = useParams()
  const searchParams = useSearchParams()
  const [store, setStore] = useState(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [currentUser, setCurrentUser] = useState(null)

  useEffect(() => {
    fetchStore()
    fetchCurrentUser()
  }, [sellerId, currentPage, selectedCategory, searchTerm])

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch("/api/auth/me", {
        credentials: "include",
      })
      if (response.ok) {
        const userData = await response.json()
        setCurrentUser(userData)
      }
    } catch (error) {
      console.error("Error fetching current user:", error)
    }
  }

  const fetchStore = async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "12",
      })

      if (selectedCategory !== "all") params.append("category", selectedCategory)
      if (searchTerm) params.append("search", searchTerm)

      const response = await fetch(`/api/profile/store/${sellerId}?${params}`, {
        credentials: "include",
      })
      const data = await response.json()
      setStore(data)
    } catch (error) {
      console.error("Error fetching store:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    setCurrentPage(1)
    fetchStore()
  }

  const handleChatWithSeller = async (productId) => {
    try {
      const response = await fetch("/api/chat/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      })

      if (!response.ok) {
        // User not authenticated, redirect to login
        window.location.href = "/login"
        return
      }

      const chatResponse = await fetch("/api/chat/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          participantId: sellerId,
          productId: productId,
        }),
      })

      if (chatResponse.ok) {
        const chat = await chatResponse.json()
        window.location.href = `/chat?chatId=${chat._id}`
      } else {
        alert("Error starting chat. Please try again.")
      }
    } catch (error) {
      console.error("Error creating chat:", error)
      alert("Error starting chat. Please try again.")
    }
  }

  const isOwnStore = currentUser && currentUser._id === sellerId

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
      </div>
    )
  }

  if (!store) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Store not found</h2>
          <p className="text-gray-600">The store you're looking for doesn't exist.</p>
        </div>
      </div>
    )
  }

  const { seller, products, pagination, stats } = store

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Store Header */}
      <div className="relative h-64 bg-gradient-to-r from-red-500 to-yellow-500">
        {seller.coverPicture && (
          <Image src={seller.coverPicture || "/placeholder.svg"} alt="Store Cover" fill className="object-cover" />
        )}
        <div className="absolute inset-0 bg-black bg-opacity-30"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 -mt-16 relative z-10">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* Store Logo */}
            <div className="w-24 h-24 rounded-full border-4 border-white shadow-lg overflow-hidden bg-gray-200">
              <Image
                src={seller.profilePicture || "/placeholder.svg?height=96&width=96"}
                alt={seller.name}
                width={96}
                height={96}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Store Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{seller.name}'s Store</h1>
                <div className="bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                  Verified Seller
                </div>
              </div>
              {seller.bio && <p className="text-gray-600 mb-4 max-w-2xl">{seller.bio}</p>}
              <div className="flex flex-wrap gap-6 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <span className="font-medium text-gray-900">{stats.totalProducts}</span> Products
                </span>
                <span className="flex items-center gap-1">
                  <span className="font-medium text-gray-900">{stats.totalChats}</span> Conversations
                </span>
                <span>Store since {new Date(seller.createdAt).getFullYear()}</span>
              </div>
            </div>

            {/* Contact Button */}
            {isOwnStore ? (
              <button className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors">
                Edit Store
              </button>
            ) : (
              <button className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-medium transition-colors">
                Contact Seller
              </button>
            )}
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <form onSubmit={handleSearch} className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
              </div>
            </form>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value)
                setCurrentPage(1)
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="all">All Categories</option>
              {stats.categories.map((category) => (
                <option key={category} value={category} className="capitalize">
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Products Grid */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          {products.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                {products.map((product) => (
                  <div key={product._id} className="group cursor-pointer">
                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300 group-hover:scale-105">
                      <div className="aspect-square relative bg-gray-100">
                        <Image
                          src={product.images?.[0] || "/placeholder.svg?height=300&width=300"}
                          alt={product.name}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                        {product.isFeatured && (
                          <div className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded text-xs font-medium">
                            Featured
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="font-medium text-gray-900 mb-2 line-clamp-2 group-hover:text-red-600 transition-colors">
                          {product.name}
                        </h3>
                        <p className="text-red-600 font-bold text-lg mb-1">${product.price}</p>
                        <p className="text-sm text-gray-500 capitalize">{product.category}</p>
                        <div className="mt-3 flex gap-2">
                          {isOwnStore ? (
                            <button className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-3 rounded text-sm font-medium transition-colors">
                              Edit Product
                            </button>
                          ) : (
                            <>
                              <button className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 px-3 rounded text-sm font-medium transition-colors">
                                View Details
                              </button>
                              <button
                                onClick={() => handleChatWithSeller(product._id)}
                                className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-3 rounded text-sm font-medium transition-colors"
                              >
                                Chat
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex justify-center items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={!pagination.hasPrev}
                    className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Previous
                  </button>

                  <span className="px-4 py-2 text-sm text-gray-600">
                    Page {pagination.currentPage} of {pagination.totalPages}
                  </span>

                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, pagination.totalPages))}
                    disabled={!pagination.hasNext}
                    className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
              <p className="text-gray-500">Try adjusting your search or filter criteria.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
