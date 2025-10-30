{
    /* <script> */
}

document.addEventListener("DOMContentLoaded", async function () {
    const authResponse = await fetch("/auth/status", {
        credentials: "include",
    });
    const authData = await authResponse.json();

    if (authData.authenticated) {
        $(".create-profile-btn").hide();
    } else {
        $(".create-profile-btn").show();
    }
});

// ============================================
// WALLET MANAGEMENT WITH DUPLICATE PREVENTION
// ============================================

// Cache to prevent duplicate API calls
let walletFetchInProgress = false;
let addToWalletInProgress = false;
let cachedWallet = null;

// Get auth token from cookie
function getAuthToken() {
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'authToken') {
            return value;
        }
    }
    return null;
}

// Check if user is authenticated
function isAuthenticated() {
    return !!getAuthToken();
}


// API Request helper
async function apiRequest(endpoint, options = {}) {
    const token = getAuthToken();

    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        },
        credentials: 'include', // Important for cookies
        ...options
    };

    if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const response = await fetch(endpoint, config);
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

// Fetch wallet with caching and duplicate prevention
async function fetchWallet(forceRefresh = false) {
    // Prevent duplicate calls
    if (walletFetchInProgress) {
        console.log('⏳ Wallet fetch already in progress...');
        // Wait for the current fetch to complete
        await new Promise(resolve => {
            const checkInterval = setInterval(() => {
                if (!walletFetchInProgress) {
                    clearInterval(checkInterval);
                    resolve();
                }
            }, 100);
        });
        return cachedWallet;
    }

    // Return cached wallet if available and not forcing refresh
    if (cachedWallet && !forceRefresh) {
        console.log('📦 Returning cached wallet');
        return cachedWallet;
    }

    try {
        walletFetchInProgress = true;
        console.log('🔄 Fetching wallet from server...');

        const response = await apiRequest('/api/wallet');

        if (response.success) {
            cachedWallet = response.wallet;
            console.log(`✅ Wallet fetched: ${cachedWallet.cards.length} cards`);
            return cachedWallet;
        }

        throw new Error(response.message || 'Failed to fetch wallet');

    } catch (error) {
        console.error('❌ Error fetching wallet:', error);
        throw error;
    } finally {
        walletFetchInProgress = false;
    }
}


// Add card to wallet with duplicate prevention
async function addCardToWallet(cardIdentifier) {
    // Prevent duplicate add operations
    if (addToWalletInProgress) {
        console.log('⏳ Add to wallet already in progress...');
        return;
    }

    try {
        addToWalletInProgress = true;
        console.log(`➕ Adding card to wallet: ${cardIdentifier}`);

        const response = await apiRequest(`/api/wallet/add/${cardIdentifier}`, {
            method: 'POST'
        });

        if (response.success) {
            cachedWallet = response.wallet; // Update cache
            console.log('✅ Card added to wallet successfully');
            return response;
        }

        throw new Error(response.message || 'Failed to add card');

    } catch (error) {
        console.error('❌ Error adding card to wallet:', error);
        throw error;
    } finally {
        addToWalletInProgress = false;
    }
}

// Clear wallet cache
function clearWalletCache() {
    cachedWallet = null;
    console.log('🗑️ Wallet cache cleared');
}


// Show success message
function showSuccessMessage(message) {
    const msgEl = document.createElement('div');
    msgEl.style.cssText = `
      position: fixed;
      top: 2rem;
      right: 2rem;
      background: #10b981;
      color: white;
      padding: 1rem 1.5rem;
      border-radius: 10px;
      z-index: 10001;
      font-weight: 600;
      box-shadow: 0 10px 25px rgba(16, 185, 129, 0.3);
      animation: slideIn 0.3s ease-out;
    `;
    msgEl.textContent = message;
    document.body.appendChild(msgEl);
    setTimeout(() => {
        msgEl.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => msgEl.remove(), 300);
    }, 3000);
}

// Show error message
function showErrorMessage(message) {
    const msgEl = document.createElement('div');
    msgEl.style.cssText = `
      position: fixed;
      top: 2rem;
      right: 2rem;
      background: #ef4444;
      color: white;
      padding: 1rem 1.5rem;
      border-radius: 10px;
      z-index: 10001;
      font-weight: 600;
      box-shadow: 0 10px 25px rgba(239, 68, 68, 0.3);
    `;
    msgEl.textContent = message;
    document.body.appendChild(msgEl);
    setTimeout(() => msgEl.remove(), 4000);
}


// Add to Wallet functionality
// Updated function to work with jQuery object
async function handleAddToWallet(btnElement) {
    // btnElement is already a jQuery object from $(this)
    const $btn = btnElement;
    const originalText = $btn.html(); // Use .html() instead of .innerHTML

    try {
        // Check if user is logged in
        const authResponse = await fetch("/auth/status", {
            credentials: "include",
        });
        const authData = await authResponse.json();

        if (!authData.authenticated) {
            // Store the current card URL to redirect back after login
            sessionStorage.setItem("pendingWalletCard", contactData.cardId);
            sessionStorage.setItem("redirectToWallet", "true");
            // Redirect to login
            window.location.href = "/login?redirectToWallet=true";
            return;
        }

        // User is logged in, add card to wallet
        $btn.prop("disabled", true); // Use .prop() instead of .disabled
        $btn.html('<i class="fas fa-spinner fa-spin"></i> Adding...'); // Use .html()

        const response = await fetch(`/api/wallet/add/${contactData.cardId}`, {
            method: "POST",
            credentials: "include",
        });

        const data = await response.json();

        if (data.success) {
            $btn.html('<i class="fas fa-check"></i> Added to Wallet!'); // Use .html()
            $btn.css("background", "#28a745"); // Use .css() instead of .style
            showSuccessMessage("Card added to your wallet! You can view it in the Wallet tab.")
            // Show success message
            // setTimeout(() => {
            //     alert("Card added to your wallet! You can view it in the Wallet tab.");
            // }, 300);

            setTimeout(() => {
                $btn.html(originalText); // Use .html()
                $btn.css("background", ""); // Use .css()
                $btn.prop("disabled", false); // Use .prop()
            }, 1000);
            window.open('/wallet', '_blank');

        } else {
            throw new Error(data.message || "Failed to add card");
        }
    } catch (error) {
        console.error("Error adding to wallet:", error);
        $btn.html('<i class="fas fa-exclamation-circle"></i> Error');
        alert(error.message || "Failed to add card to wallet. Please try again.");

        setTimeout(() => {
            $btn.html(originalText);
            $btn.prop("disabled", false);
        }, 2000);
    }
}


// Handle "Add to QRWallet" button click
// Handle "Add to QRWallet" button click (jQuery version)
// async function handleAddToWallet($button) {
//     // Store original button content
//     const originalHTML = $button.html();

//     try {
//       // Check authentication
//       if (!isAuthenticated()) {
//         showErrorMessage('Please login to add cards to your wallet');
//         setTimeout(() => {
//           window.location.href = '/login';
//         }, 1500);
//         return;
//       }

//       // Check if already in progress
//       if (addToWalletInProgress) {
//         console.log('⏳ Already adding to wallet, please wait...');
//         return;
//       }

//       // Disable button during operation
//       $button.prop('disabled', true);
//       $button.html('<i class="fas fa-spinner fa-spin"></i> Adding...');

//       // Get card identifier from URL, data attribute, or button
//       let cardIdentifier = $button.data('card-id') || 
//                            $button.attr('data-card-id') ||
//                            $button.data('slug');

//       // If not found, try to get from URL
//       if (!cardIdentifier) {
//         const pathParts = window.location.pathname.split('/');
//         cardIdentifier = pathParts[pathParts.length - 1];
//       }

//       // Try to get from contact data if available
//       if (!cardIdentifier && typeof contactData !== 'undefined') {
//         cardIdentifier = contactData.slug || contactData.cardId;
//       }

//       if (!cardIdentifier) {
//         throw new Error('Card identifier not found');
//       }

//       console.log(`🎯 Using card identifier: ${cardIdentifier}`);

//       // Add card to wallet
//       const response = await addCardToWallet(cardIdentifier);

//       if (response.success) {
//         // Show success message
//         showSuccessMessage('✅ Card added to your wallet!');

//         // Update button to show it's added
//         $button.html('<i class="fas fa-check"></i> Added to Wallet');
//         $button.css('background', '#10b981');

//         // Optional: Ask user if they want to view wallet
//         setTimeout(() => {
//           if (confirm('Card added successfully! View your wallet now?')) {
//             window.location.href = '/?page=wallet';
//           } else {
//             // Re-enable button after some time if user stays on page
//             setTimeout(() => {
//               $button.prop('disabled', false);
//               $button.html(originalHTML);
//               $button.css('background', '');
//             }, 2000);
//           }
//         }, 1000);
//       }

//     } catch (error) {
//       console.error('❌ Add to wallet error:', error);

//       // Show appropriate error message
//       if (error.message && error.message.includes('already in wallet')) {
//         showErrorMessage('This card is already in your wallet');
//         $button.html('<i class="fas fa-check"></i> Already in Wallet');
//         $button.css('background', '#6b7280');
//       } else if (error.message && error.message.includes('not found')) {
//         showErrorMessage('Card not found. Please try again.');
//         $button.prop('disabled', false);
//         $button.html(originalHTML);
//       } else {
//         showErrorMessage(error.message || 'Failed to add card to wallet');
//         // Restore button
//         $button.prop('disabled', false);
//         $button.html(originalHTML);
//       }
//     }
//   }


// Usage:
// $(".addToWalletBtn").click(function () {
//     handleAddToWallet($(this));
// });

function normalizeUrl(url) {
    if (!url || url.trim() === "") return "";

    url = url.trim();

    // If URL already has protocol, return as is
    if (/^https?:\/\//i.test(url)) {
        return url;
    }

    // Add https:// if missing
    return "https://" + url;
}
function showMapOptions(encodedLocation, locationString) {
    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedLocation}`;
    const appleMapsUrl = `https://maps.apple.com/?q=${encodedLocation}`;

    // Create modal for map selection
    const modalHTML = `
    <div id="mapModal" class="map-modal">
        <div class="map-modal-content">
            <h3>Open Location in:</h3>
            <p class="location-text">${locationString}</p>
            <div class="map-options">
                <a href="${appleMapsUrl}" class="map-option-btn apple-maps" onclick="trackContact('apple_maps')">
                    <i class="fas fa-map"></i>
                    <span>Apple Maps</span>
                </a>
                <a href="${googleMapsUrl}" target="_blank" class="map-option-btn google-maps" onclick="trackContact('google_maps')">
                    <i class="fab fa-google"></i>
                    <span>Google Maps</span>
                </a>
            </div>
            <button class="close-modal-btn" onclick="closeMapModal()">Cancel</button>
        </div>
    </div>
`;

    // Remove existing modal if present
    const existingModal = document.getElementById("mapModal");
    if (existingModal) {
        existingModal.remove();
    }

    // Add modal to body
    document.body.insertAdjacentHTML("beforeend", modalHTML);

    // Show modal with animation
    setTimeout(() => {
        document.getElementById("mapModal").classList.add("active");
    }, 10);
}

function closeMapModal() {
    const modal = document.getElementById("mapModal");
    if (modal) {
        modal.classList.remove("active");
        setTimeout(() => modal.remove(), 300);
    }
}

// Close modal when clicking outside
document.addEventListener("click", (e) => {
    const modal = document.getElementById("mapModal");
    if (modal && e.target === modal) {
        closeMapModal();
    }
});

function hideResolutionMessage() {
    const existingMessage = document.getElementById("resolution-message");
    if (existingMessage) {
        existingMessage.remove();
    }
}

function showResolutionMessage() {
    // Remove existing message if any
    const existingMessage = document.getElementById("resolution-message");
    if (existingMessage) {
        existingMessage.remove();
    }

    // Create message overlay
    const messageOverlay = document.createElement("div");
    messageOverlay.id = "resolution-message";
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
    const messageContent = document.createElement("div");
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
// Function to check screen width and hide/show elements
function checkScreenWidth() {
    const profilesection = document.querySelector(".card-container");

    const screenWidth = window.innerWidth;

    if (screenWidth < 300) {
        profilesection.style.display = "none";

        showResolutionMessage();
    } else {
        profilesection.style.display = "flex";
        profilesection.style.display = "block";
        hideResolutionMessage();
    }
}

// Check on page load
document.addEventListener("DOMContentLoaded", checkScreenWidth);

// Check on window resize
window.addEventListener("resize", checkScreenWidth);

$(".newuser-section").click(function () {
    window.open(window.location.origin, "_blank");
});

$(".logo-image").click(function () {
    window.open(window.location.origin, "_blank");
});

$(".addToWalletBtn").click(function () {
    handleAddToWallet($(this));
});

// Bind the click handler with ONE event listener
//   $(".addToWalletBtn").on('click', function(e) {
//     e.preventDefault();
//     e.stopPropagation();
//     handleAddToWallet($(this));
//   });

// Contact data from server - now properly injected as JSON
// const contactData = {{ contactDataJSON }};

const contactDataString = document.getElementById("contact-data").textContent;
const contactData = JSON.parse(contactDataString);

// console.log("After the solution: ",contactData);

// const contactDataString = '{{contactDataJSON}}';
// const contactData = JSON.parse(contactDataString);
// ADD this right after the contactData declaration in your HTML template (REMOVE after testing)
// console.log('Frontend contactData:', contactData);
// console.log('Frontend socialMedia:', contactData.socialMedia);
// Populate contact section
function populateContacts() {
    const contactSection = document.getElementById("contactSection");
    let contactHtml = "";
    let phonedivhtml = "";
    let contentdivhtml = "";
    if (contactData.phone && contactData.phone.trim()) {
        phonedivhtml += `
        <a href="tel:${contactData.phone}" class="contact-item contact-phone" onclick="trackContact('phone')">
            <div class="contact-icon"><i class="fas fa-phone"></i></div>
            <div class="contact-info">
                
                <div class="contact-value">${contactData.phone}</div>
            </div>
        </a>
    `;
    }

    if (contactData.mobile && contactData.mobile.trim()) {
        phonedivhtml += `
        <a href="tel:${contactData.mobile}" class="contact-item contact-phone" onclick="trackContact('mobile')">
            <div class="contact-icon"><i class="fas fa-mobile-alt"></i></div>
            <div class="contact-info">
                
                <div class="contact-value">${contactData.mobile}</div>
            </div>
        </a>
    `;
    }

    if (contactData.email && contactData.email.trim()) {
        contentdivhtml += `
        <a href="mailto:${contactData.email}" class="contact-item" onclick="trackContact('email')">
            <div class="contact-icon"><i class="fas fa-envelope"></i></div>
            <div class="contact-info">
                
                <div class="contact-value">${contactData.email}</div>
            </div>
        </a>
    `;
    }

    if (contactData.website && contactData.website.trim()) {
        const normalizedWebsite = normalizeUrl(contactData.website);

        contentdivhtml += `
            <a href="${normalizedWebsite}" target="_blank" class="contact-item" onclick="trackContact('website')">
                <div class="contact-icon"><i class="fas fa-globe"></i></div>
                <div class="contact-info">
                
                    <div class="contact-value">${contactData.website}</div>
                </div>
            </a>
        `;
    }

    // Display location only if country exists and has data
    // Display location only if country exists and has data
    if (
        contactData.country &&
        contactData.country.name &&
        contactData.country.name.trim()
    ) {
        // Build location string
        let locationParts = [];

        if (
            contactData.city &&
            contactData.city.name &&
            contactData.city.name.trim()
        ) {
            locationParts.push(contactData.city.name);
        }

        if (
            contactData.state &&
            contactData.state.name &&
            contactData.state.name.trim()
        ) {
            locationParts.push(contactData.state.name);
        }

        locationParts.push(contactData.country.name);

        const locationString = locationParts.join(", ");
        const encodedLocation = encodeURIComponent(locationString);

        // Detect device type
        const userAgent = navigator.userAgent || navigator.vendor || window.opera;
        const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream;
        const isAndroid = /android/i.test(userAgent);

        if (isIOS) {
            // For iOS - show both options
            contentdivhtml += `
        <div class="contact-item location-item" onclick="showMapOptions('${encodedLocation}', '${locationString.replace(
                /'/g,
                "\\'"
            )}')">
            <div class="contact-icon"><i class="fas fa-map-marker-alt"></i></div>
            <div class="contact-info">
               
                <div class="contact-value">${locationString}</div>
            </div>
        </div>
    `;
        } else {
            // For Android and other devices - direct Google Maps link
            const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedLocation}`;

            contentdivhtml += `
        <a href="${googleMapsUrl}" target="_blank" class="contact-item" onclick="trackContact('location')">
            <div class="contact-icon"><i class="fas fa-map-marker-alt"></i></div>
            <div class="contact-info">
               
                <div class="contact-value">${locationString}</div>
            </div>
        </a>
    `;
        }
    }

    phonedivhtml = `<div class='contact-div'>${phonedivhtml} ${contentdivhtml}</div>`;
    // contentdivhtml = `<div class='othercontact-div'>${contentdivhtml}</div>`;
    contactSection.innerHTML = phonedivhtml;
}

//
// UPDATE the populateSocialMedia function (around line 400 in your template)
function populateSocialMedia() {
    const socialSection = document.getElementById("socialSection");
    const socialLinks = document.getElementById("socialLinks");

    // EXPANDED social platforms list with Font Awesome icons
    const socialPlatforms = {
        instagram: { icon: "fab fa-instagram", name: "Instagram" },
        facebook: { icon: "fab fa-facebook", name: "Facebook" },
        twitter: { icon: "fab fa-twitter", name: "Twitter" },
        linkedin: { icon: "fab fa-linkedin", name: "LinkedIn" },
        github: { icon: "fab fa-github", name: "GitHub" },
        youtube: { icon: "fab fa-youtube", name: "YouTube" },
        tiktok: { icon: "fab fa-tiktok", name: "TikTok" },
        snapchat: { icon: "fab fa-snapchat", name: "Snapchat" },
        whatsapp: { icon: "fab fa-whatsapp", name: "WhatsApp" },
        calendly: { icon: "fas fa-calendar-alt", name: "Calendly" },
        zoom: { icon: "fas fa-headphones", name: "Zoom" },
        discord: { icon: "fab fa-discord", name: "Discord" },
        telegram: { icon: "fa-brands fa-telegram", name: "Telegram" },
        pinterest: { icon: "fa-brands fa-pinterest", name: "Pinterest" },
        reddit: { icon: "fa-brands fa-reddit", name: "Reddit" },
    };

    let socialHtml = "";
    let hasAnySocial = false;
    // <span style="font-size: 0.8rem; font-weight: 600;">${name}</span>
    // Check if socialMedia exists and has properties
    if (contactData.socialMedia && typeof contactData.socialMedia === "object") {
        Object.entries(contactData.socialMedia).forEach(([platform, url]) => {
            if (url && url.trim() && url !== "") {
                hasAnySocial = true;
                const platformData = socialPlatforms[platform];
                const icon = platformData ? platformData.icon : "fas fa-link";
                const name = platformData
                    ? platformData.name
                    : platform.charAt(0).toUpperCase() + platform.slice(1);

                socialHtml += `
                <a href="${url}" target="_blank" class="card-icon-design" onclick="trackSocial('${platform}')">
                    <i class="${icon} card-icon-design" style=""></i>
                    
                </a>
            `;
            }
        });
    }

    if (hasAnySocial) {
        socialLinks.innerHTML = socialHtml;
        socialSection.style.display = "block";
    } else {
        socialSection.style.display = "none";
    }
}

function renderCardPhoto(cardData) {
    // console.log("contactData.cardId: ", contactData.cardId); photo/c/${data.cardId}
    const photoHtml = contactData.hasProfilePhoto
        ? `<img src="/api/profile/photo/c/${contactData.cardId}" alt="${contactData.initials}">`
        : `<span class="span-text">${contactData.initials}</span>`;

    // const photoHtml = `<span class="span-text">${contactData.initials}</span>`;

    $(".profile-avatar").html(photoHtml);
}
// Show/hide sections based on content
function toggleSections() {
    // Address section
    if (contactData.address && contactData.address.trim()) {
        // document.getElementById('addressSection').style.display = 'block';
    }

    // Notes section
    if (contactData.notes && contactData.notes.trim()) {
        document.getElementById("notesSection").style.display = "block";
    }
}

// Track contact interactions
function trackContact(action) {
    fetch(`/api/card/${contactData.cardId}/track/contact/${action}`, {
        method: "POST",
    }).catch(() => { });
}

// Track social media clicks
function trackSocial(platform) {
    fetch(`/api/card/${contactData.cardId}/track/${platform}`, {
        method: "POST",
    }).catch(() => { });
}

// Initialize the page
document.addEventListener("DOMContentLoaded", function () {
    populateContacts();
    populateSocialMedia();
    toggleSections();
    renderCardPhoto();
});
// </script>
