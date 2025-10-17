// server.js
require('dotenv').config();
const express = require('express');
const multer = require('multer');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { SitemapStream, streamToPromise } = require("sitemap");

// Import routes
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const cardRoutes = require('./routes/card');
const contactRoutes = require('./routes/contact');
const suggestionRoutes = require('./routes/suggestion');
const shortUrlRoutes = require('./routes/shortUrlRoutes');
const walletRoutes = require('./routes/wallet');

const sharedfunctions = require('./services/sharedfunctions')
let envVariables = sharedfunctions.readenvironmentconfig();
// console.log("shared functions: ", sharedfunctions.readenvironmentconfig());
// Import passport configuration
require('./config/passport')
const app = express();
/**
 * Sitemap implementation
 */

let sitemap;
// Generate sitemap once at startup
(async () => {
  const smStream = new SitemapStream({ hostname: "https://www.qrmypro.com" });

  smStream.write({ url: "/", changefreq: "daily", priority: 1.0 });
  smStream.write({ url: "/about", changefreq: "monthly", priority: 0.7 });
  smStream.write({ url: "/faq", changefreq: "monthly", priority: 0.7 });
  smStream.write({ url: "/signup", changefreq: "monthly", priority: 0.7 });
  smStream.write({ url: "/login", changefreq: "monthly", priority: 0.7 });
  smStream.write({ url: "/profile", changefreq: "monthly", priority: 0.7 });
  // add more dynamically if needed


  smStream.end();

  const data = await streamToPromise(smStream);
  sitemap = data.toString();
})();

// Serve sitemap.xml
app.get("/sitemap.xml", (req, res) => {
  res.header("Content-Type", "application/xml");
  res.send(sitemap);
});


/**
 * End: Sitemap code...!
 */

const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Load environment-specific .env file
const isProduction = process.env.NODE_ENV === 'production';
console.log("Isproduction: ", isProduction);
// Set URLs based on environment
const BASE_URL = envVariables.BASE_URL;
const GOOGLE_CALLBACK_URL = envVariables.GOOGLE_CALLBACK_URL;
const MONGODB_URI = envVariables.MONGODB_URI;

const PORT = process.env.PORT || 3030;

app.use(express.json());
app.use(cookieParser()); 
app.set('trust proxy', true);
// ADD THIS: Handle preflight requests

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://apis.google.com", "https://api.qrserver.com","https://cdnjs.cloudflare.com"],
      styleSrc: ["'self'", "'unsafe-inline'","https://cdnjs.cloudflare.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:", "https://api.qrserver.com"],
      connectSrc: ["'self'", "https://api.qrserver.com"],
      fontSrc: ["'self'", "https://cdnjs.cloudflare.com", "data:"]
    }
  }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  // Skip X-Forwarded-For validation
  validate: {
    xForwardedForHeader: false,
  },
  
  // Use direct IP instead
  keyGenerator: (req) => {
    return req.ip;
  }
});

// Rate limiting with special rules for QR generation
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
  // Skip X-Forwarded-For validation
  validate: {
    xForwardedForHeader: false,
  },
  
  // Use direct IP instead
  keyGenerator: (req) => {
    return req.ip;
  }
});

const qrLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // More restrictive for QR generation
  message: {
    success: false,
    message: 'QR generation rate limit exceeded. Please try again later.'
  },
  // Skip X-Forwarded-For validation
  validate: {
    xForwardedForHeader: false,
  },
  
  // Use direct IP instead
  keyGenerator: (req) => {
    return req.ip;
  }
});
app.use('/', shortUrlRoutes);

// Serve static files from "public"
app.use(express.static(path.join(__dirname, 'public')));
// console.log("Static path: ", path.join(__dirname, 'public'));
// Serve the main application
app.get('/', (req, res) => {
  // console.log("Inside default route: ", path.join(__dirname, 'public', 'gcadiwalimenu.html'));
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
  // res.sendFile(path.join(__dirname, 'public', 'gcadiwalimenu.html'));
});

app.get("/favicon.ico", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "favicon.ico"));
});

app.get("/about", (req, res) => {
  res.redirect('/?page=home');
    // Or just send file and read ?page=home from URL in JS
    // res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
app.get("/faq", (req, res) => {
  res.redirect('/?page=faq');
    // Or just send file and read ?page=home from URL in JS
    // res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
app.get("/signup", (req, res) => {
  res.redirect('/?page=signup');
    // Or just send file and read ?page=home from URL in JS
    // res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get("/login", (req, res) => {
  res.redirect('/?page=login');
    // Or just send file and read ?page=home from URL in JS
    // res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get("/profile", (req, res) => {
  res.redirect('/?page=profile');
    // Or just send file and read ?page=home from URL in JS
    // res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get("/usecase", (req, res) => {
  res.redirect('/?page=usecase');
    // Or just send file and read ?page=home from URL in JS
    // res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
app.get("/scenario", (req, res) => {
  res.redirect('/?page=usecase');
    // Or just send file and read ?page=home from URL in JS
    // res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
app.get("/wallet", (req, res) => {
  res.redirect('/?page=wallet');
    // Or just send file and read ?page=home from URL in JS
    // res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get("/robots.txt", (req, res) => {
  res.sendFile(path.join(__dirname, "robots.txt"));
});

app.get('/gcadiwalimenu', (req, res) => {
  // res.sendFile(path.join(__dirname, 'public', 'gcadiwalimenu.html'));
  res.sendFile(path.join(__dirname, 'public', 'gcadiwalimenu.html'));
});

app.use('/api/', generalLimiter);
app.use('/api/profile/regenerate-qr', qrLimiter);
app.use('/api/profile/generate-custom-qr', qrLimiter);

app.use('/api/contact', contactRoutes);
app.use('/api/suggestions', suggestionRoutes);
app.use('/api/wallet', walletRoutes);
// CORS configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['http://localhost:3030', 'http://localhost:8080', 
    'https://qrmypro.com/', 
    'https://api.qrmypro.com',
    'http://api.qrmypro.com',
    'https://qrmypro.com', 
    'https://www.qrmypro.com/',
    'https://www.qrmypro.com',
    'http://qrmypro.com/', 
    'http://qrmypro.com', 
    'http://www.qrmypro.com/',
    'http://www.qrmypro.com', 'capacitor://localhost',
    'ionic://localhost',
    'http://localhost',
    'https://localhost',
    'capacitor://*',
    'ionic://*'
  ]
    : ['http://localhost:3030', 'http://localhost:8080',
    'capacitor://localhost',
        'ionic://localhost',
        'http://localhost',
        'https://localhost', 
    'https://qrmypro.com/', 
    'https://qrmypro.com', 
    'https://www.qrmypro.com/',
    'https://www.qrmypro.com',
    'http://qrmypro.com/', 
    'http://qrmypro.com', 
    'http://www.qrmypro.com/',
    'http://www.qrmypro.com'],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'Cookie',
    'X-Requested-With',
    'Accept',
    'Origin'
  ],
  exposedHeaders: ['Set-Cookie']
};
app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    // IMPORTANT: Change sameSite for mobile app
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    // Allow cookies across subdomains
    domain: process.env.NODE_ENV === 'production' ? '.qrmypro.com' : undefined
  },
  proxy: true, // Trust proxy
  name: 'qrmypro.sid' // Custom session name
}));

app.use((req, res, next) => {
  // console.log("In response header");
  res.setHeader(
    'Content-Security-Policy',
    "style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com"
  );
  next();
})

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Static files
// app.use(express.static('public'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
//old //app.use('/uploads', express.static('uploads'));

// Database connection
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  // console.log('✅ Connected to MongoDB');
})
.catch((error) => {
  // console.error('❌ MongoDB connection error:', error);
  process.exit(1);
});

// Routes
app.use('/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/card', cardRoutes);
app.use('/card', cardRoutes);
// QR-specific routes
app.get('/qr/:cardId', async (req, res) => {
  try {
    const { cardId } = req.params;
    const { size = 400, format = 'png' } = req.query;
    
    const Profile = require('./models/Profile');
    const profile = await Profile.findOne({ cardId, isPublic: true });
    
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Card not found'
      });
    }

    // Track QR access
    QRMiddleware.trackQRUsage('direct_access')(req, res, () => {});
    
    const QRService = require('./services/qrService');
    const qrBuffer = await QRService.generateProfileQR(profile, {
      size: parseInt(size)
    });

    res.set({
      'Content-Type': `image/${format}`,
      'Content-Disposition': `inline; filename="qr-${cardId}.${format}"`
    });

    res.send(qrBuffer.qrBuffer || qrBuffer);
  } catch (error) {
    console.error('QR generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating QR code'
    });
  }
})
// Mount short URL routes BEFORE static files


// Handle individual card URLs
// app.get('/card/:cardId', (req, res) => {
//   res.sendFile(path.join(__dirname, 'public', 'index.html'));
// });


// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server Error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  // console.log(`🚀 Server running on port ${PORT}`);
  // console.log(`🌐 Base URL: ${process.env.BASE_URL}`);
  // console.log(`🌐 Mongo URL URL: ${process.env.MONGODB_URI}`);
  // console.log(`📱 Card URLs: ${process.env.BASE_URL}/card/:cardId`);
  console.log("App started on 3030 port");
});

//http://localhost:3030/api/card/debug/test