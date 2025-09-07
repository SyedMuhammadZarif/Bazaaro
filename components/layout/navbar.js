"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "../ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import { Badge } from "../ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu"
import { ShoppingBag, Search, ShoppingBasket, User, Settings, LogOut, Menu, X } from "lucide-react"
import { useAuth } from "../../lib/auth-context"
import { apiClient } from "../../lib/api-client"

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [pickedItemsCount, setPickedItemsCount] = useState(0)
  const { user, isAuthenticated, logout, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isAuthenticated) {
      fetchPickedItemsCount()
    } else {
      setPickedItemsCount(0)
    }
  }, [isAuthenticated])

  const fetchPickedItemsCount = async () => {
    try {
      if (user?.role === "buyer") {
        const response = await apiClient.getPickedItems()
        setPickedItemsCount(response.pickedItems?.length || 0)
      }
    } catch (error) {
      console.error("Error fetching picked items count:", error)
      setPickedItemsCount(0)
    }
  }

  const handleLogout = async () => {
    await logout()
    router.push("/")
  }

  const getDashboardLink = () => {
    if (user?.role === "admin") return "/admin/dashboard"
    if (user?.role === "seller") return "/seller/dashboard"
    return "/profile"
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchTerm.trim()) {
      router.push(`/?search=${encodeURIComponent(searchTerm)}&type=all`)
    }
  }

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/?tab=feed" className="flex items-center space-x-2">
            <div className="h-8 w-8 bg-red-500 rounded-full flex items-center justify-center">
              <ShoppingBag className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">Bazaaro</span>
          </Link>

          {/* Desktop Basket */}
          <div className="hidden md:flex items-center space-x-8">
            {!loading && isAuthenticated && user?.role === "buyer" && (
              <Link
                href="/picked"
                className="text-gray-700 hover:text-red-600 font-medium relative"
              >
                <ShoppingBasket className="h-5 w-5" />
                {pickedItemsCount > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-red-500 text-white">
                    {pickedItemsCount > 99 ? "99+" : pickedItemsCount}
                  </Badge>
                )}
              </Link>
            )}
          </div>

          {/* Search Bar */}
          <div className="hidden md:flex flex-1 max-w-lg mx-8">
            <form onSubmit={handleSearch} className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search products and stores..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </form>
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {!loading && (
              isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user?.profilePicture || "/placeholder.svg"} alt={user?.name} />
                        <AvatarFallback className="bg-red-100 text-red-600">
                          {user?.name?.charAt(0)?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user?.name}</p>
                        <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                        {user?.role && (
                          <Badge variant="outline" className="w-fit text-xs capitalize">
                            {user.role}
                          </Badge>
                        )}
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href={`/profile/${user?._id}`} className="flex items-center">
                        <User className="mr-2 h-4 w-4" />
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={getDashboardLink()} className="flex items-center">
                        <Settings className="mr-2 h-4 w-4" />
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                    {user?.role === "seller" && (
                      <DropdownMenuItem asChild>
                        <Link href={`/profile/${user?._id}?tab=store`} className="flex items-center">
                          <ShoppingBag className="mr-2 h-4 w-4" />
                          My Store
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                      <LogOut className="mr-2 h-4 w-4" />
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" asChild>
                    <Link href="/login">Login</Link>
                  </Button>
                  <Button asChild>
                    <Link href="/login">Sign Up</Link>
                  </Button>
                </div>
              )
            )}

            {/* Mobile menu button */}
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && !loading && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <div className="flex flex-col space-y-4">
              {isAuthenticated && user?.role === "buyer" && (
                <Link
                  href="/picked"
                  className="text-gray-700 hover:text-red-600 font-medium flex items-center space-x-2"
                >
                  <ShoppingBasket className="h-4 w-4" />
                  <span>Picked Items</span>
                  {pickedItemsCount > 0 && (
                    <Badge className="h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-red-500 text-white">
                      {pickedItemsCount > 99 ? "99+" : pickedItemsCount}
                    </Badge>
                  )}
                </Link>
              )}
              <div className="pt-4 border-t border-gray-200">
                <form onSubmit={handleSearch} className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search products and stores..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
