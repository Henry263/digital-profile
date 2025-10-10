// ## 5. Frontend Integration JavaScript
// let currentUser = null;
// frontend-integration.js


async function getRealPublicIP() {
    try {
        // Call YOUR backend instead of external service
        const response = await fetch('/api/card/get-client-ip');
        const data = await response.json();

        if (data.success) {
            return data.ip;
        }
        return null;
    } catch (error) {
        console.error('Failed to get public IP:', error);
        return null;
    }
}

// Get IP when page loads
let userPublicIP = null;

(async function () {
    userPublicIP = await getRealPublicIP();
    console.log('User public IP:', userPublicIP);
})();


let currentUser = null;
class SmartLifeCoverAPI {
    constructor(baseURL = window.location.origin) {
        this.baseURL = baseURL;
        this.token = this.getToken();
    }

    // Get stored auth token
    getToken() {
        // console.log("1");
        return localStorage.getItem('authToken') || null;
    }

    // Set auth token
    setToken(token) {
        // console.log("22: set token");
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
        // console.log("2");
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            credentials: 'include',
            ...options
        };

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
        // console.log("3");
        try {
            const response = await this.apiRequest('/auth/status');
            // console.log(" checkAuthStatus response: ", response);
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
            this.clearToken();
            return false;
        }
    }

    // Profile methods
    async getProfile() {

        try {
            return await this.apiRequest('/api/profile');
        } catch (error) {
            console.error('Get profile error:', error);
            return { success: false, error: error.message };
        }
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
    // upload suggestions
    async updatesuggestions(suggestiondata) {
        return this.apiRequest('/api/suggestions', {
            method: 'POST',
            body: JSON.stringify(suggestiondata)
        });
    }

    // upload contactinfo
    async updatecontactinfo(contactdata) {
        return this.apiRequest('/api/contact', {
            method: 'POST',
            body: JSON.stringify(contactdata)
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
        // console.log("In getPublicCard");
        return this.apiRequest(`/api/card/${cardId}`);
    }

    async downloadVCard(identifier) {
        // console.log("In downloadVCard");
        const url = `${this.baseURL}/api/card/${identifier}/vcard`;
        window.open(url, '_blank');
    }

    async downloadWalletPass(identifier) {
        // console.log("In downloadWalletPass");
        const url = `${this.baseURL}/api/card/${identifier}/wallet-pass`;
        window.open(url, '_blank');
    }

    async getQRCode(identifier, size = 400) {
        // console.log("In getQRCode: ", identifier);
        return `${this.baseURL}/api/card/${identifier}/qr?size=${size}`;
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

$("#signupWithGoogle-btn").on("click", function () {
    // console.log("signupWithGoogle Button clicked!");
    signupWithGoogle();

});

// console.log("JS file is loaded");
$("#singup-cta-button").on("click", function () {
    showPage('signup');
    // console.log("Button clicked!");
});

$("#signupBtn").on("click", function () {
    showPage('signup');
    // console.log("Button clicked!");
});

$("#faqBtn").on("click", function () {
    showPage('faq');
    // console.log("Button clicked!");
});

$("#homepage-signup").on("click", function () {
    showPage('signup');
    // console.log("Button clicked!");
});

$(".signupbutton").on("click", function () {
    showPage('signup');
    // console.log("Button clicked!");
});

$(".homebutton").on("click", function () {
    showPage('home');
    // console.log("Button clicked!");
});

$(".profilebutton").on("click", function () {
    showPage('home');
    // console.log("Button clicked!");
});

$("#loginBtn").on("click", function () {
    showPage('login');
    // console.log("Button clicked!");
});

$(".save-btn").on("click", function () {

});

$("#qr-upload-div").on("click", function () {
    document.getElementById('qrUpload').click()
    // console.log("Button clicked!");
});

// id="downloadVCard-btn" onclick="downloadVCard()"
$("#downloadVCard-btn").on("click", function () {
    downloadVCard()
    // console.log("Button clicked!");
});

// id="shareCard-btn" onclick="shareCard()"
$("#shareCard-btn").on("click", function () {
    copyStandaloneUrl()
    // console.log("Button clicked!");
});

// id="exportCard-btn" onclick="exportCard()"
$("#exportCard-btn").on("click", function () {
    exportCard()
    // console.log("Button clicked!");
});

// id="addToWallet-btn"onclick="addToWallet()"
$("#addToWallet-btn").on("click", function () {
    addToWallet()
    // console.log("Button clicked!");
});

// id="downloadQRCode-btn" onclick="downloadQRCode()"
$("#downloadQRCode-btn").on("click", function () {
    downloadQRCode()
    // console.log("Button clicked!");
});





$("#displayBtn").on("click", function () {
    showPage('display');
    // console.log("display Button clicked!");
});

$("#profileBtn").on("click", function () {
    showPage('profile');
    // console.log("profile Button clicked!");
});

$("#logoutBtn").on("click", function () {
    logout()

});

$("#googlesignin-button").on("click", function () {
    // console.log("googlesignin-button clicked!");
    loginWithGoogle()

});

async function copyStandaloneUrl() {
    const urlInput = document.getElementById('standaloneUrl');
    const url = urlInput.value;

    try {
        if (navigator.clipboard && window.isSecureContext) {
            // Use modern Clipboard API
            await navigator.clipboard.writeText(url);
        } else {
            // Fallback to old method
            urlInput.select();
            document.execCommand('copy');
        }

        // Update button feedback
        const copyBtn = document.querySelector('.copy-url-btn');
        const originalText = copyBtn.textContent;
        copyBtn.textContent = 'Copied!';
        copyBtn.style.background = '#28a745';

        setTimeout(() => {
            copyBtn.textContent = originalText;
            copyBtn.style.background = '#667eea';
        }, 2000);

        showSuccessMessage('Card URL copied to clipboard!');
    } catch (err) {
        console.error('Failed to copy URL:', err);
        showErrorMessage('Failed to copy URL. Please copy manually.');
    }
}

$(document).on("click", ".copy-url-btn", function () {
    copyStandaloneUrl();
});

// Enhanced updateAuthUI function
function updateAuthUI() {
    // console.log('🔐 Updating auth UI, currentUser:', currentUser);
    const loginBtn = document.getElementById('loginBtn');
    const signupBtn = document.getElementById('signupBtn');
    const profileBtn = document.getElementById('profileBtn');
    const displayBtn = document.getElementById('displayBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const faqBtn = document.getElementById('faqBtn');
    faqBtn?.classList.remove('hidden');
    if (currentUser) {
        // User is logged in - show authenticated UI
        // console.log('✅ User authenticated, showing authenticated UI');
        loginBtn?.classList.add('hidden');
        signupBtn?.classList.add('hidden');
        profileBtn?.classList.remove('hidden');
        displayBtn?.classList.remove('hidden');
        logoutBtn?.classList.remove('hidden');
    } else {
        // User is logged out - show login/signup UI only
        console.log('❌ User not authenticated');
        loginBtn?.classList.remove('hidden');
        signupBtn?.classList.remove('hidden');
        profileBtn?.classList.add('hidden');
        displayBtn?.classList.add('hidden');
        logoutBtn?.classList.add('hidden');
    }
}

async function logout() {
    try {
        const success = await api.logout();
        if (success) {

            showPage('home');
            // Clear the current user
            currentUser = null;
            userProfile = null;

            // Update the UI to show logged-out state
            updateAuthUI();

            // Redirect to home page
            showPage('home');

            // Show success message
            showSuccessMessage('Successfully logged out!');
        }

    } catch (error) {
        console.error('Logout error:', error);
        showErrorMessage('Error logging out. Please try again.');
    }

}


// Add loading message functions
function showLoadingMessage(message) {
    const existing = document.getElementById('loadingMessage');
    if (existing) existing.remove();

    const msg = document.createElement('div');
    msg.id = 'loadingMessage';
    msg.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(102, 126, 234, 0.95);
        color: white;
        padding: 2rem 3rem;
        border-radius: 15px;
        z-index: 2000;
        font-weight: 600;
        text-align: center;
        backdrop-filter: blur(10px);
        box-shadow: 0 20px 40px rgba(0,0,0,0.3);
    `;
    msg.innerHTML = `
        <div style="margin-bottom: 1rem;">⏳</div>
        <div>${message}</div>
    `;
    document.body.appendChild(msg);
}

function hideLoadingMessage() {
    const msg = document.getElementById('loadingMessage');
    if (msg) msg.remove();
}
// Enhanced saveProfile with better logging

async function handleProfileSave() {
    try {
        showLoadingMessage('Saving profile and generating QR codes...');

        const form = document.getElementById('profileForm');
        if (!form) {
            throw new Error('Profile form not found');
        }

        const formData = new FormData(form);

        // Get location data from the autocomplete component
        const locationData = locationAutocomplete ? locationAutocomplete.getSelectedLocation() : null;

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
            showPhoneNumber: $('#showPhoneNumber').is(':checked'),
            // Location data
            country: {
                name: locationData?.country?.name || formData.get('country') || '',
                code: formData.get('countryCode') || locationData?.country?.code || ''
            },
            state: {
                name: locationData?.state?.name || formData.get('state') || '',
                id: formData.get('stateId') || locationData?.state?.id || '',
                code: formData.get('stateCode') || locationData?.state?.code || ''
            },
            city: {
                name: locationData?.city?.name || formData.get('city') || '',
                id: formData.get('cityId') || locationData?.city?.id || ''
            },

            socialMedia: {
                instagram: formData.get('instagram'),
                facebook: formData.get('facebook'),
                twitter: formData.get('twitter'),
                linkedin: formData.get('linkedin'),
                calendly: formData.get('calendly'),
                zoom: formData.get('zoom'),
                snapchat: formData.get('snapchat'),
                tiktok: formData.get('tiktok'),
                youtube: formData.get('youtube'),
                whatsapp: formData.get('whatsapp'),
                reddit: formData.get('reddit'),
                telegram: formData.get('telegram'),
                pinterest: formData.get('pinterest'),
            },
            isPublic: $('#isPublic').is(':checked')
        };

        console.log('Profile data being sent:', profileData);

        const response = await api.saveProfile(profileData);

        if (response.success) {
            userProfile = response.profile;

            let message = 'Profile saved successfully!';
            if (response.qrGenerated) {
                message += ` Generated ${response.qrCodes?.length || 0} QR codes.`;
            }

            showSuccessMessage(message);

            updateDisplayPage();

            setTimeout(() => {
                showPage('display');
            }, 1500);

        } else {
            throw new Error(response.message || 'Save failed');
        }
    } catch (error) {
        console.error('Save profile error:', error);
        showErrorMessage('Failed to save profile: ' + error.message);
    } finally {
        hideLoadingMessage();
    }
}


async function loadProfileData() {
    try {
        const response = await api.getProfile();

        if (response.success && response.profile) {
            userProfile = response.profile;

            // Populate email (readonly field)
            document.getElementById('email').value = response.profile.email;
            if (userProfile.showPhoneNumber !== undefined) {
                document.getElementById('showPhoneNumber').checked = userProfile.showPhoneNumber;
            }
            // Populate form with profile data
            const form = document.getElementById('profileForm');
            if (form) {
                const inputs = form.querySelectorAll('input, textarea');

                inputs.forEach(input => {
                    const name = input.name;
                    // Skip location fields - they'll be handled separately
                    if (name === 'country' || name === 'state' || name === 'city') {
                        return;
                    }

                    if (name && userProfile[name] !== undefined) {
                        input.value = userProfile[name];
                    } else if (name && userProfile.socialMedia && userProfile.socialMedia[name] !== undefined) {
                        input.value = userProfile.socialMedia[name];
                    }
                });
            }

            // ===== POPULATE LOCATION FIELDS (STEP 8) =====
            // Populate country
            if (userProfile.country?.name) {
                document.getElementById('country').value = userProfile.country.name;
                document.getElementById('countryCode').value = userProfile.country.code || '';

                // Trigger the autocomplete to load states
                if (locationAutocomplete) {
                    const country = locationAutocomplete.countries.find(c => c.code === userProfile.country.code);
                    if (country) {
                        locationAutocomplete.selectCountry(country);
                    }
                }
            }

            // Populate state (after country loads)
            if (userProfile.state?.name) {
                setTimeout(() => {
                    document.getElementById('state').value = userProfile.state.name;
                    document.getElementById('stateId').value = userProfile.state.id || '';
                    document.getElementById('stateCode').value = userProfile.state.code || '';

                    // Trigger cities load
                    if (locationAutocomplete && locationAutocomplete.selectedCountry) {
                        const state = locationAutocomplete.currentStates.find(s => s.id === userProfile.state.id);
                        if (state) {
                            locationAutocomplete.selectState(state);
                        }
                    }
                }, 500);
            }

            // Populate city (after state loads)
            if (userProfile.city?.name) {
                setTimeout(() => {
                    document.getElementById('city').value = userProfile.city.name;
                    document.getElementById('cityId').value = userProfile.city.id || '';
                }, 1000);
            }
            // ===== END LOCATION FIELDS =====

            // Load QR code if exists
            if (userProfile.uploadedQR && userProfile.uploadedQR.url) {
                const qrPreview = document.getElementById('qrPreview');
                const qrUploadText = document.getElementById('qrUploadText');

                if (qrPreview && qrUploadText) {
                    qrPreview.src = api.baseURL + userProfile.uploadedQR.url;
                    qrPreview.classList.remove('hidden');
                    qrUploadText.innerHTML = 'QR Code uploaded ✅<br><small>Click to change</small>';
                }
            }

            // Update profile photo/avatar
            updateProfileDisplay(userProfile);

            // Update navbar avatar
            updateNavbarAvatar(userProfile);

        } else if (response.success && !response.profile) {
            userProfile = null;
            const userdata = await api.getCurrentUser();

            if (userdata.success == true) {
                document.getElementById('email').value = userdata.user.email;
            }
        } else {
            showPage('login');
        }
    } catch (error) {
        console.error('Load profile error:', error);

        if (error.message.includes('retrieving profile')) {
            showErrorMessage('Unable to load your profile. Please try refreshing the page.');
        } else {
            showErrorMessage('Profile loading error: ' + error.message);
        }
    }
}

function fallbackCopy(urlInput, copyBtn, originalText) {
    try {
        urlInput.select();
        urlInput.setSelectionRange(0, 99999);
        document.execCommand('copy');
        showCopySuccess(copyBtn, originalText);
    } catch (err) {
        showErrorMessage('Failed to copy URL. Please copy manually.');
    }
}

function showCopySuccess(copyBtn, originalText) {
    copyBtn.textContent = '✅ Copied!';
    copyBtn.style.background = '#28a745';

    setTimeout(() => {
        copyBtn.textContent = originalText;
        copyBtn.style.background = '#667eea';
    }, 2000);

    showSuccessMessage('Card URL copied to clipboard!');
}



// Generate QR code for standalone URL
// function generateQRCode() {
//     const standaloneUrl = window.location.origin + window.location.pathname + '?card=' + encodeURIComponent(userProfile.name.replace(/\s+/g, '-').toLowerCase());

//     // Simple QR code generation using QR Server API
//     const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(standaloneUrl)}`;

//     document.getElementById('generatedQR').innerHTML = `
//         <img src="${qrCodeUrl}" alt="QR Code" class="qr-preview" style="border-radius: 10px;">
//         <p style="font-size: 0.9rem; color: #666; margin-top: 0.5rem;">Scan to view card</p>
//     `;
// }

// Update standalone page
function updateStandalonePage() {
    document.getElementById('standaloneName').textContent = userProfile.name;
    document.getElementById('standaloneTitle').textContent = userProfile.title;
    document.getElementById('standaloneOrganization').textContent = userProfile.organization;
    document.getElementById('standaloneEmail').textContent = userProfile.email;
    document.getElementById('standaloneAddress').textContent = userProfile.address;

    // Update contact links
    document.getElementById('standalonePhone').href = `tel:${userProfile.phone}`;
    document.getElementById('standalonePhone').querySelector('span:last-child').textContent = userProfile.phone;
    document.getElementById('standaloneMessage').href = `sms:${userProfile.mobile}`;
    document.getElementById('standaloneWebsiteLink').href = userProfile.website;
    document.getElementById('standaloneWebsite').textContent = userProfile.website.replace('https://', '').replace('http://', '');

    // Update social links
    const standaloneSocialContainer = document.getElementById('standaloneSocialLinks');
    standaloneSocialContainer.innerHTML = '';

    const socialIcons = {
        instagram: '📷',
        facebook: '📘',
        twitter: '🐦',
        calendly: '📅',
        zoom: '💼',
        snapchat: '👻',
        tiktok: '🎵',
        linkedin: '💼'
    };

    Object.keys(userProfile.socialMedia).forEach(platform => {
        const url = userProfile.socialMedia[platform];
        if (url) {
            const socialItem = document.createElement('a');
            socialItem.className = 'standalone-social-item';
            socialItem.href = url;
            socialItem.target = '_blank';
            socialItem.innerHTML = `
                <span class="social-icon">${socialIcons[platform]}</span>
                <span>${platform}</span>
            `;
            standaloneSocialContainer.appendChild(socialItem);
        }
    });
}

// Track analytics

async function updateDisplayPage() {
    if (!userProfile) return;

    try {

        // // Update social media links - FIXED VERSION
        const socialContainer = document.getElementById('socialLinksDisplay');
        socialContainer.innerHTML = '';

        // Update basic info
        document.getElementById('displayName').textContent = userProfile.name;
        document.getElementById('displayTitle').textContent = userProfile.title;
        document.getElementById('displayOrganization').textContent = userProfile.organization;
        document.getElementById('displayEmail').textContent = userProfile.email;
        document.getElementById('displayAddress').textContent = userProfile.address;

        // Short version - checks for truthy value
        if (userProfile.mobile) {
            $('#displayPhoneLink').attr('href', `tel:${userProfile.mobile}`).show();
            $('#displayMessageLink').attr('href', `sms:${userProfile.mobile}`).show();
            document.getElementById('displayPhoneLink').querySelector('.method-value').textContent = userProfile.mobile;
            document.getElementById('displayMessageLink').querySelector('.method-value').textContent = userProfile.mobile;
        } else {
            $('#displayPhoneLink').hide();
            $('#displayMessageLink').hide();
        }

        // Update contact links - Fix: target the correct elements
        // document.getElementById('displayPhoneLink').href = `tel:${userProfile.phone}`;
        // document.getElementById('displayPhoneLink').querySelector('.method-value').textContent = userProfile.phone;

        // document.getElementById('displayMessageLink').href = `sms:${userProfile.mobile}`;
        // document.getElementById('displayMessageLink').querySelector('.method-value').textContent = userProfile.mobile;

        document.getElementById('displayEmailLink').href = `mailto:${userProfile.email}`;
        document.getElementById('displayEmail').textContent = userProfile.email;

        document.getElementById('displayWebsite').href = userProfile.website;
        document.getElementById('displayWebsite').querySelector('.method-value').textContent = userProfile.website.replace('https://', '').replace('http://', '');



        // Define only the valid social media fields to avoid MongoDB metadata
        const validSocialFields = [
            'instagram', 'facebook', 'twitter', 'linkedin',
            'calendly', 'zoom', 'snapchat', 'tiktok',
            'youtube', 'whatsapp', 'telegram', 'reddit', 'pinterest'
        ];

        const socialIcons = {
            instagram: '<i class="fab fa-instagram"></i>',
            facebook: '<i class="fab fa-facebook"></i>',
            twitter: '<i class="fab fa-twitter"></i>',
            linkedin: '<i class="fab fa-linkedin"></i>',
            calendly: '<i class="fas fa-calendar-alt"></i>',
            snapchat: '<i class="fab fa-snapchat"></i>',
            tiktok: '<i class="fab fa-tiktok"></i>',
            youtube: '<i class="fab fa-youtube"></i>',
            whatsapp: '<i class="fab fa-whatsapp"></i>',
            zoom: '<i class="fas fa-headphones"></i>',
            reddit: '<i class="fa-brands fa-reddit"></i>',
            telegram: '<i class="fa-brands fa-telegram"></i>',
            pinterest: '<i class="fa-brands fa-pinterest"></i>'
        };

        // // Only process valid social media fields



        // Only process valid social media fields
        validSocialFields.forEach(platform => {
            let url = userProfile.socialMedia && userProfile.socialMedia[platform];
            if (url && typeof url === 'string' && url.trim() && url.trim() !== '') {
                const socialItem = document.createElement('div');
                socialItem.className = 'contact-detail';
                if (!url.startsWith('http://') && !url.startsWith('https://')) {
                    url = 'https://' + url;
                    // console.log(`Added protocol: ${url}`);
                }

                socialItem.innerHTML = `
            <span>${socialIcons[platform] || '<i class="fas fa-link"></i>'}</span>
            <a href="${url}" target="_blank" class="contact-link" onclick="trackSocialClick('${platform}')">${platform.charAt(0).toUpperCase() + platform.slice(1)}</a>
        `;
                socialContainer.appendChild(socialItem);
            }
        });

        // Generate and display QR code with standalone URL
        if (userProfile.cardId) {
            // console.log("userProfile.cardId: ", userProfile.cardId);
            // console.log("userProfile.slug: ", userProfile.slug);
            // Use slug for user-friendly URL, but QR API call can use cardId
            const friendlyIdentifier = userProfile.slug || userProfile.cardId;
            const standaloneUrl = `${window.location.origin}/card/${friendlyIdentifier}`;
            const qrUrl = await api.getQRCode(friendlyIdentifier);

            document.getElementById('generatedQR').innerHTML = `
                <img src="${qrUrl}" alt="QR Code" class="qr-preview" style="border-radius: 10px;">
                <p style="font-size: 0.9rem; color: #666; margin-top: 0.5rem;">Scan to view card</p>
                
                <!-- Standalone URL section -->
                <div class="standalone-url-section" style="margin-top: 1rem; padding: 1rem; background: #f8f9fa; border-radius: 8px;">
                    <h4 style="font-size: 0.9rem; color: #333; margin-bottom: 0.5rem;">📎 Share Your Card</h4>
                    <div class="url-container" style="display: flex; align-items: center; gap: 0.5rem;">
                        <input type="text" id="standaloneUrl" value="${standaloneUrl}" 
                               readonly style="flex: 1; padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px; font-size: 0.8rem; background: white; color: #333;">
                        <button class="copy-url-btn" 
                                style="padding: 0.5rem 1rem; background: #667eea; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.8rem; white-space: nowrap;">
                            📋 Copy
                        </button>
                    </div>
                    <p style="font-size: 0.75rem; color: #666; margin-top: 0.5rem; margin-bottom: 0;">
                        ${userProfile.slug ? `Your personalized URL: /card/${userProfile.slug}` : 'Share this link or QR code with others'}
                    </p>
                </div>
            `;
        }

        // Update standalone page
        updateStandalonePage();
    } catch (error) {
        console.error('Update display error:', error);
    }
}
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
            // const qrUrl = api.getQRCode(userProfile.cardId, 400);
            // console.log("userProfile.cardId: ", userProfile.cardId);
            // console.log("userProfile.slug: ", userProfile.slug);
            // Use slug for user-friendly URL, but QR API call can use cardId
            const friendlyIdentifier = userProfile.slug || userProfile.cardId;
            // const standaloneUrl = `${window.location.origin}/api/card/${friendlyIdentifier}`;
            // const qrUrl = await api.getQRCode(friendlyIdentifier);


            const qrUrl = await api.getQRCode(friendlyIdentifier);

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


/**
 * All the code to download the apple pass on the phone.
 * @param {*} event 
 */

// Device detection functions

function isAndroid() {
    return /Android/i.test(navigator.userAgent);
}

function isIOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

function isIPad() {
    return /iPad/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

function isIPhone() {
    return /iPhone/.test(navigator.userAgent);
}

function isDesktop() {
    return !isIOS() && !isIPad() && !isAndroid() && !/webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Main Add to Wallet functionality with device detection
function addToWallet() {
    // Get user profile data
    const userData = {
        name: document.getElementById('displayName').textContent || 'John Doe',
        phone: document.getElementById('displayPhoneLink').querySelector('.method-value').textContent || '',
        email: document.getElementById('displayEmail').textContent || '',
        website: document.getElementById('displayWebsite').querySelector('.method-value').textContent || '',
        qrCodeData: window.location.href
    };

    // Check device type and handle accordingly
    if (isIPhone() || isIPad()) {
        // iOS device - try to save to wallet
        generateAndSaveToWallet(userData);
    } else if (isAndroid()) {
        // Android device - Google Wallet
        generateGoogleWalletPass(userData);
    } else if (isDesktop()) {
        // Desktop - download JSON and show HTML preview
        downloadJSONAndShowPreview(userData);
    } else {
        // Android or other mobile - show HTML preview
        createSimpleWalletPass(userData);
    }
}

// Get personalized URL from the page
function getPersonalizedUrl() {
    const qrContainer = document.getElementById('generatedQR');
    if (qrContainer) {
        const urlInput = qrContainer.querySelector('#standaloneUrl');
        if (urlInput) {
            return urlInput.value;
        }
    }
    return window.location.href;
}


// Function for iOS devices - generate wallet pass
function generateAndSaveToWallet(userData) {
    const passData = createPassData(userData);

    // For iOS, we need to either:
    // 1. Send to server to generate .pkpass file and return download link
    // 2. Use a wallet pass service API

    // Option 1: Server-based approach (recommended)
    generatePassViaServer(passData, userData, 'apple');
    // if (window.location.protocol === 'https:') {
    //     generatePassViaServer(passData, userData, 'apple');
    // } else {
    //     // Fallback for development/http
    //     showIOSInstructions(userData);
    // }
}

// Google Wallet pass generation
function generateGoogleWalletPass(userData) {
    const googlePassData = createGoogleWalletData(userData);

    if (window.location.protocol === 'https:') {
        generatePassViaServer(googlePassData, userData, 'google');
    } else {
        // Fallback: Create Google Wallet URL
        createGoogleWalletUrl(userData);
    }
}

// Create Google Wallet pass data structure
function createGoogleWalletData(userData) {
    return {
        iss: 'your-service-account-email@your-project.iam.gserviceaccount.com',
        aud: 'google',
        typ: 'savetowallet',
        iat: Math.floor(Date.now() / 1000),

        payload: {
            genericObjects: [{
                id: `${generateSerialNumber()}`,
                classId: 'your-issuer-id.digital_business_card_class',

                genericType: 'GENERIC_TYPE_UNSPECIFIED',
                hexBackgroundColor: '#667eea',

                logo: {
                    sourceUri: {
                        uri: 'https://your-domain.com/logo.png'
                    },
                    contentDescription: {
                        defaultValue: {
                            language: 'en-US',
                            value: 'QRprofile Logo'
                        }
                    }
                },

                cardTitle: {
                    defaultValue: {
                        language: 'en-US',
                        value: 'Digital Business Card'
                    }
                },

                subheader: {
                    defaultValue: {
                        language: 'en-US',
                        value: userData.name
                    }
                },

                header: {
                    defaultValue: {
                        language: 'en-US',
                        value: userData.email
                    }
                },

                textModulesData: [
                    {
                        id: 'phone',
                        header: 'Phone',
                        body: userData.phone
                    },
                    {
                        id: 'website',
                        header: 'Website',
                        body: userData.website
                    }
                ],

                linksModuleData: {
                    uris: [
                        {
                            uri: userData.qrCodeData,
                            description: 'View Profile',
                            id: 'profile_link'
                        }
                    ]
                },

                barcode: {
                    type: 'QR_CODE',
                    value: userData.qrCodeData,
                    alternateText: 'Scan to view profile'
                }
            }]
        }
    };
}

// Create Google Wallet URL (fallback method)
function createGoogleWalletUrl(userData) {
    // Simple approach: create a vCard and encode it
    const vCard = createVCard(userData);
    const encodedVCard = encodeURIComponent(vCard);

    // Google Wallet doesn't support direct vCard import like Apple Wallet,
    // but we can create a generic pass with the data
    const googleWalletData = {
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
        website: userData.website,
        qr: userData.qrCodeData
    };

    // For demo purposes, show instructions to manually add
    showGoogleWalletInstructions(userData);
}

// Create vCard format
function createVCard(userData) {
    return `BEGIN:VCARD
VERSION:3.0
FN:${userData.name}
TEL:${userData.phone}
EMAIL:${userData.email}
URL:${userData.website}
NOTE:${userData.qrCodeData}
END:VCARD`;
}


// Apple Wallet pass data (existing function)
function createApplePassData(userData) {
    return {
        formatVersion: 1,
        passTypeIdentifier: "pass.com.qrprofiler.digitalcard",
        serialNumber: generateSerialNumber(),
        organizationName: "Digital QR Profiler",
        description: "Digital Business Card",

        logoText: "QRprofile",
        foregroundColor: "rgb(255, 255, 255)",
        backgroundColor: "rgb(102, 126, 234)",
        labelColor: "rgb(255, 255, 255)",

        generic: {
            primaryFields: [
                {
                    key: "name",
                    label: "Name",
                    value: userData.name
                }
            ],
            secondaryFields: [
                {
                    key: "phone",
                    label: "Phone",
                    value: userData.phone
                },
                {
                    key: "email",
                    label: "Email",
                    value: userData.email
                }
            ],
            auxiliaryFields: userData.website ? [
                {
                    key: "website",
                    label: "Website",
                    value: userData.website
                }
            ] : [],
            backFields: [
                {
                    key: "qr_info",
                    label: "QR Code",
                    value: "Scan to view full profile"
                },
                {
                    key: "profile_link",
                    label: "Profile Link",
                    value: userData.qrCodeData
                }
            ]
        },

        barcode: {
            message: userData.qrCodeData,
            format: "PKBarcodeFormatQR",
            messageEncoding: "iso-8859-1"
        }
    };
}

// Desktop function - download both formats
function downloadBothFormatsAndShowPreview(userData) {
    // Download Apple Wallet JSON
    const applePassData = createApplePassData(userData);
    downloadPassJSON(applePassData, userData, 'apple');

    // Download Google Wallet JSON
    const googlePassData = createGoogleWalletData(userData);
    downloadPassJSON(googlePassData, userData, 'google');

    // Show HTML preview
    setTimeout(() => {
        createSimpleWalletPass(userData);
    }, 500);

    showDesktopInstructions();
}

// Function for desktop - download JSON and show preview
function downloadJSONAndShowPreview(userData) {
    const passData = createPassData(userData);

    // Download JSON file
    downloadPassJSON(passData, userData);

    // Show HTML preview in new window
    setTimeout(() => {
        createSimpleWalletPass(userData);
    }, 500);

    // Show desktop instructions
    showDesktopInstructions();
}

// Create pass data structure
function createPassData(userData) {
    return {
        formatVersion: 1,
        passTypeIdentifier: "pass.com.qrprofiler.digitalcard",
        serialNumber: generateSerialNumber(),
        teamIdentifier: "YOUR_TEAM_ID",
        webServiceURL: "",
        authenticationToken: generateAuthToken(),

        organizationName: "Digital QR Profiler",
        description: "Digital Business Card",

        logoText: "QRprofile",
        foregroundColor: "rgb(255, 255, 255)",
        backgroundColor: "rgb(102, 126, 234)",
        labelColor: "rgb(255, 255, 255)",

        generic: {
            primaryFields: [
                {
                    key: "name",
                    label: "Name",
                    value: userData.name
                }
            ],
            secondaryFields: [
                {
                    key: "phone",
                    label: "Phone",
                    value: userData.phone
                },
                {
                    key: "email",
                    label: "Email",
                    value: userData.email
                }
            ],
            auxiliaryFields: userData.website ? [
                {
                    key: "website",
                    label: "Website",
                    value: userData.website
                }
            ] : [],
            backFields: [
                {
                    key: "qr_info",
                    label: "QR Code",
                    value: "Scan to view full profile"
                },
                {
                    key: "profile_link",
                    label: "Profile Link",
                    value: userData.qrCodeData
                }
            ]
        },

        barcode: {
            message: userData.qrCodeData,
            format: "PKBarcodeFormatQR",
            messageEncoding: "iso-8859-1"
        },

        barcodes: [
            {
                message: userData.qrCodeData,
                format: "PKBarcodeFormatQR",
                messageEncoding: "iso-8859-1"
            }
        ]
    };
}

// Enhanced download function
function downloadPassJSON(passData, userData, type) {
    const passJson = JSON.stringify(passData, null, 2);
    const blob = new Blob([passJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = `${userData.name.replace(/\s+/g, '_')}_${type}_wallet_pass.json`;
    downloadLink.style.display = 'none';

    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);

    URL.revokeObjectURL(url);
}

// Currently apple pass generation function is not working.
// Server-based pass generation (enhanced)
async function generatePassViaServer(passData, userData, walletType) {
    showLoadingIndicator();
    // return `${this.baseURL}/api/card/${identifier}/qr?s
    const applepassurl = `/api/card/${userProfile.slug}/apple-wallet-pass`;
    //    let applepassData  =     await api.downloadWalletPass(userProfile.slug);
    //    console.log("apple pass data: ", applepassData);
    const endpoint = walletType === 'apple' ? applepassurl : '/api/generate-google-pass';

    try {
        // For Apple Wallet, we just need a GET request (no body needed)
        const response = await fetch(endpoint, {
            method: 'GET',
            headers: {
                'Accept': 'application/vnd.apple.pkpass, application/octet-stream',
            }
        });

        hideLoadingIndicator();

        if (!response.ok) {
            throw new Error(`Failed to generate ${walletType} wallet pass: ${response.statusText}`);
        }

        // const blob = await response.blob();
        // const url = URL.createObjectURL(blob);
        const url = window.location.origin + endpoint;
        console.log("url for google wallet", endpoint);
        if (walletType === 'apple' && isIOS()) {
            return;
        } else if (walletType === 'google' && isAndroid()) {
            // For Android, try to open with Google Wallet
            const googleWalletUrl = `https://pay.google.com/gp/v/save/${url}`;
            window.location.href = googleWalletUrl;
        } else {
            // Fallback download
            const downloadLink = document.createElement('a');
            downloadLink.href = url;
            downloadLink.download = `${userData.name.replace(/\s+/g, '_')}.${walletType === 'apple' ? 'pkpass' : 'gwpass'}`;
            downloadLink.style.display = 'none';
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
        }

        // Clean up the blob URL after a short delay
        // setTimeout(() => URL.revokeObjectURL(url), 1000);

    } catch (error) {
        hideLoadingIndicator();
        console.error(`Error generating ${walletType} wallet pass:`, error);

        if (walletType === 'apple') {
            showIOSInstructions(userData);
        } else {
            showGoogleWalletInstructions(userData);
        }
    }
    // fetch(endpoint, {
    //     method: 'GET',
    //     headers: {
    //         'Content-Type': 'application/json',
    //     },
    //     body: JSON.stringify({
    //         passData: passData,
    //         userData: userData
    //     })
    // })
    //     .then(response => {
    //         hideLoadingIndicator();
    //         if (response.ok) {
    //             return response.blob();
    //         }
    //         throw new Error(`Failed to generate ${walletType} wallet pass`);
    //     })
    //     .then(blob => {
    //         const url = URL.createObjectURL(blob);

    //         if (walletType === 'apple' && isIOS()) {
    //             // For iOS, try to open the pass directly
    //             window.location.href = url;
    //         } else if (walletType === 'google' && isAndroid()) {
    //             // For Android, try to open with Google Wallet
    //             const googleWalletUrl = `https://pay.google.com/gp/v/save/${url}`;
    //             window.location.href = googleWalletUrl;
    //         } else {
    //             // Fallback download
    //             const downloadLink = document.createElement('a');
    //             downloadLink.href = url;
    //             downloadLink.download = `${userData.name.replace(/\s+/g, '_')}.${walletType === 'apple' ? 'pkpass' : 'gwpass'}`;
    //             downloadLink.click();
    //         }

    //         setTimeout(() => URL.revokeObjectURL(url), 1000);
    //     })
    //     .catch(error => {
    //         hideLoadingIndicator();
    //         console.error(`Error generating ${walletType} wallet pass:`, error);

    //         if (walletType === 'apple') {
    //             showIOSInstructions(userData);
    //         } else {
    //             showGoogleWalletInstructions(userData);
    //         }
    //     });
}


// HTML preview for all devices
function createSimpleWalletPass(userData) {
    // Get the existing QR code and URL from the page
    const qrContainer = document.getElementById('generatedQR');
    let qrCodeHTML = '';
    let personalizedUrl = '';

    if (qrContainer) {
        // Get QR code image
        const qrImage = qrContainer.querySelector('img');
        if (qrImage) {
            qrCodeHTML = `<img src="${qrImage.src}" style="width: 60px; height: 60px; border-radius: 8px;">`;
        } else {
            qrCodeHTML = '<div style="width: 50px; height: 50px; background: white; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #333; font-size: 12px;">QR</div>';
        }

        // Get personalized URL
        const urlInput = qrContainer.querySelector('#standaloneUrl');
        if (urlInput) {
            personalizedUrl = urlInput.value;
        } else {
            personalizedUrl = userData.qrCodeData; // fallback to original
        }
    } else {
        // Fallbacks if container not found
        qrCodeHTML = '<div style="width: 50px; height: 50px; background: white; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #333; font-size: 12px;">QR</div>';
        personalizedUrl = userData.qrCodeData;
    }

    const passHTML = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
        <title>Digital Business Card - ${userData.name}</title>
        <style>
            body {
                margin: 0;
                padding: 20px;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background: #f0f0f0;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
            }
            .wallet-pass {
                width: 340px;
                max-width: 90vw;
                height: 220px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border-radius: 15px;
                color: white;
                padding: 20px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                position: relative;
                overflow: hidden;
                margin-bottom: 20px;
            }
            .pass-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 15px;
            }
            img.logo-image-only {
                height: 20px;
                width: auto;
                background: white;
                padding: 4px;
                border-radius: 4px;
            }
            .logo {
                font-weight: bold;
                font-size: 16px;
            }
            .qr-code {
                width: 70px;
                height: 70px;
                background: white;
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                overflow: hidden;
            }
            .pass-content h1 {
                font-size: 20px;
                margin: 0 0 10px 0;
                font-weight: 500;
            }
            .pass-content p {
                margin: 3px 0;
                font-size: 14px;
                opacity: 0.9;
            }
            .barcode-area {
                position: absolute;
                bottom: 15px;
                right: 20px;
                font-size: 12px;
                opacity: 0.7;
            }
            .instructions {
                background: white;
                padding: 20px;
                border-radius: 15px;
                max-width: 90vw;
                width: 400px;
                text-align: center;
                box-shadow: 0 5px 15px rgba(0,0,0,0.1);
            }
            .device-info {
                background: #667eea;
                color: white;
                padding: 10px 15px;
                border-radius: 20px;
                font-size: 14px;
                margin-bottom: 15px;
                display: inline-block;
            }
            .url-section {
                background: #f8f9fa;
                padding: 15px;
                border-radius: 10px;
                margin-top: 15px;
                text-align: left;
            }
            .url-section h4 {
                margin: 0 0 10px 0;
                font-size: 14px;
                color: #333;
            }
            .url-display {
                background: white;
                padding: 10px;
                border-radius: 6px;
                border: 1px solid #ddd;
                word-break: break-all;
                font-size: 12px;
                color: #666;
                font-family: monospace;
            }
            .clickable {
                cursor: pointer;
                transition: background-color 0.2s;
            }
            .clickable:hover {
                background-color: #e9ecef;
            }
        </style>
    </head>
    <body>
        <div class="wallet-pass">
            <div class="pass-header">
                <img src="./image/app-logo.png" alt="QRprofile Logo" class="logo-image-only">
                <div class="qr-code">
                    ${qrCodeHTML}
                </div>
            </div>
            <div class="pass-content">
                <h1>${userData.name}</h1>
                <p>${userData.phone}</p>
                <p>${userData.email}</p>
                ${userData.website ? `<p>${userData.website}</p>` : ''}
            </div>
            <div class="barcode-area">
                Scan to connect
            </div>
        </div>
        
        <div class="instructions">
            <div class="device-info">
                Device: ${navigator.userAgent.includes('iPhone') ? 'iPhone' :
            navigator.userAgent.includes('iPad') ? 'iPad' : 'Desktop'}
            </div>
            <h3>Digital Business Card Preview</h3>
            <p>This is how your card will appear in Apple Wallet. ${
        isDesktop() ? 'The JSON file has been downloaded to your computer.' :
            'Tap the QR code to share your profile.'
        }</p>
            
            <div class="url-section">
                <h4>📎 Share Your Card</h4>
                <div class="url-display clickable" onclick="copyToClipboard('${personalizedUrl}')">
                    ${personalizedUrl}
                </div>
                <p style="font-size: 12px; color: #666; margin: 8px 0 0 0;">
                    Click to copy link
                </p>
            </div>
        </div>
        
        <script>
            function copyToClipboard(text) {
                if (navigator.clipboard) {
                    navigator.clipboard.writeText(text).then(function() {
                        showCopyFeedback();
                    }).catch(function(err) {
                        console.error('Could not copy text: ', err);
                        fallbackCopyTextToClipboard(text);
                    });
                } else {
                    fallbackCopyTextToClipboard(text);
                }
            }
            
            function fallbackCopyTextToClipboard(text) {
                var textArea = document.createElement("textarea");
                textArea.value = text;
                textArea.style.position = "fixed";
                textArea.style.top = "-999px";
                textArea.style.left = "-999px";
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                
                try {
                    var successful = document.execCommand('copy');
                    if (successful) {
                        showCopyFeedback();
                    }
                } catch (err) {
                    console.error('Fallback: Could not copy text: ', err);
                }
                
                document.body.removeChild(textArea);
            }
            
            function showCopyFeedback() {
                var urlDisplay = document.querySelector('.url-display');
                var originalText = urlDisplay.innerHTML;
                urlDisplay.innerHTML = '✅ Copied to clipboard!';
                urlDisplay.style.backgroundColor = '#d4edda';
                urlDisplay.style.color = '#155724';
                
                setTimeout(function() {
                    urlDisplay.innerHTML = originalText;
                    urlDisplay.style.backgroundColor = '';
                    urlDisplay.style.color = '';
                }, 2000);
            }
        </script>
    </body>
    </html>`;

    const newTab = window.open();
    newTab.document.write(passHTML);
    newTab.document.close();
}

// Loading indicator functions
function showLoadingIndicator() {
    const loader = document.createElement('div');
    loader.id = 'wallet-loader';
    loader.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        color: white;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;
    loader.innerHTML = `
        <div style="text-align: center;">
            <div style="width: 40px; height: 40px; border: 3px solid #667eea; border-top: 3px solid transparent; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 20px;"></div>
            <p>Generating wallet pass...</p>
        </div>
        <style>
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        </style>
    `;
    document.body.appendChild(loader);
}

function hideLoadingIndicator() {
    const loader = document.getElementById('wallet-loader');
    if (loader) {
        loader.remove();
    }
}

// Instruction modals
function showIOSInstructions(userData) {
    showModal(`
        <h2>Add to Apple Wallet</h2>
        <p>To add this business card to your Apple Wallet:</p>
        <ol style="text-align: left; margin: 20px 0;">
            <li>A wallet pass file will be generated</li>
            <li>Tap "Add" when prompted</li>
            <li>The card will appear in your Wallet app</li>
        </ol>
        <p style="font-size: 14px; color: #666;">
            Note: This requires a configured wallet pass service
        </p>
    `);
}

function showDesktopInstructions() {
    showModal(`
        <h2>Wallet Pass Generated</h2>
        <p>A JSON file has been downloaded and a preview opened in a new window.</p>
        <div style="background: #f8f9ff; padding: 15px; border-radius: 10px; margin: 15px 0;">
            <h4 style="margin: 0 0 10px 0; color: #667eea;">To create Apple Wallet pass:</h4>
            <ol style="text-align: left; font-size: 14px;">
                <li>Upload the JSON file to a wallet pass service</li>
                <li>Download the generated .pkpass file</li>
                <li>Transfer to iPhone and open</li>
                <li>Add to Apple Wallet</li>
            </ol>
        </div>
    `);
}


// Google Wallet instructions
function showGoogleWalletInstructions(userData) {
    showModal(`
        <h2>Add to Google Wallet</h2>
        <p>To add this business card to your Google Wallet:</p>
        <ol style="text-align: left; margin: 20px 0;">
            <li>A Google Wallet pass will be generated</li>
            <li>Tap "Add to Google Wallet" when prompted</li>
            <li>The card will appear in your Google Wallet app</li>
        </ol>
        <p style="font-size: 14px; color: #666;">
            Note: This requires Google Wallet pass configuration
        </p>
    `);
}

// Enhanced desktop instructions
function showDesktopInstructions() {
    showModal(`
        <h2>Wallet Passes Generated</h2>
        <p>JSON files for both Apple Wallet and Google Wallet have been downloaded.</p>
        <div style="background: #f8f9ff; padding: 15px; border-radius: 10px; margin: 15px 0;">
            <h4 style="margin: 0 0 10px 0; color: #667eea;">Apple Wallet (iOS):</h4>
            <ol style="text-align: left; font-size: 14px; margin-bottom: 15px;">
                <li>Process the Apple JSON file through a .pkpass generator</li>
                <li>Transfer to iPhone and open the .pkpass file</li>
                <li>Add to Apple Wallet</li>
            </ol>
            
            <h4 style="margin: 0 0 10px 0; color: #667eea;">Google Wallet (Android):</h4>
            <ol style="text-align: left; font-size: 14px;">
                <li>Process the Google JSON file through Google Wallet API</li>
                <li>Generate a Google Wallet save link</li>
                <li>Open link on Android device</li>
                <li>Add to Google Wallet</li>
            </ol>
        </div>
    `);
}

function showModal(content) {
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background: white;
        padding: 30px;
        border-radius: 20px;
        max-width: 90%;
        max-width: 500px;
        text-align: center;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
    `;

    modalContent.innerHTML = content + `
        <button id="closeModalBtn" 
                style="background: #667eea; color: white; border: none; padding: 10px 20px; 
                       border-radius: 10px; cursor: pointer; font-size: 16px; margin-top: 20px;">
            Got it!
        </button>
    `;

    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    // Add event listener instead of inline onclick
    document.getElementById('closeModalBtn').addEventListener('click', function () {
        modal.remove();
    });
}

// Helper functions
function generateSerialNumber() {
    return 'QRP-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

function generateAuthToken() {
    return 'auth-' + Math.random().toString(36).substr(2, 15);
}

// Event listener setup
// document.addEventListener('DOMContentLoaded', function () {
//     const addToWalletBtn = document.getElementById('addToWallet-btn');
//     if (addToWalletBtn) {
//         addToWalletBtn.addEventListener('click', function (e) {
//             e.preventDefault();
//             addToWallet();
//         });
//     }
// });

// async function addToWallet() {
//     try {
//         if (userProfile && userProfile.slug) {
//             await api.downloadWalletPass(userProfile.slug);
//             // await showQRWalletModal(userProfile.standaloneUrl || userProfile.cardUrl);
//             addToWallet();
//         }
//     } catch (error) {
//         console.error('Wallet pass error:', error);
//         showErrorMessage('Failed to generate wallet pass');
//     }
// }

/**
 * 
 * @End
 */


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
    // console.log("loadStandaloneCard");

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
    }, 300);
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


// Page navigation
async function showPage(pageId) {
    // Don't allow navigation if in standalone mode


    const isStandalone = await checkStandaloneMode();
    if (isStandalone) {
        return;
    }

    // Restrict access to authenticated pages
    if (!currentUser && (pageId === 'profile' || pageId === 'display')) {
        // console.log('🔒 Access denied - user not authenticated');
        showPage('home');
        showErrorMessage('Please log in to access this page');
        return;
    }

    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
        page.style.display = 'none';
    });

    const targetPage = document.getElementById(pageId + 'Page');
    // targetPage.classList.add('active');
    // targetPage.style.display = 'block';

    // if (pageId === 'profile') {
    //     loadProfileData();
    // } else if (pageId === 'display') {
    //     updateDisplayPage();
    // }

    if (targetPage) {
        targetPage.classList.add('active');
        targetPage.style.display = 'block';

        if (pageId === 'profile') {
            loadProfileData();
        } else if (pageId === 'display') {
            updateDisplayPage();
        }
    }
}


// Helper function to set email field as read-only
function setUserEmail(email) {
    const emailField = document.getElementById('email');
    if (emailField) {
        emailField.value = email;
        emailField.setAttribute('readonly', true);
        emailField.style.backgroundColor = '#f8f9fa';
        emailField.style.cursor = 'not-allowed';
        emailField.style.color = '#6c757d';
    }
}

$(document).ready(function () {

    // Handle checkbox change event
    $('#isPublic').on('change', function () {
        const isChecked = $(this).is(':checked');
        const helpText = $(this).closest('.form-group').find('.form-text');

        if (isChecked) {
            helpText.text('When checked, others can view your card using the link or QR code');
            helpText.removeClass('text-danger').addClass('text-muted');
        } else {
            helpText.text('Your card will be private - only you can access it when logged in');
            helpText.removeClass('text-muted').addClass('text-danger');
        }

        // console.log('🔒 isPublic changed to:', isChecked);
    });

    // Function to create and show the resolution message
    function showResolutionMessage() {
        // Remove existing message if any
        const existingMessage = document.getElementById('resolution-message');
        if (existingMessage) {
            existingMessage.remove();
        }

        // Create message overlay
        const messageOverlay = document.createElement('div');
        messageOverlay.id = 'resolution-message';
        messageOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

        // Create message content
        const messageContent = document.createElement('div');
        messageContent.style.cssText = `
        background: white;
        padding: 2rem;
        border-radius: 20px;
        text-align: center;
        max-width: 90%;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
    `;

        messageContent.innerHTML = `
        <div style="font-size: 3rem; margin-bottom: 1rem;">📱</div>
        <h2 style="color: #333; margin-bottom: 1rem; font-size: 1.5rem;">Screen Too Small</h2>
        <p style="color: #666; margin-bottom: 1.5rem; line-height: 1.5;">
            This application requires a minimum screen width of 400px for the best experience. 
            Please rotate your device or use a larger screen.
        </p>
        <p style="color: #999; font-size: 0.9rem;">
            Current width: ${window.innerWidth}px | Required: 400px minimum
        </p>
    `;

        messageOverlay.appendChild(messageContent);
        document.body.appendChild(messageOverlay);
    }

    // Function to hide the resolution message
    function hideResolutionMessage() {
        const existingMessage = document.getElementById('resolution-message');
        if (existingMessage) {
            existingMessage.remove();
        }
    }

    // Function to check screen width and hide/show elements
    function checkScreenWidth() {
        const navbar = document.querySelector('.navbar');
        const container = document.querySelector('.container');
        const screenWidth = window.innerWidth;

        if (screenWidth < 330) {
            navbar.style.display = 'none';
            container.style.display = 'none';
            showResolutionMessage();
        } else {
            navbar.style.display = 'flex';
            container.style.display = 'block';
            hideResolutionMessage();
        }
    }

    // Check on page load
    document.addEventListener('DOMContentLoaded', checkScreenWidth);

    // Check on window resize
    window.addEventListener('resize', checkScreenWidth);

    /**
     * New code for form validation
     */

    // Hide save button initially
    document.addEventListener('DOMContentLoaded', function () {
        const saveBtn = document.querySelector('.save-btn');
        // saveBtn.style.display = 'none';
        setupRealtimeValidation();
    });

    // Validation functions
    function validateForm() {
        clearAllErrors();
        let isValid = true;

        // Validate required fields (cannot be empty)
        isValid = validateRequired('name', 'Full name is required') && isValid;
        // isValid = validateRequired('phone', 'Phone number is required') && isValid;
        // isValid = validateRequired('mobile', 'Mobile number is required') && isValid;
        isValid = validateRequired('email', 'Email address is required') && isValid;

        // Validate phone numbers format (only if they have values, but they're required so will have values)

        // Validate phone numbers format ONLY if they have values (optional fields)
        const phone = document.getElementById('phone').value.trim();
        const mobile = document.getElementById('mobile').value.trim();

        if (phone) {
            isValid = validatePhone('phone') && isValid;
        }

        if (mobile) {
            isValid = validatePhone('mobile') && isValid;
        }

        // Validate optional fields only if they have values
        const website = document.getElementById('website').value.trim();

        // Website validation - only if value present
        if (website) {
            isValid = validateURL('website', 'Please enter a valid website URL') && isValid;
        }

        // Validate social media URLs - only if values present
        const socialFields = ['instagram', 'facebook', 'twitter', 'linkedin', 'calendly', 'zoom', 'snapchat', 'tiktok', 'youtube', 'whatsapp', 'pinterest'];
        socialFields.forEach(field => {
            const value = document.getElementById(field).value.trim();
            if (value) { // Only validate if value is present
                isValid = validateURL(field, `Please enter a valid ${field} URL`) && isValid;
            }
        });

        // Show/hide save button based on validation
        // toggleSaveButton(isValid);

        return isValid;
    }

    // Toggle save button visibility
    function toggleSaveButton(isValid) {
        const saveBtn = document.querySelector('.save-btn');
        if (isValid) {
            saveBtn.style.display = 'block';
        } else {
            saveBtn.style.display = 'none';
        }
    }

    // Validate required fields
    function validateRequired(fieldId, errorMessage) {
        const field = document.getElementById(fieldId);
        const value = field.value.trim();

        if (!value) {
            showError(fieldId, errorMessage);
            return false;
        }
        return true;
    }

    // Validate phone numbers
    function validatePhone(fieldId) {
        const field = document.getElementById(fieldId);
        const value = field.value.trim();

        if (!value) return true; // Will be caught by required validation

        // Check if exactly 10 digits
        if (!/^\d{10}$/.test(value)) {
            showError(fieldId, 'Please enter exactly 10 digits');
            return false;
        }

        return true;
    }

    // Validate URLs
    function validateURL(fieldId, errorMessage) {
        const field = document.getElementById(fieldId);
        const value = field.value.trim();

        if (!value) return true; // Optional field - no error if empty

        try {
            // Add protocol if missing
            let url = value;
            if (!url.startsWith('http://') && !url.startsWith('https://')) {
                url = 'https://' + url;
            }

            new URL(url);

            // Additional validation for social media URLs
            if (fieldId === 'instagram' && !url.includes('instagram.com')) {
                showError(fieldId, 'Please enter a valid Instagram URL');
                return false;
            }
            if (fieldId === 'facebook' && !url.includes('facebook.com') && !url.includes('fb.com')) {
                showError(fieldId, 'Please enter a valid Facebook URL');
                return false;
            }
            if (fieldId === 'twitter' && !url.includes('twitter.com') && !url.includes('x.com')) {
                showError(fieldId, 'Please enter a valid Twitter/X URL');
                return false;
            }
            if (fieldId === 'linkedin' && !url.includes('linkedin.com')) {
                showError(fieldId, 'Please enter a valid LinkedIn URL');
                return false;
            }
            if (fieldId === 'youtube' && !url.includes('youtube.com') && !url.includes('youtu.be')) {
                showError(fieldId, 'Please enter a valid YouTube URL');
                return false;
            }
            if (fieldId === 'tiktok' && !url.includes('tiktok.com')) {
                showError(fieldId, 'Please enter a valid TikTok URL');
                return false;
            }
            if (fieldId === 'snapchat' && !url.includes('snapchat.com')) {
                showError(fieldId, 'Please enter a valid Snapchat URL');
                return false;
            }
            if (fieldId === 'whatsapp' && !url.includes('wa.me') && !url.includes('whatsapp.com')) {
                showError(fieldId, 'Please enter a valid WhatsApp URL');
                return false;
            }
            if (fieldId === 'calendly' && !url.includes('calendly.com')) {
                showError(fieldId, 'Please enter a valid Calendly URL');
                return false;
            }
            if (fieldId === 'reddit' && !url.includes('reddit.com')) {
                showError(fieldId, 'Please enter a valid reddit URL');
                return false;
            }
            if (fieldId === 'telegram' && !url.includes('telegram.com')) {
                showError(fieldId, 'Please enter a valid telegram URL');
                return false;
            }
            if (fieldId === 'pinterest' && !url.includes('pinterest.com')) {
                showError(fieldId, 'Please enter a valid pinterest URL');
                return false;
            }


            return true;
        } catch (e) {
            showError(fieldId, errorMessage);
            return false;
        }
    }

    // Show error styling and message
    function showError(fieldId, message) {
        const field = document.getElementById(fieldId);

        // Add error styling to input
        field.style.borderColor = '#dc3545';
        field.style.backgroundColor = '#fff5f5';

        // Check if this is a social media field with the new structure
        const socialFields = ['instagram', 'facebook', 'twitter', 'linkedin', 'calendly', 'zoom', 'snapchat', 'tiktok', 'youtube', 'whatsapp', 'telegram', 'reddit', 'pinterest'];

        if (socialFields.includes(fieldId)) {
            // For social media fields, find the .input-error div
            const socialItem = field.closest('.social-item');
            const errorContainer = socialItem.querySelector('.input-error');

            if (errorContainer) {
                errorContainer.innerHTML = `
                <div class="error-message" style="
                    color: #dc3545;
                    font-size: 0.875rem;
                    margin-top: 0.5rem;
                    font-weight: 500;
                    display: block;
                    width: 100%;
                ">${message}</div>
            `;
            }
        } else {
            // For regular form fields, use the original method
            const formGroup = field.closest('.form-group');

            // Remove existing error message
            const existingError = formGroup.querySelector('.error-message');
            if (existingError) {
                existingError.remove();
            }

            // Add error message directly under the input
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error-message';
            errorDiv.style.cssText = `
            color: #dc3545;
            font-size: 0.875rem;
            margin-top: 0.5rem;
            font-weight: 500;
            display: block;
            width: 100%;
        `;
            errorDiv.textContent = message;

            // Insert error message right after the input field
            field.parentNode.insertBefore(errorDiv, field.nextSibling);
        }
    }

    // Clear all error styling and messages
    function clearAllErrors() {
        // Remove error styling from all inputs
        const inputs = document.querySelectorAll('#profileForm input, #profileForm textarea');
        inputs.forEach(input => {
            input.style.borderColor = '';
            input.style.backgroundColor = '';
        });

        // Clear social media error containers
        const socialErrorContainers = document.querySelectorAll('.input-error');
        socialErrorContainers.forEach(container => {
            container.innerHTML = '';
        });

        // Remove all other error messages
        const errorMessages = document.querySelectorAll('.error-message');
        errorMessages.forEach(error => error.remove());
    }

    // Real-time validation with save button toggle
    function setupRealtimeValidation() {
        const form = document.getElementById('profileForm');

        // Validate on every input change
        form.addEventListener('input', function (e) {
            // Small delay to avoid excessive validation calls
            setTimeout(() => {
                validateForm();
            }, 100);
        });

        // Also validate on blur for immediate feedback
        form.addEventListener('blur', function (e) {
            const fieldId = e.target.id;
            if (!fieldId) return;

            // Clear previous error for this field
            const socialFields = ['instagram', 'facebook', 'twitter', 'linkedin', 'calendly', 'zoom', 'snapchat', 'tiktok', 'youtube', 'whatsapp', 'telegram', 'reddit', 'pinterest'];

            if (socialFields.includes(fieldId)) {
                // Clear social media field error
                const socialItem = e.target.closest('.social-item');
                const errorContainer = socialItem.querySelector('.input-error');
                if (errorContainer) {
                    errorContainer.innerHTML = '';
                }
            } else {
                // Clear regular field error
                const existingError = e.target.parentNode.querySelector('.error-message');
                if (existingError) {
                    existingError.remove();
                }
            }

            e.target.style.borderColor = '';
            e.target.style.backgroundColor = '';

            // Validate the specific field and then check overall form
            let fieldValid = true;
            const fieldValue = e.target.value.trim();

            switch (fieldId) {
                case 'name':
                case 'email':
                    // Required fields
                    fieldValid = validateRequired(fieldId, `${fieldId.charAt(0).toUpperCase() + fieldId.slice(1)} is required`);
                    break;
                case 'phone':
                case 'mobile':
                    // Optional fields - only validate format if value exists
                    if (fieldValue) {
                        fieldValid = validatePhone(fieldId);
                    }
                    break;
                case 'website':
                    // Optional field - only validate if has value
                    if (fieldValue) {
                        fieldValid = validateURL('website', 'Please enter a valid website URL');
                    }
                    break;
                default:
                    // Social media fields - optional, only validate if has value
                    if (socialFields.includes(fieldId) && fieldValue) {
                        fieldValid = validateURL(fieldId, `Please enter a valid ${fieldId} URL`);
                    }
            }

            // Check overall form validity after individual field validation
            setTimeout(() => {
                validateForm();
            }, 50);

        }, true);
    }

    // Form submission handler
    document.getElementById('profileForm').addEventListener('submit', function (e) {
        e.preventDefault();

        if (validateForm()) {
            // Form is valid, proceed with submission
            // console.log('Form is valid, submitting...');
            // Add your form submission logic here
        }
    });

    // Save button handler
    document.querySelector('.save-btn').addEventListener('click', function (e) {
        e.preventDefault();

        if (validateForm()) {
            // Form is valid, proceed with saving
            // console.log('Form is valid, saving...');
            // Add your save logic here

            // Optional: Show success message
            const saveBtn = this;
            const originalText = saveBtn.textContent;
            saveBtn.textContent = 'Saved!';
            saveBtn.style.backgroundColor = '#28a745';
            handleProfileSave();
            // console.log("Button clicked!");
            setTimeout(() => {
                saveBtn.textContent = originalText;
                saveBtn.style.backgroundColor = '';
            }, 2000);
        }
    });
});
// Modal functionality
document.addEventListener('DOMContentLoaded', function () {
    // Modal elements
    const modals = {
        privacy: document.getElementById('privacy-modal'),
        terms: document.getElementById('terms-modal'),
        faq: document.getElementById('faq-modal'),
        suggestions: document.getElementById('suggestions-modal'),
        contact: document.getElementById('contact-modal')
    };

    // Modal triggers
    const triggers = {
        privacy: document.getElementById('privacy-link'),
        terms: document.getElementById('terms-link'),
        faq: document.getElementById('faq-link'),
        suggestions: document.getElementById('suggestions-link'),
        contact: document.getElementById('contact-link')
    };

    // Open modal function
    function openModal(modalName) {
        if (modals[modalName]) {
            modals[modalName].style.display = 'block';
            document.body.style.overflow = 'hidden';
        }
    }

    // Close modal function
    function closeModal(modalName) {
        if (modals[modalName]) {
            modals[modalName].style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }

    // Add event listeners for triggers
    Object.keys(triggers).forEach(key => {
        if (triggers[key]) {
            triggers[key].addEventListener('click', (e) => {
                e.preventDefault();
                openModal(key);
            });
        }
    });

    // Add event listeners for close buttons
    document.querySelectorAll('.close').forEach(closeBtn => {
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                Object.keys(modals).forEach(key => {
                    if (modals[key] && modals[key].style.display === 'block') {
                        closeModal(key);
                    }
                });
            });
        }
    });

    // Close modal when clicking outside
    Object.values(modals).forEach(modal => {
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.style.display = 'none';
                    document.body.style.overflow = 'auto';
                }
            });
        }
    });

    // FAQ accordion functionality
    document.querySelectorAll('.faq-question').forEach(question => {
        if (question) {
            question.addEventListener('click', () => {
                const answer = question.nextElementSibling;
                if (answer) {
                    const isOpen = answer.classList.contains('show');

                    // Close all answers
                    document.querySelectorAll('.faq-answer').forEach(ans => {
                        ans.classList.remove('show');
                    });

                    // Toggle current answer
                    if (!isOpen) {
                        answer.classList.add('show');
                    }
                }
            });
        }
    });



    /**
     * =========Code for the suggestions =====
     */
    // Suggestions form
    const suggestionsForm = document.getElementById('suggestions-form');
    if (suggestionsForm) {
        suggestionsForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            // Get form data
            const formData = new FormData(this);
            const suggestionData = {
                name: formData.get('name'),
                email: formData.get('email'),
                category: formData.get('category'),
                title: formData.get('title'),
                details: formData.get('details')
            };

            // Get submit button
            const submitBtn = this.querySelector('button[type="submit"]');
            const originalBtnHTML = submitBtn.innerHTML;

            // Basic client-side validation
            if (!suggestionData.name || suggestionData.name.trim().length < 2) {
                alert('Please enter a valid name (at least 2 characters)');
                return;
            }

            if (!suggestionData.email || !isValidEmail(suggestionData.email)) {
                alert('Please enter a valid email address');
                return;
            }

            if (!suggestionData.title || suggestionData.title.trim().length < 5) {
                alert('Please enter a suggestion title (at least 5 characters)');
                return;
            }

            if (!suggestionData.details || suggestionData.details.trim().length < 5) {
                alert('Please provide more details (at least 20 characters)');
                return;
            }

            // Show loading state
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
            submitBtn.disabled = true;

            try {

                const result = await api.updatesuggestions(suggestionData);
                // console.log('📥 Suggestions save response:', result);

                if (result && result.success) {
                    // Success
                    // alert('Success: ' + result.message);

                    showSuccessMessage(result.message);


                    // Reset form
                    this.reset();

                    // Close modal if it exists
                    const modal = this.closest('.modal');
                    if (modal) {
                        modal.style.display = 'none';
                        document.body.style.overflow = 'auto';
                    }

                } else {
                    // Error from API

                    showErrorMessage('Failed to submit suggestion');
                    throw new Error(result.message || 'Failed to submit suggestion');
                }

            } catch (error) {
                console.error('Suggestion submission error:', error);

                // Show user-friendly error message
                let errorMessage = 'There was an error submitting your suggestion. ';

                if (error.message.includes('fetch')) {
                    errorMessage += 'Please check your internet connection and try again.';
                    showErrorMessage(errorMessage);
                } else if (error.message.includes('similar suggestion')) {
                    errorMessage = 'A similar suggestion was already submitted recently. Please try a different suggestion.';
                    showErrorMessage(errorMessage);
                } else {
                    errorMessage += error.message || 'Please try again later.';
                    showErrorMessage(errorMessage);
                }

            } finally {
                // Reset button state
                submitBtn.innerHTML = originalBtnHTML;
                submitBtn.disabled = false;
            }
        });
    }

    // Newsletter subscription (placeholder)
    const newsletterBtn = document.querySelector('.footer-section:last-child .btn');
    if (newsletterBtn) {
        newsletterBtn.addEventListener('click', function (e) {
            e.preventDefault();
            const emailInput = this.previousElementSibling;
            if (emailInput && emailInput.value) {
                alert('Thank you for subscribing to our newsletter!');
                emailInput.value = '';
            }
        });
    }


    // Helper function to validate email
    function isValidEmail(email) {
        const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
        return emailRegex.test(email);
    }


    // Helper functions for enhanced version
    function validateSuggestionForm(data) {
        const errors = [];

        if (!data.name || data.name.trim().length < 2) {
            errors.push({ field: 'suggestion-name', message: 'Name must be at least 2 characters' });
        }

        if (!data.email || !isValidEmail(data.email)) {
            errors.push({ field: 'suggestion-email', message: 'Please enter a valid email address' });
        }

        if (!data.title || data.title.trim().length < 5) {
            errors.push({ field: 'suggestion-title', message: 'Title must be at least 5 characters' });
        }

        if (!data.details || data.details.trim().length < 5) {
            errors.push({ field: 'suggestion-details', message: 'Details must be at least 20 characters' });
        }

        return errors;
    }

    function showSuccessMessage(message) {
        // Create success notification
        const successDiv = document.createElement('div');
        successDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #d4edda;
            color: #155724;
            padding: 15px 20px;
            border-radius: 8px;
            border: 1px solid #c3e6cb;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            z-index: 10000;
            max-width: 400px;
            font-size: 14px;
        `;
        successDiv.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;

        document.body.appendChild(successDiv);

        setTimeout(() => {
            successDiv.remove();
        }, 5000);
    }

    function showErrorMessage(message) {
        // Create error notification
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #f8d7da;
            color: #721c24;
            padding: 15px 20px;
            border-radius: 8px;
            border: 1px solid #f5c6cb;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            z-index: 10000;
            max-width: 400px;
            font-size: 14px;
        `;
        errorDiv.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${message}`;

        document.body.appendChild(errorDiv);

        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
    }
    /**
     * =========== End of code ========
     */


    /**
     * ===== Code for contact form =======
     */

    // Phone validation helper
    function isValidPhone(phone) {
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        return phoneRegex.test(phone.trim());
    }

    // Validation function for contact form
    function validateContactForm(data) {
        // Name validation
        if (!data.name || data.name.trim().length < 2) {
            return 'Please enter a valid name (at least 2 characters)';
        }

        // Email validation
        if (!data.email || !isValidEmail(data.email)) {
            return 'Please enter a valid email address';
        }

        // Subject validation
        if (!data.subject) {
            return 'Please select a subject';
        }

        // Message validation
        if (!data.message || data.message.trim().length < 10) {
            return 'Please enter a message (at least 10 characters)';
        }

        // Phone validation (if provided)
        if (data.phone && data.phone.trim() && !isValidPhone(data.phone)) {
            return 'Please enter a valid phone number or leave it empty';
        }

        return null; // No validation errors
    }
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            // Hide any existing success messages
            const successMessage = document.getElementById('contact-success');
            if (successMessage) {
                successMessage.style.display = 'none';
            }

            // Get form data
            const formData = new FormData(this);
            const contactData = {
                name: formData.get('name'),
                email: formData.get('email'),
                phone: formData.get('phone'),
                subject: formData.get('subject'),
                message: formData.get('message')
            };

            // Get submit button
            const submitBtn = this.querySelector('button[type="submit"]');
            const originalBtnHTML = submitBtn.innerHTML;

            // Basic client-side validation
            const validationError = validateContactForm(contactData);
            if (validationError) {
                showErrorMessage(validationError);
                return;
            }

            // Show loading state
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
            submitBtn.disabled = true;

            try {
                // // Make API call to backend
                // const response = await fetch(`${API_BASE_URL}/contact`, {
                //     method: 'POST',
                //     headers: {
                //         'Content-Type': 'application/json',
                //     },
                //     body: JSON.stringify(contactData)
                // });

                // const result = await response.json();

                const result = await api.updatecontactinfo(contactData);
                // console.log('📥 Suggestions save response:', result);

                if (result && result.success) {
                    // Show success message in modal
                    showSuccessMessage("Thank you for contacting us. We will get back to you.");

                    // Reset form
                    this.reset();

                    // Auto-close modal after 3 seconds
                    setTimeout(() => {
                        const modal = document.getElementById('contact-modal');
                        if (modal) {
                            modal.style.display = 'none';
                            document.body.style.overflow = 'auto';
                        }
                        if (successMessage) {
                            successMessage.style.display = 'none';
                        }
                    }, 3000);

                } else {
                    // Handle API error
                    showErrorMessage('Failed to send message');
                    throw new Error(result.message || 'Failed to send message');
                }

            } catch (error) {
                console.error('Contact submission error:', error);

                // Show error message
                let errorMessage = 'There was an error sending your message. ';

                if (error.message.includes('fetch') || error.message.includes('NetworkError')) {
                    errorMessage += 'Please check your internet connection and try again.';
                    showErrorMessage(errorMessage);
                } else if (error.message.includes('validation') || error.message.includes('required')) {
                    errorMessage = 'Please fill in all required fields correctly.';
                    showErrorMessage(errorMessage);
                } else {
                    errorMessage += error.message || 'Please try again later.';
                    showErrorMessage(errorMessage);
                }

                // showErrorNotification(errorMessage);

            } finally {
                // Reset button state
                submitBtn.innerHTML = originalBtnHTML;
                submitBtn.disabled = false;
            }
        });
    }

    // Modal close functionality (if not already implemented)
    const modal = document.getElementById('contact-modal');
    const closeBtn = modal?.querySelector('.close');

    if (closeBtn) {
        closeBtn.addEventListener('click', function () {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';

            // Hide success message when closing
            const successMessage = document.getElementById('contact-success');
            if (successMessage) {
                successMessage.style.display = 'none';
            }
        });
    }

    // Close modal when clicking outside
    if (modal) {
        modal.addEventListener('click', function (e) {
            if (e.target === modal) {
                modal.style.display = 'none';
                document.body.style.overflow = 'auto';

                // Hide success message when closing
                const successMessage = document.getElementById('contact-success');
                if (successMessage) {
                    successMessage.style.display = 'none';
                }
            }
        });
    }


    /**
     * ---- End of Code =====
     */
});

/**
 * This section is for the profile avatar.
 */

// Update profile photo/avatar display
function updateProfileDisplay(profile) {
    const avatarDisplay = $('#avatarDisplay');
    const avatarInitials = $('#avatarInitials');
    const profilePhotoImg = $('#profilePhotoImg');
    const deleteBtn = $('#deletePhotoBtn');

    if (profile.hasProfilePhoto) {
        // Show photo
        profilePhotoImg.attr('src', `/api/profile/photo/${profile._id}`);
        profilePhotoImg.show();
        avatarDisplay.hide();
        deleteBtn.show();
    } else {
        // Show avatar with initials
        avatarInitials.text(profile.initials);
        avatarDisplay.show();
        profilePhotoImg.hide();
        deleteBtn.hide();
    }
}

// Update navbar avatar
function updateNavbarAvatar(profile) {
    let navbarAvatar = $('.navbar-avatar');

    // Create navbar avatar if it doesn't exist
    if (navbarAvatar.length === 0) {
        navbarAvatar = $('<div class="navbar-avatar"></div>');
        $('#logoutBtn').after(navbarAvatar);
    }

    navbarAvatar.empty();

    if (profile.hasProfilePhoto) {
        navbarAvatar.html(`<img src="/api/profile/photo/${profile._id}" alt="Profile">`);
    } else {
        navbarAvatar.text(profile.initials);
    }

    // Make it clickable to go to profile
    navbarAvatar.off('click').on('click', function () {
        window.location.href = '/profile';
    });
}

// Handle photo upload button click
$('#uploadPhotoBtn').on('click', function () {
    $('#profilePhotoInput').click();
});

// Handle file selection
$('#profilePhotoInput').on('change', async function (e) {
    const file = e.target.files[0];

    if (!file) return;

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        $(this).val('');
        return;
    }

    const fileName = file.name.toLowerCase();
    const isHEIC = fileName.endsWith('.heic') || fileName.endsWith('.heif');
    const isStandardImage = file.type.startsWith('image/');

    // Validate file type
    if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        $(this).val('');
        return;
    }
    if (!isStandardImage && !isHEIC) {
        alert('Please select an image file (JPG, PNG, GIF, HEIC)');
        $(this).val('');
        return;
    }


    // Preview image before upload
    // const reader = new FileReader();
    // reader.onload = function(e) {
    //     $('#profilePhotoImg').attr('src', e.target.result).show();
    //     $('#avatarDisplay').hide();
    // };
    // reader.readAsDataURL(file);

    // Preview handling
    if (isHEIC) {
        console.log('📸 HEIC file - will be converted on server');
        // Can't preview HEIC in browser
        $('#avatarDisplay').show();
        $('#profilePhotoImg').hide();
    } else {
        // Preview standard images
        const reader = new FileReader();
        reader.onload = function (e) {
            $('#profilePhotoImg').attr('src', e.target.result).show();
            $('#avatarDisplay').hide();
        };
        reader.readAsDataURL(file);
    }

    // Upload photo
    await uploadProfilePhoto(file);
});

// Upload photo to server
async function uploadProfilePhoto(file) {
    const formData = new FormData();
    formData.append('profilePhoto', file);

    const isHEIC = file.name.toLowerCase().endsWith('.heic') ||
        file.name.toLowerCase().endsWith('.heif');

    const uploadBtn = $('#uploadPhotoBtn');
    uploadBtn.prop('disabled', true)
        .text(isHEIC ? 'Converting & Uploading...' : 'Uploading...');
    try {
        const response = await $.ajax({
            url: '/api/profile/upload-profile-photo',
            method: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('token')
            }
        });

        if (response.success) {
            alert('Profile photo uploaded successfully!');
            $('#deletePhotoBtn').show();
            const uploadbuttontext = ` <i class="fas fa-upload"></i>
            Upload Photo`
            uploadBtn.prop('disabled', false).html(uploadbuttontext);
            // Reload profile to update navbar
            await loadProfileData();
        }
    } catch (error) {
        console.error('Error uploading photo:', error);
        alert(error.responseJSON?.message || 'Error uploading photo');

        // Reset preview
        $('#profilePhotoImg').hide();
        $('#avatarDisplay').show();
        $('#profilePhotoInput').val('');
    }
}

// Delete photo
$('#deletePhotoBtn').on('click', async function () {
    if (!confirm('Are you sure you want to remove your profile photo?')) {
        return;
    }

    try {
        const response = await $.ajax({
            url: '/api/profile/delete-profile-photo',
            method: 'DELETE',
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('token')
            }
        });

        if (response.success) {
            alert('Profile photo removed successfully!');

            // Show avatar again
            $('#profilePhotoImg').hide();
            $('#avatarDisplay').show();
            $('#deletePhotoBtn').hide();
            $('#profilePhotoInput').val('');

            // Reload profile to update navbar
            await loadProfileData();
        }
    } catch (error) {
        console.error('Error deleting photo:', error);
        alert('Error removing photo');
    }
});

/**
 * ------ End of the profile avtar section --------
 */

// Add smooth scroll animation when steps come into view
document.addEventListener('DOMContentLoaded', function () {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '0';
                entry.target.style.transform = 'translateY(30px)';

                setTimeout(() => {
                    entry.target.style.transition = 'opacity 0.6s, transform 0.6s';
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }, 100);

                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.step-card').forEach(card => {
        observer.observe(card);
    });
});
async function getUserStatus() {
    try {
        const data = await $.ajax({
            url: `auth/status`,
            method: 'GET',
            dataType: 'json',

        });

        // console.log('User status:', data);
        return data;

    } catch (error) {
        console.log('Failed to fetch user:', error.message);
        // alert('Error loading user data');
    }
}

// Usage

// Function to check and handle URL parameters
async function handleURLParams() {
    const urlParams = new URLSearchParams(window.location.search);

    // Check if any parameters exist
    if (urlParams.toString()) {
        // console.log('URL Parameters found!');

        // Get all parameters as an object
        const params = {};
        for (const [key, value] of urlParams.entries()) {
            params[key] = value;
        }

        console.log('Parameters:', params);

        // Example: Access specific parameters
        if (urlParams.has('page')) {
            console.log('Page:', urlParams.get('page'));
            let pagename = urlParams.get('page');
            if (pagename == 'home') {
                showPage('home');
            }
            if (pagename == 'faq') {
                showPage('faq')
            }
            if (pagename == 'signup') {
                const user = await getUserStatus();

                if (user && user.authenticated && user.authenticated == true) {
                    showPage('display')
                } else {
                    showPage('signup')
                }
                // showPage('faq')
            }
            if (pagename == 'login') {
                // showPage('faq')
                const user = await getUserStatus();

                if (user && user.authenticated && user.authenticated == true) {
                    showPage('display')
                } else {
                    showPage('login')
                }
            }
            if (pagename == 'profile') {
                const user = await getUserStatus();

                if (user && user.authenticated && user.authenticated == true) {
                    showPage('display')
                } else {
                    showPage('login')
                }
            }



        }

        // Your custom logic here
        // Example: Load content based on params
        // loadPageContent(params);

        return params;
    } else {
        console.log('No URL parameters found');
        return null;
    }
}

// Trigger on page load
// $(document).ready(function () {

// });

// Trigger on URL change (back/forward browser buttons)
$(window).on('popstate', function () {
    handleURLParams();
});

// Trigger on hash change (if using #hash in URLs)
$(window).on('hashchange', function () {
    handleURLParams();
});

// If you're using pushState/replaceState, wrap them to trigger your function
const originalPushState = history.pushState;
const originalReplaceState = history.replaceState;

history.pushState = function () {
    originalPushState.apply(history, arguments);
    handleURLParams();
};

history.replaceState = function () {
    originalReplaceState.apply(history, arguments);
    handleURLParams();
};

// Initialize application
/**
 * Main function where application is starting.
 */
// Enhanced initialization// Enhanced initialization
document.addEventListener('DOMContentLoaded', async function () {
    console.log('🚀 Application starting...');
    // hidden
    /**
     * To enable the download apple pass function.
     */
    // if(isIOS()){
    //     $("#addToWallet-btn").removeClass('hidden');
    // }
    // Check if this is a standalone card view first
    const isStandalone = await checkStandaloneMode();
    // console.log('🔍 Standalone mode:', isStandalone);

    if (!isStandalone) {
        // Normal application mode
        try {
            // console.log('🔐 Checking authentication status...');
            const isAuthenticated = await api.checkAuthStatus();
            // console.log('🔐 Authentication status:', isAuthenticated);

            if (isAuthenticated) {
                try {
                    // console.log('👤 Getting current user...');
                    const user = await api.getCurrentUser();
                    // console.log('👤 Current user response:', user);

                    if (user.success) {
                        currentUser = user.user;
                        updateAuthUI();
                        // console.log('✅ User authenticated:', currentUser.email);

                        // Check if user has an active profile
                        // console.log('📋 Checking for user profile...');
                        const profileResponse = await api.getProfile();

                        if (profileResponse.success && profileResponse.profile) {
                            // console.log('✅ User has active profile, showing My Card');
                            await loadProfileData();
                            // Set email field to read-only with user's email
                            setUserEmail(currentUser.email);
                            showPage('display'); // Show My Card page
                            $("#footer-cta").addClass('display-none-cta-button')
                            $("#footer-cta").removeClass('cta-section')
                            handleURLParams();
                        } else {
                            console.log('📝 No active profile found, showing Profile creation');
                            // Set email field to read-only with user's email
                            setUserEmail(currentUser.email);
                            showPage('profile'); // Show Profile creation/editing page
                        }
                    }
                } catch (error) {
                    console.error('❌ User initialization error:', error);
                    currentUser = null;
                    showPage('home');
                }
            } else {
                console.log('❌ User not authenticated, showing home page');
                currentUser = null;
                showPage('home');
            }
        } catch (error) {
            console.error('❌ Auth check error:', error);
            currentUser = null;
            showPage('home');
        }

        updateAuthUI();

        // Handle OAuth callback
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('auth') === 'success') {
            console.log('🎉 OAuth success detected');
            showSuccessMessage('Successfully logged in!');
            // After OAuth success, check profile status and route accordingly
            setTimeout(async () => {
                const profileResponse = await api.getProfile();
                if (profileResponse.success && profileResponse.profile) {
                    showPage('display');
                } else {
                    showPage('profile');
                }
            }, 1000);
            window.history.replaceState({}, document.title, window.location.pathname);
        } else if (urlParams.get('error')) {
            console.log('❌ OAuth error detected:', urlParams.get('error'));
            showErrorMessage('Login failed. Please try again.');
            showPage('home');
        }
    }

    console.log('✅ Application initialized');
});


// http://localhost:3030/auth/status
// {"success":true,"authenticated":true,"userId":"68cdca416a6cbf44578311ed","email":"harshilp.ui@gmail.com"}