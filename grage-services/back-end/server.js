const express = require('express');
const path = require('path');
const cors = require('cors');
const compression = require('compression');
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
const { getConfiguredOrigins, isAllowedFrontendOrigin } = require('./utils/frontendOrigin');

const app = express();

const allowedOrigins = getConfiguredOrigins();

// Flexible CORS origin validator:
// - Allows exact matches from `allowedOrigins`
// - Allows common hosting domains for convenience (vercel and render)
// - Allows non-browser requests (no origin)
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || isAllowedFrontendOrigin(origin)) return callback(null, true);
    return callback(new Error('Origin not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Gzip compression middleware - reduces response size by ~70%
app.use(compression({
  level: 6, // Balance between compression ratio and CPU usage
  threshold: 1024, // Only compress responses > 1KB
}));

app.use(express.json());

// Health check endpoint (no auth required)
app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));

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
const publicBackendUrl = process.env.RENDER_EXTERNAL_URL || process.env.BACKEND_URL || 'http://localhost:5000';

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
        url: publicBackendUrl
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
      console.log(`Server running on port ${port}`);
    });
  } catch (error) {
    console.error('Database connection failed.');
    console.error(error.message);
    process.exit(1);
  }
};

startServer();
