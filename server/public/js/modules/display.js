// modules/display.js
// Display Page & Card Management

import { api } from "../core/api-client.js";
import { getUserProfile } from "../core/auth.js";
import { SOCIAL_ICONS, VALID_SOCIAL_FIELDS } from "../core/config.js";
import { showSuccessMessage, showErrorMessage } from "../ui/notifications.js";
import { updateProfileDisplay, updateNavbarAvatar } from './avatar.js';

function renderCardPhoto(userProfile) {
    // console.log("contactData.cardId: ", contactData.cardId); photo/c/${data.cardId}
    const photoHtml = userProfile.hasProfilePhoto
        ? `<img src="/api/profile/photo/c/${userProfile.cardId}" alt="${userProfile.initials}">`
        : `<span>${userProfile.initials}</span>`;

    $(".profile-avatar").html(photoHtml);
}

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
function displaypopulateContacts(userprofile) {
    const displaycontactSection = document.getElementById("displaycontactSection");
    let contactHtml = "";
    let phonedivhtml = "";
    let contentdivhtml = "";
    if (userprofile.phone && userprofile.phone.trim()) {
        phonedivhtml += `
        <a href="tel:${userprofile.phone}" class="contact-item contact-phone" onclick="trackContact('phone')">
            <div class="contact-icon"><i class="fas fa-phone"></i></div>
            <div class="contact-info">
                <div class="contact-label">Phone</div>
                <div class="contact-value">${userprofile.phone}</div>
            </div>
        </a>
    `;
    }

    if (userprofile.mobile && userprofile.mobile.trim()) {
        phonedivhtml += `
        <a href="tel:${userprofile.mobile}" class="contact-item contact-phone" onclick="trackContact('mobile')">
            <div class="contact-icon"><i class="fas fa-mobile-alt"></i></div>
            <div class="contact-info">
                <div class="contact-label">Mobile</div>
                <div class="contact-value">${userprofile.mobile}</div>
            </div>
        </a>
    `;
    }

    if (userprofile.email && userprofile.email.trim()) {
        contentdivhtml += `
        <a href="mailto:${userprofile.email}" class="contact-item" onclick="trackContact('email')">
            <div class="contact-icon"><i class="fas fa-envelope"></i></div>
            <div class="contact-info">
                <div class="contact-label">Email</div>
                <div class="contact-value">${userprofile.email}</div>
            </div>
        </a>
    `;
    }

    if (userprofile.website && userprofile.website.trim()) {
        const normalizedWebsite = normalizeUrl(userprofile.website);

        contentdivhtml += `
    <a href="${normalizedWebsite}" target="_blank" class="contact-item" onclick="trackContact('website')">
        <div class="contact-icon"><i class="fas fa-globe"></i></div>
        <div class="contact-info">
            <div class="contact-label">Website</div>
            <div class="contact-value">${userprofile.website}</div>
        </div>
    </a>
`;
    }

    // Display location only if country exists and has data
    // Display location only if country exists and has data
    if (
        userprofile.country &&
        userprofile.country.name &&
        userprofile.country.name.trim()
    ) {
        // Build location string
        let locationParts = [];

        if (
            userprofile.city &&
            userprofile.city.name &&
            userprofile.city.name.trim()
        ) {
            locationParts.push(userprofile.city.name);
        }

        if (
            userprofile.state &&
            userprofile.state.name &&
            userprofile.state.name.trim()
        ) {
            locationParts.push(userprofile.state.name);
        }

        locationParts.push(userprofile.country.name);

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
                <div class="contact-label">Location</div>
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
                <div class="contact-label">Location</div>
                <div class="contact-value">${locationString}</div>
            </div>
        </a>
    `;
        }
    }

    phonedivhtml = `<div class='contact-div'>${phonedivhtml}</div>`;
    contentdivhtml = `<div class='othercontact-div'>${contentdivhtml}</div>`;
    displaycontactSection.innerHTML = phonedivhtml + contentdivhtml;
}
async function loadCard(identifier) {
    const container = document.querySelector('.userprofile-dynamic-html');
    container.innerHTML = 'Loading...';
    
    try {
        // const response = await fetch(`/api/card-html/${cardId}`);
        let response = await api.getCardhtmlData(identifier)
        // console.log("getcardhtmldata",response);
        const data = await response;
        
        if (data.success) {
            container.innerHTML = data.html;
        } else {
            container.innerHTML = 'Error: ' + data.message;
        }
    } catch (error) {
        console.log("error:", error.message);
        container.innerHTML = 'Failed to load card';
    }
}

export async function updateDisplayPage() {
    const userProfile = getUserProfile();
    // console.log("userprofile: ", userProfile);
    if (!userProfile) return;

    try {

        await loadCard(userProfile.slug );
        // renderCardPhoto(userProfile)
        // displaypopulateContacts(userProfile)
        // updateNavbarAvatar(userProfile)
        
        // Generate QR code
        if (userProfile.cardId) {

            const friendlyIdentifier = userProfile.slug || userProfile.cardId;
            const standaloneUrl = `${window.location.origin}/card/${friendlyIdentifier}`;
            const qrUrl = await api.getQRCode(friendlyIdentifier);

            document.getElementById("generatedQR").innerHTML = `
                <div class="qr-buttons-heading"><h2>QR For Promotion,Share,Advertise</h2></div>
                <div class="profile-qrcode-div">
                    <div class="profile-qrcode-image-div">
                        <img src="${qrUrl}" alt="QR Code" class="qr-preview" style="border-radius: 10px;">
                        
                    </div>
                    <div class="Download-qrcode-buttons">
                        <button class="profile-card-buttons" id="downloadVCard-btn-dynamic">
                             <i class="fa-regular fa-floppy-disk"></i>
                            Save Contact
                        </button>
                        <button class="profile-card-buttons" id="downloadQRCode-btn-dynamic">
                            <i class="fa-regular fa-address-card"></i>
                            Download Digital Card
                        </button>
                        <button class="profile-card-buttons" id="downloadonlyQRCode-btn-dynamic">
                            <i class="fas fa-qrcode"></i>
                            Download Only QR Code
                        </button>
                        <button class="profile-card-buttons hidden" id="addToWallet-btn">
                            <i class="fas fa-mobile-alt"></i>
                            Add to Wallet
                        </button>
                        <button data-personal-card-url="${standaloneUrl}" class="profile-card-buttons copy-url-btn">
                            <i class="fa-regular fa-copy"></i> Copy Digital Card URL
                        </button>
                    </div>
                </div>
                
                
            `;
        }

        $("#navbarAvatar").show();
        $("#navbarAvatarDesktop").show();
        $(".card-actions").appendTo("#Download-qrcode-buttons");

        // updateStandalonePage();
    } catch (error) {
        console.error("Update display error:", error);
    }
}

export async function trackSocialClick(platform) {
    const userProfile = getUserProfile();
    if (userProfile && userProfile.cardId) {
        await api.trackSocialClick(userProfile.cardId, platform);
    }
}

export async function trackContactClick(action) {
    const userProfile = getUserProfile();
    if (userProfile && userProfile.cardId) {
        await api.trackContactClick(userProfile.cardId, action);
    }
}

export async function downloadVCard() {
    try {
        const userProfile = getUserProfile();
        if (userProfile && userProfile.cardId) {
            await api.downloadVCard(userProfile.cardId);
            showSuccessMessage("vCard download started!");
        }
    } catch (error) {
        console.error("vCard download error:", error);
        showErrorMessage("Failed to download vCard");
    }
}

/**
 * New way to download QR code
 */

/**
 * Fixed Wallet Card Downloader - No Empty Canvas Space
 * This version calculates proper dimensions automatically
 */

async function downloadWalletCardFixed(cardId, fileName = null) {
    try {
        showSuccessMessage("Preparing wallet card...");

        // 1. Fetch card data
        const response = await fetch(
            `${api.baseURL}/api/card/${cardId}/wallet-card-data`
        );
        const result = await response.json();

        if (!result.success) {
            throw new Error(result.message || "Failed to fetch card data");
        }

        const cardData = result.data;

        // 2. Create HTML with proper sizing
        const html = createWalletCardHTML(cardData);
        // $(".qr-container").append(html);
        // 3. Create temporary container
        const container = document.createElement("div");
        container.style.position = "absolute";
        container.style.left = "-9999px";
        container.style.top = "0";
        // container.style.visibility = "hidden";
        container.style.opacity = "0";
        container.style.pointerEvents = "none";
        container.innerHTML = html;
        document.body.appendChild(container);

        // 4. Wait for images to load
        await waitForImages(container);

        // 5. Get actual element
        const element = container.querySelector(".digital-wallet-card");

        // Force layout calculation
        element.style.display = "block";
        const computedStyle = window.getComputedStyle(element);

        // 6. Convert to image with auto dimensions
        const blob = await convertToImageAuto(element);

        // 7. Download
        const downloadFileName =
            fileName || `${cardData.name.replace(/\s+/g, "-")}-WalletCard.png`;
        downloadBlobAsFile(blob, downloadFileName);

        // 8. Cleanup
        document.body.removeChild(container);

        showSuccessMessage("Wallet card downloaded successfully!");
    } catch (error) {
        console.error("Wallet card download error:", error);
        showErrorMessage("Failed to download wallet card: " + error.message);
        throw error;
    }
}

function escapeHtml(text) {
    if (!text) return "";
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}
// Function to create wallet card HTML
function createWalletCardHTML(data) {
    const fullQrUrl = `${api.baseURL}${data.qrUrl}`;
    const fullCardUrl = `${api.baseURL}${data.cardUrl}`;
    const profilePhotoUrl = data.cardId
        ? `${api.baseURL}/api/profile/photo/c/${data.cardId}`
        : null;
    let avatarHTML = "";
    if (data.hasProfilePhoto) {
        // Card has a profile photo - show image with fallback to initials on error
        const profilePhotoUrl = `${api.baseURL}/api/profile/photo/c/${data.cardId}`;
        avatarHTML = `<div class="wallet-card-avatar-overlap"><img src="${profilePhotoUrl}" 
                           alt="${escapeHtml(data.name)}" 
                           crossorigin="anonymous"
                           onerror="this.style.display='none'; this.parentElement.innerHTML='<span>${data.initials}</span>';"></div>`;
    } else {
        // No profile photo - show initials directly
        avatarHTML = ` <div class="wallet-card-avatar-download"><span>${data.initials}</span></div>`;
    }

    let cardNametoDisplay = escapeHtml(data.name);
    if(escapeHtml(data.organization)){
        cardNametoDisplay = escapeHtml(data.organization);
    }
    return `<div class="digital-wallet-card" data-card-id="g0czadibq">
      
            
    <!-- Colored Header Section -->
    <div class="wallet-card-header-section">
        <div class="wallet-card-brand-name">${cardNametoDisplay}</div>
       
            ${avatarHTML}
       
        <!-- Overlapping Profile Photo -->
        
    </div>
    
    <!-- Content Section -->
    <div class="wallet-card-content">
        <div class="empty-div"><div class="wallet-qr-top-container">
            <img src="/card/${escapeHtml(data.slug)}/qr" alt="QR Code for ${escapeHtml(data.name)}">
        </div></div>
        <div class="actual-content">
        <div class="wallet-card-name">${escapeHtml(data.name)}</div>
        
        <div class="wallet-card-email"><a href="mailto:${escapeHtml(data.email)}" class="wallet-display-email" title="Email">${escapeHtml(data.email)}</a></div>
  
        </div>
    </div>
    
    <div class="digital-card-action-btn-style">
        <div class="logo">
            <img src="./image/app-logo.png" alt="QRprofile Logo" class="card-logo-image-only">
        </div>
        <span>PoweredBy:${window.location.href} </span>
    </div>
 </div>`

}

/**
 * Convert element to image with automatic dimensions
 */
async function convertToImageAuto(element) {
    if (typeof html2canvas === "undefined") {
        throw new Error("html2canvas library is not loaded");
    }

    // Get element's actual dimensions
    const rect = element.getBoundingClientRect();

    console.log("Element dimensions:", {
        width: rect.width,
        height: rect.height,
    });

    // Create canvas with proper dimensions
    const canvas = await html2canvas(element, {
        backgroundColor: "#ffffff", // White background instead of null
        scale: 2,
        useCORS: true,
        allowTaint: false,
        logging: true, // Enable for debugging
        imageTimeout: 15000,
        width: element.offsetWidth, // Explicit dimensions
        height: element.offsetHeight + 20,
        windowWidth: element.offsetWidth,
        windowHeight: element.offsetHeight,
    });

    console.log("Canvas dimensions:", {
        width: canvas.width,
        height: canvas.height,
    });

    return new Promise((resolve) => {
        canvas.toBlob(resolve, "image/png", 1.0);
    });
}

/**
 * Download blob as file
 */
function downloadBlobAsFile(blob, fileName) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

function waitForImages(container) {
    const images = container.querySelectorAll("img");
    console.log(`Waiting for ${images.length} images to load...`);

    const promises = Array.from(images).map((img, index) => {
        return new Promise((resolve) => {
            if (img.complete && img.naturalHeight !== 0) {
                console.log(`Image ${index} already loaded:`, img.src);
                resolve();
            } else {
                img.onload = () => {
                    console.log(`Image ${index} loaded:`, img.src);
                    resolve();
                };
                img.onerror = (error) => {
                    console.warn(`Image ${index} failed to load:`, img.src, error);
                    // Create a fallback colored div for failed images
                    img.style.display = "none";
                    resolve(); // Continue anyway
                };

                // Timeout after 10 seconds
                setTimeout(() => {
                    console.warn(`Image ${index} load timeout:`, img.src);
                    resolve();
                }, 10000);
            }
        });
    });

    return Promise.all(promises);
}
// New function stylish QRcode
export async function downloadQRCode() {
    try {
        const userProfile = getUserProfile();
        if (userProfile && userProfile.cardId) {
            console.log("Inside new download QR code function: ", userProfile.cardId);
            // Use the new wallet card download
            //   await downloadWalletCard(userProfile.cardId);
            await downloadWalletCardFixed(userProfile.cardId);
        }
    } catch (error) {
        console.error("QR download error:", error);
        showErrorMessage("Failed to download QR code");
    }
}
export async function downloadStyledQRCard() {
    try {
        // console.log("Inside function");
        const userProfile = getUserProfile();
        const qrcodeurl = await api.getQRCode(userProfile.slug);
        const response = await fetch(qrcodeurl);
        // console.log("response", response);

        // Create a blob from the response
        const blob = await response.blob();

        // Create a temporary URL for the blob
        const url = window.URL.createObjectURL(blob);

        // Create a temporary anchor element to trigger download
        const a = document.createElement("a");
        a.href = url;
        a.download = `qr-${userProfile.slug}.png`; // Set the filename
        document.body.appendChild(a);
        a.click();

        // Cleanup
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        console.log("QR code downloaded successfully");
    } catch (error) {
        console.error("Styled QR card download error:", error);
        showErrorMessage("Failed to download styled QR card");
    }
}
