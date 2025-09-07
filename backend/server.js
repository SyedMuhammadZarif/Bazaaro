import express from "express"
import dotenv from "dotenv"
import { createServer } from "http"
import { Server } from "socket.io"
import cors from "cors"
import authRoutes from "./routes/auth.route.js"
import { connectDB } from "./lib/db.js"
import cookieParser from "cookie-parser"
import productRoutes from "./routes/product.route.js"
import pickedRoutes from "./routes/picked.route.js"
import paymentRoutes from "./routes/payment.route.js"
import analyticsRoutes from "./routes/analytics.route.js"
import chatRoutes from "./routes/chat.route.js"
import adminRoutes from "./routes/admin.route.js"
import profileRoutes from "./routes/profile.route.js"
import postRoutes from "./routes/post.route.js"
import { setupSocketHandlers } from "./lib/socket.js"

dotenv.config()

const app = express()
const server = createServer(app)
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
})

const PORT = process.env.PORT || 5000

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  }),
)

app.use(express.json({ limit: "50mb" }))
app.use(express.urlencoded({ limit: "50mb", extended: true }))
app.use(cookieParser())

app.use("/api/auth", authRoutes)
app.use("/api/products", productRoutes)
app.use("/api/pickedItems", pickedRoutes)
app.use("/api/payments", paymentRoutes)
app.use("/api/analytics", analyticsRoutes)
app.use("/api/chat", chatRoutes)
app.use("/api/admin", adminRoutes)
app.use("/api/profile", profileRoutes)
app.use("/api/posts", postRoutes)

setupSocketHandlers(io)

server.listen(PORT, () => {
  console.log(`Server is running on port http://localhost:${PORT}`)
  connectDB()
})
