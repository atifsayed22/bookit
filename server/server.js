import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import userRoutes from "./routes/userRoutes.js";
import businessRoutes from "./routes/businessRoutes.js";
import serviceRoutes from "./routes/serviceRoutes.js";
import appointmentRoutes from "./routes/appointmentRoutes.js";
import customerRoutes from "./routes/customerRoutes.js";


dotenv.config();

// Initialize database
connectDB();

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Debug middleware
app.use((req, res, next) => {
  console.log(`📡 ${req.method} ${req.originalUrl}`);
  if (req.headers.authorization) {
    console.log(`🔑 Auth header present: ${req.headers.authorization.substring(0, 20)}...`);
  } else {
    console.log(`❌ No auth header`);
  }
  next();
});

app.get('/', (req, res) => {
    res.send('BookVerse API is running...')
});

// API Routes
app.use("/api/users", userRoutes);
app.use('/api/businesses', businessRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/customers', customerRoutes);


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
