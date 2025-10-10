// Setup Instructions

## 1. Installation Steps

### Install Dependencies
```bash
npm install express mongoose passport passport-google-oauth20 express-session cors dotenv multer uuid qrcode helmet express-rate-limit bcrypt jsonwebtoken nodemailer sharp
```

### Development Dependencies
```bash
npm install -D nodemon
```

## 2. Google OAuth Setup

### Go to Google Cloud Console:
1. Visit https://console.cloud.google.com/
2. Create a new project or select existing one
3. Enable Google+ API
4. Go to Credentials → Create Credentials → OAuth 2.0 Client ID
5. Set authorized redirect URI: http://localhost:3030/auth/google/callback

### Update .env file:
```
GOOGLE_CLIENT_ID=your_actual_google_client_id_here
GOOGLE_CLIENT_SECRET=your_actual_google_client_secret_here
```

## 3. MongoDB Setup

### Local MongoDB:
```bash
# Install MongoDB
# Ubuntu/Debian:
sudo apt-get install mongodb

# macOS:
brew install mongodb

# Start MongoDB
sudo systemctl start mongodb  # Linux
brew services start mongodb   # macOS
```

### MongoDB Atlas (Cloud):
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/smartlifecover
```

## 4. Directory Structure
```
smartlifecover-server/
├── config/
│   └── passport.js
├── models/
│   ├── User.js
│   ├── Profile.js
│   └── Analytics.js
├── routes/
│   ├── auth.js
│   ├── profile.js
│   └── card.js
├── middleware/
│   └── validation.js
├── utils/
│   ├── database.js
│   ├── qrGenerator.js
│   └── analytics.js
├── public/
│   └── index.html (your frontend)
├── uploads/ (created automatically)
├── server.js
├── package.json
└── .env
```

## 5. Frontend Integration JavaScript

// frontend-integration.js
class SmartLifeCoverAPI {
  constructor(baseURL = 'http://localhost:3030') {
    this.baseURL = baseURL;
    this.token = this.getToken();
  }

  // Get stored auth token
  getToken() {
    return localStorage.getItem('authToken') || null;
  }

  // Set auth token
  setToken(token) {
    this.token = token;
    localStorage.setItem('authToken', token);
  }

  // Clear auth token
  clearToken() {
    this.token = null;
    localStorage.removeItem('authToken');
  }

  // Make authenticated API request
  async apiRequest(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    if (this.token) {
      config.headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'API request failed');
      }
      
      return data;
    } catch (error) {
      console.error('API Request Error:', error);
      throw error;
    }
  }

  // Authentication methods
  async checkAuthStatus() {
    try {
      const response = await this.apiRequest('/auth/status');
      return response.authenticated;
    } catch (error) {
      return false;
    }
  }

  async getCurrentUser() {
    return this.apiRequest('/auth/me');
  }

  async logout() {
    try {
      await this.apiRequest('/auth/logout', { method: 'POST' });
      this.clearToken();
      return true;
    } catch (error) {
      console.error('Logout error:', error);
      return false;
    }
  }

  // Profile methods
  async getProfile() {
    return this.apiRequest('/api/profile');
  }

  async saveProfile(profileData) {
    return this.apiRequest('/api/profile', {
      method: 'POST',
      body: JSON.stringify(profileData)
    });
  }

  async uploadQRCode(file) {
    const formData = new FormData();
    formData.append('qrCode', file);

    return this.apiRequest('/api/profile/upload-qr', {
      method: 'POST',
      headers: {}, // Remove Content-Type to let browser set it for FormData
      body: formData
    });
  }

  async deleteProfile() {
    return this.apiRequest('/api/profile', { method: 'DELETE' });
  }

  async getAnalytics() {
    return this.apiRequest('/api/profile/analytics');
  }

  // Card methods
  async getPublicCard(cardId) {
    return this.apiRequest(`/api/card/${cardId}`);
  }

  async downloadVCard(cardId) {
    const url = `${this.baseURL}/api/card/${cardId}/vcard`;
    window.open(url, '_blank');
  }

  async downloadWalletPass(cardId) {
    const url = `${this.baseURL}/api/card/${cardId}/wallet-pass`;
    window.open(url, '_blank');
  }

  async getQRCode(cardId, size = 400) {
    return `${this.baseURL}/api/card/${cardId}/qr?size=${size}`;
  }

  async trackSocialClick(cardId, platform) {
    return this.apiRequest(`/api/card/${cardId}/track/${platform}`, {
      method: 'POST'
    });
  }

  async trackContactClick(cardId, action) {
    return this.apiRequest(`/api/card/${cardId}/track/contact/${action}`, {
      method: 'POST'
    });
  }

  // Search
  async searchCards(query, limit = 10) {
    return this.apiRequest(`/api/card/search/${encodeURIComponent(query)}?limit=${limit}`);
  }
}

// Initialize API instance
const api = new SmartLifeCoverAPI();

// Updated frontend functions
async function loginWithGoogle() {
  window.location.href = `${api.baseURL}/auth/google`;
}

async function signupWithGoogle() {
  window.location.href = `${api.baseURL}/auth/google`;
}

async function logout() {
  const success = await api.logout();
  if (success) {
    updateAuthUI();
    showPage('home');
  }
}

async function saveProfile() {
  try {
    const form = document.getElementById('profileForm');
    const formData = new FormData(form);
    
    const profileData = {
      name: formData.get('name'),
      title: formData.get('title'),
      organization: formData.get('organization'),
      phone: formData.get('phone'),
      mobile: formData.get('mobile'),
      email: formData.get('email'),
      website: formData.get('website'),
      address: formData.get('address'),
      notes: formData.get('notes'),
      socialMedia: {
        instagram: formData.get('instagram'),
        facebook: formData.get('facebook'),
        twitter: formData.get('twitter'),
        linkedin: formData.get('linkedin'),
        calendly: formData.get('calendly'),
        zoom: formData.get('zoom'),
        snapchat: formData.get('snapchat'),
        tiktok: formData.get('tiktok')
      },
      isPublic: formData.get('isPublic') === 'on'
    };

    const response = await api.saveProfile(profileData);
    
    if (response.success) {
      userProfile = response.profile;
      showSuccessMessage('Profile saved successfully!');
      updateDisplayPage();
    } else {
      throw new Error(response.message);
    }
  } catch (error) {
    console.error('Save profile error:', error);
    showErrorMessage('Failed to save profile: ' + error.message);
  }
}

async function loadProfileData() {
  try {
    const response = await api.getProfile();
    
    if (response.success && response.profile) {
      userProfile = response.profile;
      
      // Populate form with profile data
      const form = document.getElementById('profileForm');
      const inputs = form.querySelectorAll('input, textarea');
      
      inputs.forEach(input => {
        const name = input.name;
        if (name && userProfile[name] !== undefined) {
          input.value = userProfile[name];
        } else if (name && userProfile.socialMedia && userProfile.socialMedia[name] !== undefined) {
          input.value = userProfile.socialMedia[name];
        }
      });

      // Load QR code if exists
      if (userProfile.uploadedQR && userProfile.uploadedQR.url) {
        document.getElementById('qrPreview').src = api.baseURL + userProfile.uploadedQR.url;
        document.getElementById('qrPreview').classList.remove('hidden');
        document.getElementById('qrUploadText').innerHTML = 'QR Code uploaded ✅<br><small>Click to change</small>';
      }
    }
  } catch (error) {
    console.error('Load profile error:', error);
  }
}

async function updateDisplayPage() {
  if (!userProfile) return;
  
  try {
    // Update basic info
    document.getElementById('displayName').textContent = userProfile.name;
    document.getElementById('displayTitle').textContent = userProfile.title;
    document.getElementById('displayOrganization').textContent = userProfile.organization;
    document.getElementById('displayEmail').textContent = userProfile.email;
    document.getElementById('displayAddress').textContent = userProfile.address;
    
    // Update contact links
    document.getElementById('displayPhoneLink').href = `tel:${userProfile.phone}`;
    document.getElementById('displayPhoneLink').textContent = userProfile.phone;
    document.getElementById('displayMessageLink').href = `sms:${userProfile.mobile}`;
    document.getElementById('displayWebsite').href = userProfile.website;
    document.getElementById('displayWebsite').textContent = userProfile.website.replace('https://', '').replace('http://', '');

    // Update social media links
    const socialContainer = document.getElementById('socialLinksDisplay');
    socialContainer.innerHTML = '';
    
    const socialIcons = {
      instagram: '📷',
      facebook: '📘',
      twitter: '🐦',
      linkedin: '💼',
      calendly: '📅',
      zoom: '💼',
      snapchat: '👻',
      tiktok: '🎵'
    };

    Object.keys(userProfile.socialMedia || {}).forEach(platform => {
      const url = userProfile.socialMedia[platform];
      if (url) {
        const socialItem = document.createElement('div');
        socialItem.className = 'contact-detail';
        socialItem.innerHTML = `
          <span>${socialIcons[platform]}</span>
          <a href="${url}" target="_blank" class="contact-link" onclick="trackSocialClick('${platform}')">${platform.charAt(0).toUpperCase() + platform.slice(1)}</a>
        `;
        socialContainer.appendChild(socialItem);
      }
    });

    // Generate and display QR code
    if (userProfile.cardId) {
      const qrUrl = api.getQRCode(userProfile.cardId);
      document.getElementById('generatedQR').innerHTML = `
        <img src="${qrUrl}" alt="QR Code" class="qr-preview" style="border-radius: 10px;">
        <p style="font-size: 0.9rem; color: #666; margin-top: 0.5rem;">Scan to view card</p>
      `;
    }

    // Update standalone page
    updateStandalonePage();
  } catch (error) {
    console.error('Update display error:', error);
  }
}

// Track analytics
async function trackSocialClick(platform) {
  if (userProfile && userProfile.cardId) {
    await api.trackSocialClick(userProfile.cardId, platform);
  }
}

async function trackContactClick(action) {
  if (userProfile && userProfile.cardId) {
    await api.trackContactClick(userProfile.cardId, action);
  }
}

// Download functions
async function downloadVCard() {
  try {
    if (userProfile && userProfile.cardId) {
      await api.downloadVCard(userProfile.cardId);
      showSuccessMessage('vCard download started!');
    }
  } catch (error) {
    console.error('vCard download error:', error);
    showErrorMessage('Failed to download vCard');
  }
}

async function downloadQRCode() {
  try {
    if (userProfile && userProfile.cardId) {
      const qrUrl = api.getQRCode(userProfile.cardId, 400);
      const link = document.createElement('a');
      link.href = qrUrl;
      link.download = `${userProfile.name}-QRCode.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showSuccessMessage('QR Code downloaded!');
    }
  } catch (error) {
    console.error('QR download error:', error);
    showErrorMessage('Failed to download QR code');
  }
}

async function addToWallet() {
  try {
    if (userProfile && userProfile.cardId) {
      await api.downloadWalletPass(userProfile.cardId);
      showQRWalletModal(userProfile.standaloneUrl || userProfile.cardUrl);
    }
  } catch (error) {
    console.error('Wallet pass error:', error);
    showErrorMessage('Failed to generate wallet pass');
  }
}

// Handle QR upload
async function handleQRUpload(event) {
  const file = event.target.files[0];
  if (file) {
    try {
      const response = await api.uploadQRCode(file);
      
      if (response.success) {
        document.getElementById('qrPreview').src = api.baseURL + response.qrUrl;
        document.getElementById('qrPreview').classList.remove('hidden');
        document.getElementById('qrUploadText').innerHTML = 'QR Code uploaded ✅<br><small>Click to change</small>';
        showSuccessMessage('QR Code uploaded successfully!');
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      console.error('QR upload error:', error);
      showErrorMessage('Failed to upload QR code: ' + error.message);
    }
  }
}

// Load standalone card data
async function loadStandaloneCard() {
  const urlParams = new URLSearchParams(window.location.search);
  const cardId = urlParams.get('card');
  
  if (cardId) {
    try {
      const response = await api.getPublicCard(cardId);
      
      if (response.success) {
        updateStandalonePageWithData(response.card);
        return true;
      }
    } catch (error) {
      console.error('Load standalone card error:', error);
      // Show error message or redirect
      document.getElementById('standalonePage').innerHTML = `
        <div style="text-align: center; padding: 3rem;">
          <h2>Card Not Found</h2>
          <p>The requested business card could not be found or is not public.</p>
          <button onclick="window.location.href='/'" class="standalone-btn">Go Home</button>
        </div>
      `;
    }
  }
  return false;
}

function updateStandalonePageWithData(cardData) {
  document.getElementById('standaloneName').textContent = cardData.name;
  document.getElementById('standaloneTitle').textContent = cardData.title;
  document.getElementById('standaloneOrganization').textContent = cardData.organization;
  document.getElementById('standaloneEmail').textContent = cardData.email;
  document.getElementById('standaloneAddress').textContent = cardData.address;
  
  // Update contact links
  document.getElementById('standalonePhone').href = `tel:${cardData.phone}`;
  document.getElementById('standalonePhone').querySelector('span:last-child').textContent = cardData.phone;
  document.getElementById('standaloneMessage').href = `sms:${cardData.mobile}`;
  document.getElementById('standaloneWebsiteLink').href = cardData.website;
  document.getElementById('standaloneWebsite').textContent = cardData.website.replace('https://', '').replace('http://', '');

  // Update social links
  const standaloneSocialContainer = document.getElementById('standaloneSocialLinks');
  standaloneSocialContainer.innerHTML = '';
  
  const socialIcons = {
    instagram: '📷',
    facebook: '📘',
    twitter: '🐦',
    linkedin: '💼',
    calendly: '📅',
    zoom: '💼',
    snapchat: '👻',
    tiktok: '🎵'
  };

  Object.keys(cardData.socialMedia || {}).forEach(platform => {
    const url = cardData.socialMedia[platform];
    if (url) {
      const socialItem = document.createElement('a');
      socialItem.className = 'standalone-social-item';
      socialItem.href = url;
      socialItem.target = '_blank';
      socialItem.onclick = () => api.trackSocialClick(cardData.cardId, platform);
      socialItem.innerHTML = `
        <span class="social-icon">${socialIcons[platform]}</span>
        <span>${platform}</span>
      `;
      standaloneSocialContainer.appendChild(socialItem);
    }
  });

  // Store card data for download functions
  window.currentCardData = cardData;
}

// Utility functions
function showSuccessMessage(message) {
  const msg = document.createElement('div');
  msg.style.cssText = `
    position: fixed;
    bottom: 2rem;
    right: 2rem;
    background: #28a745;
    color: white;
    padding: 1rem 1.5rem;
    border-radius: 10px;
    z-index: 1001;
    font-weight: 600;
    box-shadow: 0 10px 25px rgba(40, 167, 69, 0.3);
    animation: slideInUp 0.3s ease;
  `;
  msg.textContent = message;
  document.body.appendChild(msg);
  setTimeout(() => {
    msg.style.animation = 'slideOutDown 0.3s ease forwards';
    setTimeout(() => msg.remove(), 300);
  }, 3030);
}

function showErrorMessage(message) {
  const msg = document.createElement('div');
  msg.style.cssText = `
    position: fixed;
    bottom: 2rem;
    right: 2rem;
    background: #dc3545;
    color: white;
    padding: 1rem 1.5rem;
    border-radius: 10px;
    z-index: 1001;
    font-weight: 600;
    box-shadow: 0 10px 25px rgba(220, 53, 69, 0.3);
  `;
  msg.textContent = message;
  document.body.appendChild(msg);
  setTimeout(() => msg.remove(), 4000);
}

// Check authentication on page load
async function checkStandaloneMode() {
  const urlParams = new URLSearchParams(window.location.search);
  const cardParam = urlParams.get('card');
  
  if (cardParam) {
    // Hide navbar and show standalone page
    document.querySelector('.navbar').style.display = 'none';
    document.getElementById('standalonePage').style.display = 'flex';
    document.querySelectorAll('.page:not(#standalonePage)').forEach(page => {
      page.style.display = 'none';
    });
    
    const success = await loadStandaloneCard();
    return success;
  }
  return false;
}

// Initialize application
document.addEventListener('DOMContentLoaded', async function() {
  // Check if this is a standalone card view first
  const isStandalone = await checkStandaloneMode();
  
  if (!isStandalone) {
    // Normal application mode
    const isAuthenticated = await api.checkAuthStatus();
    
    if (isAuthenticated) {
      try {
        const user = await api.getCurrentUser();
        if (user.success) {
          currentUser = user.user;
          updateAuthUI();
          
          // Load profile if exists
          if (user.user.hasProfile) {
            await loadProfileData();
          }
        }
      } catch (error) {
        console.error('User initialization error:', error);
      }
    }
    
    updateAuthUI();
    showPage('home');
    
    // Handle OAuth callback
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('auth') === 'success') {
      showSuccessMessage('Successfully logged in!');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }
});

## 6. Running the Application

### Start MongoDB:
```bash
sudo systemctl start mongodb  # Linux
brew services start mongodb   # macOS
```

### Start the server:
```bash
npm run dev  # Development with nodemon
# or
npm start    # Production
```

### Access the application:
- Main app: http://localhost:3030
- Individual cards: http://localhost:3030/card/:cardId
- API endpoints: http://localhost:3030/api/*

## 7. Production Deployment

### Environment Variables for Production:
```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/smartlifecover
BASE_URL=https://yourdomain.com
GOOGLE_CALLBACK_URL=https://yourdomain.com/auth/google/callback
```

### PM2 Process Manager:
```bash
npm install -g pm2
pm2 start server.js --name "smartlifecover"
pm2 startup
pm2 save
```

## 8. API Endpoints Summary

### Authentication:
- GET /auth/google - Start Google OAuth
- GET /auth/google/callback - OAuth callback
- POST /auth/logout - Logout user
- GET /auth/me - Get current user
- GET /auth/status - Check auth status

### Profile Management:
- GET /api/profile - Get user profile
- POST /api/profile - Create/update profile
- POST /api/profile/upload-qr - Upload QR code
- DELETE /api/profile - Delete profile
- GET /api/profile/analytics - Get profile analytics

### Public Card Access:
- GET /api/card/:cardId - Get public card
- GET /api/card/:cardId/vcard - Download vCard
- GET /api/card/:cardId/wallet-pass - Download wallet pass
- GET /api/card/:cardId/qr - Get QR code image
- POST /api/card/:cardId/track/:platform - Track social clicks
- POST /api/card/:cardId/track/contact/:action - Track contact clicks
- GET /api/card/search/:query - Search public cards

The server is now complete with Gmail authentication, MongoDB storage, unique QR codes, individual profile URLs, and full analytics tracking!

# Generate SESSION_SECRET
node -e "console.log('SESSION_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"

# Generate JWT_SECRET
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"