import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import swaggerJsDoc from 'swagger-jsdoc';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import connectDB from './config/database';

dotenv.config();

// Connect to MongoDB Database
connectDB();

const app: Express = express();

// 1. Required for Render/Cloudflare proxy support
app.set('trust proxy', 1);

// 2. CORS: Must be the VERY FIRST middleware to ensure headers are present even on errors
const allowedOrigins = [
    'https://medicohub.com.ng',
    'https://www.medicohub.com.ng',
    'https://admin.medicohub.com.ng',
    'https://medicohubwebsite.pages.dev',
    'https://medicohubadminsite.pages.dev',
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:3000',
    'http://localhost:4173',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
    'http://127.0.0.1:3000'
];

app.use(cors({
    origin: (origin, callback) => {
        // 1. Allow if no origin (like mobile apps/curl)
        if (!origin) return callback(null, true);

        // 2. Allow explicitly listed domains
        if (allowedOrigins.includes(origin)) return callback(null, true);

        // 3. Allow ANY onrender.com subdomain (to handle Render URL changes)
        if (origin.endsWith('.onrender.com')) return callback(null, true);

        // 3b. Allow GitHub Pages origins
        if (origin.endsWith('.github.io')) return callback(null, true);

        // 4. Allow all localhost/127.0.0.1 variations
        if (origin.includes('localhost') || origin.includes('127.0.0.1')) return callback(null, true);

        // 5. Development Mode: Allow everything
        if (process.env.NODE_ENV !== 'production') return callback(null, true);

        // Otherwise reject
        console.warn(`[CORS] Rejected blocking request from: ${origin}`);
        callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-secret']
}));

// 5. Handle Preflight Requests Explicitly
app.options('*', cors());

// SECURITY: Hide that we are using Express
app.disable('x-powered-by');

// 3. Fundamental Middlewares
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));
const port = process.env.PORT || 5000;

// SECURITY: Add extra safety headers (Helmet)
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// SECURITY: Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

// Global Request Logger
app.use((req, res, next) => {
    if (process.env.NODE_ENV !== 'production' || req.path.startsWith('/api/')) {
        console.log(`[Request] ${new Date().toISOString()} | ${req.method} ${req.path} | Origin: ${req.headers.origin}`);
        if (req.headers.authorization) {
            console.log(`[Auth] Header present (${req.headers.authorization.substring(0, 15)}...)`);
        }
    }
    next();
});

// Health Check for Render/Monitoring
app.get('/health', (req, res) => {
    res.json({
        status: 'online',
        timestamp: new Date().toISOString(),
        version: '3.0.5'
    });
});


// Swagger Setup
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Medico V3 Admin API',
            version: '1.0.0',
            description: 'Backend API for Medico Hub V3',
        },
        servers: [
            {
                url: process.env.API_URL || `http://localhost:${port}`,
                description: process.env.NODE_ENV === 'production' ? 'Production Server' : 'Local Server'
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
        security: [{ bearerAuth: [] }],
    },
    apis: ['./src/modules/**/*.routes.ts'],
};

const specs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// Basic Route
app.get('/', (req: Request, res: Response) => {
    res.send('Medico V3 Backend is Running');
});

// 4. API Routes
import authRoutes from './modules/auth/auth.routes';
import userRoutes from './modules/user/user.routes';
import analyticsRoutes from './modules/analytics/analytics.routes';
import resourceRoutesV3 from './modules/resources/resource.routes';
import curriculumRoutes from './modules/resources/curriculum.routes';
import notificationRoutes from './modules/user/notification.routes';
import settingsRoutes from './modules/user/settings.routes';
import analyticsRoutesV3 from './modules/analytics/analytics.v3.routes';
import productRoutes from './modules/products/product.routes';
import uploadRoutes from './modules/upload/upload.routes';
import couponRoutes from './modules/coupons/coupon.routes';
import deliveryRoutes from './modules/delivery/delivery.routes';
import orderRoutes from './modules/orders/order.routes';
import cohortRoutes from './modules/cohort/cohort.routes';

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/curriculum', curriculumRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/settings', settingsRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v3/resources', resourceRoutesV3);
app.use('/api/v3/analytics', analyticsRoutesV3);
app.use('/api/v3/products', productRoutes);
app.use('/api/v1/upload', uploadRoutes);
app.use('/api/v1/coupons', couponRoutes);
app.use('/api/v1/delivery', deliveryRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/cohorts', cohortRoutes);

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: any) => {
    if (process.env.NODE_ENV !== 'production') {
        console.error(`[Error] ${req.method} ${req.path}:`, err.message);
    }

    res.status(err.status || 500).json({
        error: process.env.NODE_ENV === 'production'
            ? 'An internal server error occurred'
            : err.message
    });
});

app.listen(port, () => {
    console.log(`[server]: Medico V3 Backend Running on port ${port}`);
    console.log(`[server]: Build v3.0.5 - Trust Proxy: ${app.get('trust proxy')}`);
    if (process.env.NODE_ENV !== 'production') {
        console.log(`[docs]: Swagger UI is available at http://localhost:${port}/api-docs`);
    }
});
