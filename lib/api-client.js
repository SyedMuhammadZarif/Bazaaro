"use client"

class ApiClient {
  constructor() {
    this.baseURL = process.env.NODE_ENV === "production" ? "" : "http://localhost:5000"
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`
    const config = {
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    }

    try {
      const response = await fetch(url, config)

      // Handle 401 errors by attempting token refresh
      if (response.status === 401 && !endpoint.includes("/auth/")) {
        const refreshSuccess = await this.refreshToken()
        if (refreshSuccess) {
          // Retry the original request
          return await fetch(url, config)
        } else {
          // Redirect to login if refresh fails
          window.location.href = "/login"
          throw new Error("Authentication failed")
        }
      }

      return response
    } catch (error) {
      console.error("API request failed:", error)
      throw error
    }
  }

  async refreshToken() {
    try {
      const response = await fetch(`${this.baseURL}/api/auth/refresh-token`, {
        method: "POST",
        credentials: "include",
      })
      return response.ok
    } catch (error) {
      console.error("Token refresh failed:", error)
      return false
    }
  }

  // Auth endpoints
  async login(email, password) {
    const response = await this.request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    })
    return response.json()
  }

  async signup(name, email, password, role) {
    const response = await this.request("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify({ name, email, password, role }),
    })
    return response.json()
  }

  async logout() {
    const response = await this.request("/api/auth/logout", {
      method: "POST",
    })
    return response.json()
  }

  // Product endpoints
  async getProducts() {
    const response = await this.request("/api/products")
    return response.json()
  }

  async getAllProducts() {
    const response = await this.request("/api/products")
    return response.json()
  }

  async getMyProducts() {
    const response = await this.request("/api/products/myProducts")
    return response.json()
  }

  async getFeaturedProducts() {
    const response = await this.request("/api/products/featured")
    return response.json()
  }

  async createProduct(productData) {
    const response = await this.request("/api/products", {
      method: "POST",
      body: JSON.stringify(productData),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Failed to create product")
    }

    return response.json()
  }

  async updateProduct(productId, productData) {
    const response = await this.request(`/api/products/${productId}`, {
      method: "PUT",
      body: JSON.stringify(productData),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Failed to update product")
    }

    return response.json()
  }

  async deleteProduct(productId) {
    const response = await this.request(`/api/products/${productId}`, {
      method: "DELETE",
    })
    return response.json()
  }

  // Chat endpoints
  async getChats() {
    const response = await this.request("/api/chat")
    return response.json()
  }

  async getChatMessages(chatId) {
    const response = await this.request(`/api/chat/${chatId}/messages`)
    return response.json()
  }

  async createChat(participantId, productId = null) {
    const response = await this.request("/api/chat", {
      method: "POST",
      body: JSON.stringify({ participantId, productId }),
    })
    return response.json()
  }

  // Analytics endpoints
  async getSellerAnalytics() {
    const response = await this.request("/api/analytics/dashboard")
    return response.json()
  }

  async getProductAnalytics(productId) {
    const response = await this.request(`/api/analytics/product/${productId}`)
    return response.json()
  }

  async getSubscriptionStatus() {
    const response = await this.request("/api/analytics/subscription")
    return response.json()
  }

  // Profile endpoints
  async getUserProfile(userId) {
    console.log("[v0] API Client: Calling getUserProfile for userId:", userId)
    try {
      const response = await this.request(`/api/profile/${userId}`)
      console.log("[v0] API Client: Response status:", response.status)
      console.log("[v0] API Client: Response ok:", response.ok)

      if (!response.ok) {
        const errorText = await response.text()
        console.log("[v0] API Client: Error response:", errorText)
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const data = await response.json()
      console.log("[v0] API Client: getUserProfile response data:", data)
      console.log("[v0] API Client: data.user exists:", data.user ? "Yes" : "No")
      console.log("[v0] API Client: Full data structure:", JSON.stringify(data, null, 2))
      return data
    } catch (error) {
      console.error("[v0] API Client: getUserProfile error:", error)
      throw error
    }
  }

  async updateProfile(profileData) {
    const response = await this.request("/api/profile/update", {
      method: "PUT",
      body: JSON.stringify(profileData),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Failed to update profile")
    }

    return response.json()
  }

  async getSellerStore(sellerId, params = {}) {
    const queryString = new URLSearchParams(params).toString()
    const response = await this.request(`/api/profile/store/${sellerId}?${queryString}`)
    return response.json()
  }

  // Payment endpoints
  async createCheckoutSession(planType, duration) {
    const response = await this.request("/api/payments/create-checkout-session", {
      method: "POST",
      body: JSON.stringify({ planType, duration }),
    })
    return response.json()
  }

  async cancelSubscription() {
    const response = await this.request("/api/payments/cancel-subscription", {
      method: "POST",
    })
    return response.json()
  }

  // Admin endpoints
  async getAdminStats() {
    const response = await this.request("/api/admin/stats")
    return response.json()
  }

  async getAllUsers(params = {}) {
    const queryString = new URLSearchParams(params).toString()
    const response = await this.request(`/api/admin/users?${queryString}`)
    return response.json()
  }

  async banUser(userId, reason) {
    const response = await this.request(`/api/admin/users/${userId}/ban`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    })
    return response.json()
  }

  async unbanUser(userId) {
    const response = await this.request(`/api/admin/users/${userId}/unban`, {
      method: "POST",
    })
    return response.json()
  }

  // Admin product management
  async getAllProductsForModeration(params = {}) {
    const queryString = new URLSearchParams(params).toString()
    const response = await this.request(`/api/admin/products?${queryString}`)
    return response.json()
  }

  async deleteProductAdmin(productId, reason) {
    const response = await this.request(`/api/admin/products/${productId}`, {
      method: "DELETE",
      body: JSON.stringify({ reason }),
    })
    return response.json()
  }

  async toggleProductFlag(productId) {
    const response = await this.request(`/api/admin/products/${productId}/flag`, {
      method: "PUT",
    })
    return response.json()
  }

  // Picked items endpoints
  async getPickedItems() {
    const response = await this.request("/api/pickedItems")
    return response.json()
  }

  async addPickedItem(productId) {
    const response = await this.request("/api/pickedItems", {
      method: "POST",
      body: JSON.stringify({ productId }),
    })
    return response.json()
  }

  async removePickedItem(productId) {
    const response = await this.request(`/api/pickedItems/${productId}`, {
      method: "DELETE",
    })
    return response.json()
  }

  async removeDuplicatePickedItems() {
    const response = await this.request("/api/pickedItems/remove-duplicates", {
      method: "POST",
    })
    return response.json()
  }

  // Post endpoints
  async getAllPosts(params = {}) {
    const queryString = new URLSearchParams(params).toString()
    const response = await this.request(`/api/posts?${queryString}`)
    return response.json()
  }

  async getUserPosts(userId, params = {}) {
    const queryString = new URLSearchParams(params).toString()
    const response = await this.request(`/api/posts/user/${userId}?${queryString}`)
    return response.json()
  }

  async createPost(postData) {
    const response = await this.request("/api/posts", {
      method: "POST",
      body: JSON.stringify(postData),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Failed to create post")
    }

    return response.json()
  }

  async toggleLikePost(postId) {
    const response = await this.request(`/api/posts/${postId}/like`, {
      method: "POST",
    })
    return response.json()
  }

  async addComment(postId, content) {
    const response = await this.request(`/api/posts/${postId}/comment`, {
      method: "POST",
      body: JSON.stringify({ content }),
    })
    return response.json()
  }

  async updatePost(postId, postData) {
    const response = await this.request(`/api/posts/${postId}`, {
      method: "PUT",
      body: JSON.stringify(postData),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Failed to update post")
    }

    return response.json()
  }

  async deletePost(postId) {
    const response = await this.request(`/api/posts/${postId}`, {
      method: "DELETE",
    })
    return response.json()
  }
}

export const apiClient = new ApiClient()
