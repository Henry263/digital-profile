// modules/display.js
// Display Page & Card Management

import { api } from '../core/api-client.js';
import { getUserProfile } from '../core/auth.js';
import { SOCIAL_ICONS, VALID_SOCIAL_FIELDS } from '../core/config.js';
import { showSuccessMessage, showErrorMessage } from '../ui/notifications.js';

export async function updateDisplayPage() {
    const userProfile = getUserProfile();
    if (!userProfile) return;

    try {
        const socialContainer = document.getElementById("socialLinksDisplay");
        socialContainer.innerHTML = "";

        // Update basic info
        document.getElementById("displayName").textContent = userProfile.name;
        document.getElementById("displayTitle").textContent = userProfile.title;
        document.getElementById("displayOrganization").textContent = userProfile.organization;
        document.getElementById("displayEmail").textContent = userProfile.email;
        document.getElementById("displayAddress").textContent = userProfile.address;

        // Update mobile contact
        if (userProfile.mobile) {
            $("#displayPhoneLink").attr("href", `tel:${userProfile.mobile}`).show();
            $("#displayMessageLink").attr("href", `sms:${userProfile.mobile}`).show();
            document.getElementById("displayPhoneLink").querySelector(".method-value").textContent = userProfile.mobile;
            document.getElementById("displayMessageLink").querySelector(".method-value").textContent = userProfile.mobile;
        } else {
            $("#displayPhoneLink").hide();
            $("#displayMessageLink").hide();
        }

        // Update email and website
        document.getElementById("displayEmailLink").href = `mailto:${userProfile.email}`;
        document.getElementById("displayEmail").textContent = userProfile.email;

        document.getElementById("displayWebsite").href = userProfile.website;
        document.getElementById("displayWebsite").querySelector(".method-value").textContent = 
            userProfile.website.replace("https://", "").replace("http://", "");

        // Add social media links
        VALID_SOCIAL_FIELDS.forEach((platform) => {
            let url = userProfile.socialMedia && userProfile.socialMedia[platform];
            if (url && typeof url === "string" && url.trim() && url.trim() !== "") {
                const socialItem = document.createElement("div");
                socialItem.className = "contact-detail";
                if (!url.startsWith("http://") && !url.startsWith("https://")) {
                    url = "https://" + url;
                }

                socialItem.innerHTML = `
                    <span>${SOCIAL_ICONS[platform] || '<i class="fas fa-link"></i>'}</span>
                    <a href="${url}" target="_blank" class="contact-link" onclick="trackSocialClick('${platform}')">
                        ${platform.charAt(0).toUpperCase() + platform.slice(1)}
                    </a>
                `;
                socialContainer.appendChild(socialItem);
            }
        });

        // Generate QR code
        if (userProfile.cardId) {
            const friendlyIdentifier = userProfile.slug || userProfile.cardId;
            const standaloneUrl = `${window.location.origin}/card/${friendlyIdentifier}`;
            const qrUrl = await api.getQRCode(friendlyIdentifier);

            document.getElementById("generatedQR").innerHTML = `
                <div class="profile-qrcode-div">
                    <div class="profile-qrcode-image-div">
                        <img src="${qrUrl}" alt="QR Code" class="qr-preview" style="border-radius: 10px;">
                        <p style="font-size: 0.9rem; color: #666; margin-top: 0.5rem;">Scan to view card</p>
                    </div>
                    <div class="Download-qrcode-buttons">
                        <button class="profile-card-buttons" id="downloadVCard-btn-dynamic">
                            <i class="fas fa-download"></i>
                            Save Contact
                        </button>
                        <button class="profile-card-buttons" id="downloadQRCode-btn-dynamic">
                            <i class="fas fa-qrcode"></i>
                            Download QR Code
                        </button>
                        <button class="profile-card-buttons hidden" id="addToWallet-btn">
                            <i class="fas fa-mobile-alt"></i>
                            Add to Wallet
                        </button>
                    </div>
                </div>
                
                <div class="standalone-url-section" style="margin-top: 1rem; padding: 1rem; background: #f8f9fa; border-radius: 8px;">
                    <h4 style="font-size: 0.9rem; color: #333; margin-bottom: 0.5rem;">🔗 Share Your Card</h4>
                    <div class="url-container" style="display: flex; align-items: center; gap: 0.5rem;">
                        <p style="font-size: 0.75rem; color: #666; margin-top: 0.5rem; margin-bottom: 0;">
                            ${standaloneUrl ? `Your personalized URL: ${standaloneUrl}` : "Share this link or QR code with others"}
                        </p>
                        <button data-personal-card-url="${standaloneUrl}" class="copy-url-btn" 
                                style="padding: 0.5rem 1rem; background: #667eea; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.8rem; white-space: nowrap; width: 100%;">
                            📋 Copy
                        </button>
                    </div>
                </div>
            `;
        }

        $("#navbarAvatar").show();
        $("#navbarAvatarDesktop").show();
        $(".card-actions").appendTo("#Download-qrcode-buttons");

        updateStandalonePage();
    } catch (error) {
        console.error("Update display error:", error);
    }
}


export function updateStandalonePage() {
    const userProfile = getUserProfile();
    if (!userProfile) return;

    document.getElementById("standaloneName").textContent = userProfile.name;
    document.getElementById("standaloneTitle").textContent = userProfile.title;
    document.getElementById("standaloneOrganization").textContent = userProfile.organization;
    document.getElementById("standaloneEmail").textContent = userProfile.email;
    document.getElementById("standaloneAddress").textContent = userProfile.address;

    document.getElementById("standalonePhone").href = `tel:${userProfile.phone}`;
    document.getElementById("standalonePhone").querySelector("span:last-child").textContent = userProfile.phone;
    document.getElementById("standaloneMessage").href = `sms:${userProfile.mobile}`;
    document.getElementById("standaloneWebsiteLink").href = userProfile.website;
    document.getElementById("standaloneWebsite").textContent = 
        userProfile.website.replace("https://", "").replace("http://", "");

    const standaloneSocialContainer = document.getElementById("standaloneSocialLinks");
    standaloneSocialContainer.innerHTML = "";

    const socialIcons = {
        instagram: "📷", facebook: "📘", twitter: "🦆",
        calendly: "📅", zoom: "💼", snapchat: "👻",
        tiktok: "🎵", linkedin: "💼"
    };

    Object.keys(userProfile.socialMedia || {}).forEach((platform) => {
        const url = userProfile.socialMedia[platform];
        if (url) {
            const socialItem = document.createElement("a");
            socialItem.className = "standalone-social-item";
            socialItem.href = url;
            socialItem.target = "_blank";
            socialItem.innerHTML = `
                <span class="social-icon">${socialIcons[platform]}</span>
                <span>${platform}</span>
            `;
            standaloneSocialContainer.appendChild(socialItem);
        }
    });
}

export async function loadStandaloneCard() {
    const urlParams = new URLSearchParams(window.location.search);
    const cardId = urlParams.get("card");

    if (cardId) {
        try {
            const response = await api.getPublicCard(cardId);

            if (response.success) {
                updateStandalonePageWithData(response.card);
                return true;
            }
        } catch (error) {
            console.error("Load standalone card error:", error);
            document.getElementById("standalonePage").innerHTML = `
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
    document.getElementById("standaloneName").textContent = cardData.name;
    document.getElementById("standaloneTitle").textContent = cardData.title;
    document.getElementById("standaloneOrganization").textContent = cardData.organization;
    document.getElementById("standaloneEmail").textContent = cardData.email;
    document.getElementById("standaloneAddress").textContent = cardData.address;

    document.getElementById("standalonePhone").href = `tel:${cardData.phone}`;
    document.getElementById("standalonePhone").querySelector("span:last-child").textContent = cardData.phone;
    document.getElementById("standaloneMessage").href = `sms:${cardData.mobile}`;
    document.getElementById("standaloneWebsiteLink").href = cardData.website;
    document.getElementById("standaloneWebsite").textContent = 
        cardData.website.replace("https://", "").replace("http://", "");

    const standaloneSocialContainer = document.getElementById("standaloneSocialLinks");
    standaloneSocialContainer.innerHTML = "";

    const socialIcons = {
        instagram: "📷", facebook: "📘", twitter: "🦆",
        linkedin: "💼", calendly: "📅", zoom: "💼",
        snapchat: "👻", tiktok: "🎵"
    };

    Object.keys(cardData.socialMedia || {}).forEach((platform) => {
        const url = cardData.socialMedia[platform];
        if (url) {
            const socialItem = document.createElement("a");
            socialItem.className = "standalone-social-item";
            socialItem.href = url;
            socialItem.target = "_blank";
            socialItem.onclick = () => api.trackSocialClick(cardData.cardId, platform);
            socialItem.innerHTML = `
                <span class="social-icon">${socialIcons[platform]}</span>
                <span>${platform}</span>
            `;
            standaloneSocialContainer.appendChild(socialItem);
        }
    });

    window.currentCardData = cardData;
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

export async function downloadQRCode() {
    try {
        const userProfile = getUserProfile();
        if (userProfile && userProfile.cardId) {
            const friendlyIdentifier = userProfile.slug || userProfile.cardId;
            const qrUrl = await api.getQRCode(friendlyIdentifier);

            const link = document.createElement("a");
            link.href = qrUrl;
            link.download = `${userProfile.name}-QRCode.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            showSuccessMessage("QR Code downloaded!");
        }
    } catch (error) {
        console.error("QR download error:", error);
        showErrorMessage("Failed to download QR code");
    }
}

export async function downloadStyledQRCard() {
    try {
        const userProfile = getUserProfile();
        if (userProfile && (userProfile.slug || userProfile.cardId)) {
            const identifier = userProfile.slug || userProfile.cardId;
            const styledQrUrl = await api.getstyledQRCode(identifier);

            const response = await fetch(styledQrUrl);
            if (!response.ok) {
                throw new Error("Download failed");
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);

            const link = document.createElement("a");
            link.href = url;
            link.download = `${userProfile.name.replace(/\s+/g, "-")}-QR-Card.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            window.URL.revokeObjectURL(url);
            showSuccessMessage("Styled QR Card downloaded!");
        }
    } catch (error) {
        console.error("Styled QR card download error:", error);
        showErrorMessage("Failed to download styled QR card");
    }
}
// Continued in Part 2...