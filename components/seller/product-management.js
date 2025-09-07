"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "../ui/card"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import { Input } from "../ui/input"
import { Plus, Search, Edit, Trash2, Star, Eye, MessageCircle, Filter, Package } from "lucide-react"
import ProductForm from "./product-form"
import { apiClient } from "../../lib/api-client"

export default function ProductManagement() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const data = await apiClient.getMyProducts()
      setProducts(data)
    } catch (error) {
      console.error("Error fetching products:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddProduct = () => {
    setEditingProduct(null)
    setShowForm(true)
  }

  const handleEditProduct = (product) => {
    setEditingProduct(product)
    setShowForm(true)
  }

  const handleDeleteProduct = async (productId) => {
    if (!confirm("Are you sure you want to delete this product?")) return

    try {
      await apiClient.deleteProduct(productId)
      setProducts(products.filter((p) => p._id !== productId))
      alert("Product deleted successfully!")
    } catch (error) {
      console.error("Error deleting product:", error)
      alert("Failed to delete product. Please try again.")
    }
  }

  const handleFormSubmit = async (formData) => {
    try {
      if (editingProduct) {
        const updatedProduct = await apiClient.updateProduct(editingProduct._id, formData)
        setProducts(products.map((p) => (p._id === editingProduct._id ? updatedProduct : p)))
        alert("Product updated successfully!")
      } else {
        const newProduct = await apiClient.createProduct(formData)
        setProducts([newProduct, ...products])
        alert("Product added successfully!")
      }
      setShowForm(false)
      setEditingProduct(null)
    } catch (error) {
      console.error("Error saving product:", error)
      throw error
    }
  }

  const handleFormCancel = () => {
    setShowForm(false)
    setEditingProduct(null)
  }

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (showForm) {
    return <ProductForm onSubmit={handleFormSubmit} onCancel={handleFormCancel} initialData={editingProduct} />
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Product Management</h2>
          <p className="text-gray-600">Manage your product listings and inventory</p>
        </div>
        <Button className="bg-red-500 hover:bg-red-600" onClick={handleAddProduct}>
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline">
          <Filter className="h-4 w-4 mr-2" />
          Filters
        </Button>
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm ? "Try adjusting your search terms" : "Start by adding your first product"}
            </p>
            <Button className="bg-red-500 hover:bg-red-600" onClick={handleAddProduct}>
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredProducts.map((product) => (
            <Card key={product._id} className="overflow-hidden">
              <div className="relative">
                <img
                  src={product.images?.[0] || "/placeholder.svg?height=192&width=300"}
                  alt={product.name}
                  className="w-full h-48 object-cover"
                />
                {product.isFeatured && (
                  <Badge className="absolute top-2 left-2 bg-yellow-500">
                    <Star className="h-3 w-3 mr-1" />
                    Featured
                  </Badge>
                )}
                <div className="absolute top-2 right-2 flex space-x-1">
                  <Button size="sm" variant="secondary" className="h-8 w-8 p-0">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-8 w-8 p-0"
                    onClick={() => handleEditProduct(product)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="h-8 w-8 p-0"
                    onClick={() => handleDeleteProduct(product._id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-lg truncate">{product.name}</h3>
                  <span className="text-lg font-bold text-red-600">${product.price}</span>
                </div>

                <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.description}</p>

                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-xs">
                    {product.category || "Uncategorized"}
                  </Badge>
                  <div className="flex items-center space-x-3 text-sm text-gray-500">
                    <div className="flex items-center">
                      <Eye className="h-4 w-4 mr-1" />
                      <span>0</span>
                    </div>
                    <div className="flex items-center">
                      <MessageCircle className="h-4 w-4 mr-1" />
                      <span>0</span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t">
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Created: {new Date(product.createdAt).toLocaleDateString()}</span>
                    <span
                      className={`px-2 py-1 rounded ${
                        product.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {product.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
