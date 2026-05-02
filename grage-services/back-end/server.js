const express = require('express');
const path = require('path');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
require('dotenv').config();
const errorHandler = require('./middleware/errorMiddleware');
const { connectDB } = require('./config/db');

// Import Routes
const userRoutes = require('./routes/userRoutes');
const billingRoutes = require('./routes/billingRoutes');
const contactRoutes = require('./routes/contactRoutes');
const authRoutes = require('./routes/authRoutes');
const servicesRoutes = require('./routes/servicesRoutes');
const vehicleRoutes = require('./routes/vehicleRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const assignmentRoutes = require('./routes/assignmentRoutes');
const breakdownRoutes = require('./routes/breakdownRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const modificationRoutes = require('./routes/modificationRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const repairRoutes = require('./routes/repairRoutes');
const packageRoutes = require('./routes/packageRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const mechanicRoutes = require('./routes/mechanicRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const authMiddleware = require('./middleware/authMiddleware');
const bookingController = require('./controllers/bookingController');
const billingController = require('./controllers/billingController');

const app = express();

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  'http://localhost:5000',
  process.env.FRONTEND_URL,
].filter(Boolean);

// Enable CORS for frontend
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());



app.use('/', userRoutes);
app.use('/', billingRoutes);
app.use('/', contactRoutes);
app.use('/', authRoutes);
app.use('/', servicesRoutes);
app.use('/', vehicleRoutes);
app.use('/', bookingRoutes);
app.use('/', assignmentRoutes);
app.use('/', breakdownRoutes);
app.use('/', inventoryRoutes);
app.use('/', modificationRoutes);
app.use('/', analyticsRoutes);
app.use('/', notificationRoutes);
app.use('/', settingsRoutes);
app.use('/', repairRoutes);
app.use('/', packageRoutes);
app.use('/', uploadRoutes);
app.use('/', mechanicRoutes);
app.use('/', paymentRoutes);
app.use('/', reviewRoutes);

// Customer dashboard aliases
app.get('/customer/bookings', authMiddleware, bookingController.getMyBookings);
app.get('/customer/service-history', authMiddleware, bookingController.getMyServiceHistory);
app.get('/customer/invoices', authMiddleware, (req, res, next) => {
  const userId = req.user.userId || String(req.user._id);
  req.params.userId = String(userId);
  return billingController.getBillingByUser(req, res, next);
});

// Swagger Setup
const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "User API",
      version: "1.0.0",
      description: "Express API with Routes and Controller"
    },
    
    servers: [
      {
        url: "http://localhost:5000"
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT"
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ],
  },
  apis: [path.join(__dirname, 'routes', '*.js')],
};

const swaggerSpec = swaggerJsdoc(options);
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use(errorHandler);
const port = process.env.PORT || 5000;

const startServer = async () => {
  const skipDb = process.env.SKIP_DB === 'true';

  try {
    if (!skipDb) {
      await connectDB();
    } else {
      console.warn('SKIP_DB=true, starting server without database connection.');
    }

    app.listen(port, () => {
      console.log(`Server running at http://localhost:${port}`);
    });
  } catch (error) {
    console.error('Database connection failed.');
    console.error(error.message);
    process.exit(1);
  }
};

startServer();
