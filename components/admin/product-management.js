"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Badge } from "../ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../ui/alert-dialog"
import { Search, Trash2, Flag, Eye, Package, Calendar, DollarSign, User } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { apiClient } from "../../lib/api-client"

export default function ProductManagement() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [flaggedFilter, setFlaggedFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    fetchProducts()
  }, [currentPage, categoryFilter, flaggedFilter, searchTerm])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const params = {
        page: currentPage,
        limit: 20,
        ...(categoryFilter !== "all" && { category: categoryFilter }),
        ...(flaggedFilter !== "all" && { flagged: flaggedFilter === "flagged" }),
        ...(searchTerm && { search: searchTerm }),
      }

      const data = await apiClient.getAllProductsForModeration(params)
      setProducts(data.products || [])
      setTotalPages(data.totalPages || 1)
      setTotal(data.total || 0)
    } catch (error) {
      console.error("Error fetching products:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteProduct = async (productId, reason) => {
    try {
      await apiClient.deleteProductAdmin(productId, reason)
      setProducts(products.filter((p) => p._id !== productId))
      alert("Product deleted successfully!")
    } catch (error) {
      console.error("Error deleting product:", error)
      alert("Failed to delete product. Please try again.")
    }
  }

  const handleToggleFlag = async (productId) => {
    try {
      await apiClient.toggleProductFlag(productId)
      // Refresh the products list
      fetchProducts()
      alert("Product flag status updated!")
    } catch (error) {
      console.error("Error toggling product flag:", error)
      alert("Failed to update product flag. Please try again.")
    }
  }

  const getStatusBadge = (product) => {
    if (product.isFlagged) {
      return <Badge variant="destructive">Flagged</Badge>
    }
    if (product.isFeatured) {
      return <Badge className="bg-yellow-500">Featured</Badge>
    }
    return <Badge variant="secondary">Active</Badge>
  }

  const getRoleBadge = (role) => {
    const colors = {
      seller: "bg-blue-500",
      buyer: "bg-green-500",
      admin: "bg-red-500",
    }
    return <Badge className={colors[role] || "bg-gray-500"}>{role}</Badge>
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
          <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <div className="h-48 bg-gray-200 animate-pulse"></div>
              <CardContent className="p-4">
                <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Product Management</h2>
          <p className="text-gray-600">Moderate and manage all products on the platform</p>
        </div>
        <div className="text-sm text-gray-500">
          {total} total products
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search products by name or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="electronics">Electronics</SelectItem>
            <SelectItem value="clothing">Clothing</SelectItem>
            <SelectItem value="home">Home & Garden</SelectItem>
            <SelectItem value="sports">Sports</SelectItem>
            <SelectItem value="books">Books</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
        <Select value={flaggedFilter} onValueChange={setFlaggedFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="flagged">Flagged Only</SelectItem>
            <SelectItem value="active">Active Only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Products Grid */}
      {products.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-500">No products match your current filters</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <Card key={product._id} className="overflow-hidden">
              <div className="relative">
                <img
                  src={product.images?.[0] || "/placeholder.svg?height=192&width=300"}
                  alt={product.name}
                  className="w-full h-48 object-cover"
                />
                <div className="absolute top-2 left-2 flex gap-2">
                  {getStatusBadge(product)}
                </div>
                <div className="absolute top-2 right-2 flex space-x-1">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-8 w-8 p-0"
                    onClick={() => handleToggleFlag(product._id)}
                  >
                    <Flag className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="destructive" className="h-8 w-8 p-0">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Product</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{product.name}"? This action cannot be undone.
                          The seller will be notified about this removal.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <div className="py-4">
                        <Input
                          placeholder="Reason for deletion (optional)"
                          id="delete-reason"
                        />
                      </div>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => {
                            const reason = document.getElementById("delete-reason").value
                            handleDeleteProduct(product._id, reason)
                          }}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Delete Product
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>

              <CardContent className="p-4">
                <div className="space-y-3">
                  <div>
                    <h3 className="font-semibold text-gray-900 line-clamp-2">{product.name}</h3>
                    <p className="text-sm text-gray-600 line-clamp-2 mt-1">{product.description}</p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      <span className="font-semibold text-green-600">${product.price}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-500">
                        {formatDistanceToNow(new Date(product.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                  </div>

                  {/* Seller Info */}
                  <div className="flex items-center space-x-2 pt-2 border-t">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={product.owner?.profilePicture} />
                      <AvatarFallback className="text-xs">
                        {product.owner?.name?.charAt(0)?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {product.owner?.name}
                      </p>
                      <div className="flex items-center space-x-2">
                        {getRoleBadge(product.owner?.role)}
                        <Badge
                          variant={product.owner?.status === "active" ? "default" : "destructive"}
                        >
                          {product.owner?.status}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Product Stats */}
                  <div className="flex items-center justify-between text-sm text-gray-500 pt-2 border-t">
                    <div className="flex items-center space-x-4">
                      <span>Category: {product.category}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Eye className="h-4 w-4" />
                      <span>Views: {product.views || 0}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center space-x-2">
          <Button
            variant="outline"
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <span className="flex items-center px-4 py-2 text-sm text-gray-700">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}

