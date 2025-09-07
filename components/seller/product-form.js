"use client"

import { useState } from "react"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Textarea } from "../ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { X, Upload } from "lucide-react"

export default function ProductForm({ onSubmit, onCancel, initialData = null }) {
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    description: initialData?.description || "",
    price: initialData?.price || "",
    category: initialData?.category || "",
    images: initialData?.images || [],
    isFeatured: initialData?.isFeatured || false,
  })
  const [loading, setLoading] = useState(false)
  const [imageFiles, setImageFiles] = useState([])
  const [imagePreviews, setImagePreviews] = useState(initialData?.images || [])

  const categories = [
    "electronics",
    "fashion",
    "home",
    "sports",
    "books",
    "toys",
    "beauty",
    "automotive",
    "food",
    "other",
  ]

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

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))
  }

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files)
    if (files.length + imagePreviews.length > 3) {
      alert("You can only upload up to 3 images")
      return
    }

    for (const file of files) {
      if (file.type.startsWith("image/")) {
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
          // Fallback to original file if compression fails
          const reader = new FileReader()
          reader.onload = (e) => {
            setImagePreviews((prev) => [...prev, e.target.result])
            setImageFiles((prev) => [...prev, file])
          }
          reader.readAsDataURL(file)
        }
      }
    }
  }

  const handleImageRemove = (index) => {
    setImagePreviews((prev) => prev.filter((_, i) => i !== index))
    setImageFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const imagePromises = imageFiles.map((file) => {
        return new Promise((resolve) => {
          const reader = new FileReader()
          reader.onload = (e) => resolve(e.target.result)
          reader.readAsDataURL(file)
        })
      })

      const base64Images = await Promise.all(imagePromises)

      console.log("[v0] Number of images:", base64Images.length)
      console.log(
        "[v0] Total payload size (approx):",
        JSON.stringify({ ...formData, images: base64Images }).length / 1024,
        "KB",
      )

      const submitData = {
        ...formData,
        images: base64Images,
      }

      await onSubmit(submitData)
    } catch (error) {
      console.error("Error submitting form:", error)
      alert("Failed to save product. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
  }

  const handleDrop = async (e) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files).filter((file) => file.type.startsWith("image/"))

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

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{initialData ? "Edit Product" : "Add New Product"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Product Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Product Name *</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Enter product name"
              required
              disabled={loading}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Describe your product"
              rows={4}
              required
              disabled={loading}
            />
          </div>

          {/* Price and Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Price ($) *</Label>
              <Input
                id="price"
                name="price"
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={handleInputChange}
                placeholder="0.00"
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-border rounded-md bg-input focus:outline-none focus:ring-2 focus:ring-ring"
                required
                disabled={loading}
              >
                <option value="">Select category</option>
                {categories.map((category) => (
                  <option key={category} value={category} className="capitalize">
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Images */}
          <div className="space-y-2">
            <Label>Product Images (Max 3)</Label>
            <div className="space-y-3">
              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={preview || "/placeholder.svg"}
                        alt={`Product ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg border"
                      />
                      <Button
                        type="button"
                        size="icon"
                        variant="destructive"
                        className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleImageRemove(index)}
                        disabled={loading}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <div
                className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                  disabled={loading || imagePreviews.length >= 3}
                />
                <label
                  htmlFor="image-upload"
                  className={`cursor-pointer flex flex-col items-center gap-2 ${
                    imagePreviews.length >= 3 ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {imagePreviews.length >= 3 ? "Maximum 3 images allowed" : "Click to upload images or drag and drop"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Images will be automatically compressed for optimal upload
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Featured Toggle */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isFeatured"
              name="isFeatured"
              checked={formData.isFeatured}
              onChange={handleInputChange}
              disabled={loading}
              className="rounded border-border"
            />
            <Label htmlFor="isFeatured" className="text-sm">
              Mark as featured product
            </Label>
          </div>

          {/* Form Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
              className="flex-1 bg-transparent"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1 bg-red-500 hover:bg-red-600">
              {loading ? "Saving..." : initialData ? "Update Product" : "Add Product"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
