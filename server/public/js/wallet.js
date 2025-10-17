// public/js/wallet.js
import { showSuccessMessage, showErrorMessage } from './ui/notifications.js';
import { api } from './core/api-client.js';
// Wallet API functions
const walletAPI = {
    // Get all cards in wallet
    async getWallet() {
        try {
            const response = await fetch("/api/wallet", {
                credentials: "include",
            });
            return await response.json();
        } catch (error) {
            console.error("Error fetching wallet:", error);
            return { success: false, message: "Failed to fetch wallet" };
        }
    },

    // Add card to wallet
    async addCard(cardId) {
        try {
            const response = await fetch(`/api/wallet/add/${cardId}`, {
                method: "POST",
                credentials: "include",
            });
            return await response.json();
        } catch (error) {
            console.error("Error adding card to wallet:", error);
            return { success: false, message: "Failed to add card" };
        }
    },

    // Remove card from wallet
    async removeCard(cardId) {
        try {
            const response = await fetch(`/api/wallet/remove/${cardId}`, {
                method: "DELETE",
                credentials: "include",
            });
            return await response.json();
        } catch (error) {
            console.error("Error removing card from wallet:", error);
            return { success: false, message: "Failed to remove card" };
        }
    },

    // Check if card is in wallet
    async checkCard(cardId) {
        try {
            const response = await fetch(`/api/wallet/check/${cardId}`, {
                credentials: "include",
            });
            return await response.json();
        } catch (error) {
            console.error("Error checking wallet:", error);
            return { success: false, inWallet: false };
        }
    },
};

// Attach event listeners to wallet card buttons using event delegation
function attachWalletCardListeners() {
    const container = document.getElementById("walletCardsContainer");
    if (!container) return;

    // Remove existing event listener to avoid duplicates
    const newContainer = container.cloneNode(true);
    container.parentNode.replaceChild(newContainer, container);

    // Use event delegation - ONE listener on parent handles ALL buttons
    newContainer.addEventListener("click", async function(e) {
        // Check if clicked element is a share button
        if (e.target.closest(".shareWalletCardlink")) {
            const btn = e.target.closest(".shareWalletCardlink");
            const cardId = btn.getAttribute("data-cardid");
            const cardName = btn.getAttribute("data-cardname");
            const cardSlug = btn.getAttribute("data-slug");
            // console.log("Share clicked - cardId:", cardId, "cardName:", cardName);
            await shareWalletCard(cardSlug, cardName);
        }
        
        // Check if clicked element is a remove button
        if (e.target.closest(".removecardFromWallet")) {
            const btn = e.target.closest(".removecardFromWallet");
            const cardId = btn.getAttribute("data-cardid");
            const cardName = btn.getAttribute("data-cardname");
            // console.log("Remove clicked - cardId:", cardId, "cardName:", cardName);
            await removeFromWallet(cardId, cardName);


        }
    });
}

// Load and display wallet cards
async function loadWalletCards() {
    const container = document.getElementById("walletCardsContainer");
    const emptyMessage = document.getElementById("emptyWalletMessage");

    if (!container) return;

    // Show loading
    container.innerHTML =
        '<div style="text-align: center; padding: 2rem; color: white;"><i class="fas fa-spinner fa-spin" style="font-size: 2rem;"></i><p>Loading wallet...</p></div>';

    const result = await walletAPI.getWallet();

    if (!result.success || !result.wallet || result.wallet.cards.length === 0) {
        container.innerHTML = "";
        emptyMessage.style.display = "block";
        return;
    }

    emptyMessage.style.display = "none";

    // Render wallet cards
    container.innerHTML = result.wallet.cards
        .map((card) => createWalletCardHTML(card))
        .join("");
    
    // Attach event listeners AFTER rendering cards
    attachWalletCardListeners();
}


// Create HTML for a single wallet card (KEEPING YOUR FORMAT)
function createWalletCardHTML(card) {
    const initials = getInitials(card.name);
    const addedDate = new Date(card.addedAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });

    console.log("card image url:", card.profileImage.url);
    // Determine if card has profile photo
    
    let avatarHTML;
    
    if (card.hasProfilePhoto) {
        // Card has a profile photo - show image with fallback to initials on error
        const profilePhotoUrl = `${api.baseURL}/api/profile/photo/c/${card.cardId}`;
        avatarHTML = `<img src="${profilePhotoUrl}" 
                           alt="${escapeHtml(card.name)}" 
                           crossorigin="anonymous"
                           onerror="this.style.display='none'; this.parentElement.innerHTML='<span>${initials}</span>';">`;
    } else {
        // No profile photo - show initials directly
        avatarHTML = `<span>${initials}</span>`;
    }

    // Extract company/organization name (if available from profileId)
    const companyName = card.organization || "";

    // Extract title (if available)
    const title = card.title || "";
    

    return `
        <div class="digital-wallet-card" data-card-id="${escapeHtml(card.slug)}" data-cardid="${escapeHtml(card.cardId)}">
      
            
            <!-- Colored Header Section -->
            <div class="wallet-card-header-section">
                <div class="wallet-card-brand-name">${escapeHtml(card.organization)}</div>
                <div class="wallet-qr-top-container">
                    <img src="/card/${escapeHtml(card.slug)}/qr" alt="QR Code for ${escapeHtml(card.name)}">
                </div>
                <!-- Overlapping Profile Photo -->
                <div class="wallet-card-avatar-overlap">
                    ${avatarHTML}
                </div>
            </div>
            
            <!-- Content Section -->
            <div class="wallet-card-content">
                <div class="empty-div"></div>
                <div class="actual-content">
                <div class="wallet-card-name">${escapeHtml(card.name)}</div>
                ${title ? `<div class="wallet-card-title">${escapeHtml(title)}</div>` : ""}
                <div class="wallet-card-email"><a href="mailto:${escapeHtml(card.email)}" class="wallet-display-email" title="Email">${escapeHtml(card.email)}</a></div>
          
                </div>
            </div>
            
            <!-- Contact Icons -->
            <div class="wallet-card-contacts">
                ${card.email ? `<a href="mailto:${escapeHtml(card.email)}" class="wallet-contact-icon-btn" title="Email"><i class="fas fa-envelope"></i></a>` : ""}
                ${card.phone ? `<a href="tel:${escapeHtml(card.phone)}" class="wallet-contact-icon-btn" title="Call"><i class="fas fa-phone"></i></a>` : ""}
                ${card.phone ? `<a href="sms:${escapeHtml(card.phone)}" class="wallet-contact-icon-btn" title="Message"><i class="fas fa-sms"></i></a>` : ""}
                <a href="/card/${escapeHtml(card.slug)}" target="_blank" class="wallet-contact-icon-btn" title="View Card"><i class="fas fa-address-card"></i></a>
            </div>
            
            <!-- Action Buttons - KEEPING YOUR FORMAT -->
            <div class="wallet-card-actions">
                <a href="/card/${escapeHtml(card.slug)}" target="_blank" class="wallet-action-btn primary">
                    <i class="fas fa-eye"></i> View
                </a>
                <button class="wallet-action-btn primary shareWalletCardlink" data-cardid="${escapeHtml(card.cardId)}" data-slug="${escapeHtml(card.slug)}" data-cardname="${escapeHtml(card.name)}">
                    <i class="fas fa-share-alt"></i> Share
                </button>
                <button class="wallet-action-btn danger removecardFromWallet" data-cardid="${escapeHtml(card.cardId)}" data-slug="${escapeHtml(card.slug)}" data-cardname="${escapeHtml(card.name)}">
                    <i class="fas fa-trash"></i> Remove
                </button>
            </div>
            
            <div class="wallet-card-added-date">
                Added ${addedDate}
            </div>
        </div>
    `;
}

// Escape HTML to prevent XSS attacks
function escapeHtml(text) {
    if (!text) return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.toString().replace(/[&<>"']/g, m => map[m]);
}

// Get initials from name
function getInitials(name) {
    if (!name) return "U";
    const names = name.trim().split(" ");
    if (names.length >= 2) {
        return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
}

// Remove card from wallet
async function removeFromWallet(cardId, cardName) {
    if (!confirm(`Are you sure you want to remove ${cardName} from your wallet?`)) {
        return;
    }

    const result = await walletAPI.removeCard(cardId);

    if (result.success) {
        showSuccessMessage("Card removed from wallet");
        const cardIdtoremove = cardId;
        $(`[data-cardid="${cardIdtoremove}"]`).remove();
        // Remove card from DOM with animation
        const cardElement = document.querySelector(`[data-card-id="${cardId}"]`);
        if (cardElement) {
            cardElement.style.transition = "opacity 0.3s ease, transform 0.3s ease";
            cardElement.style.opacity = "0";
            cardElement.style.transform = "scale(0.9)";
            setTimeout(() => {
                cardElement.remove();
                // Check if wallet is now empty
                const remainingCards = document.querySelectorAll(".digital-wallet-card");
                if (remainingCards.length === 0) {
                    document.getElementById("emptyWalletMessage").style.display = "block";
                }
            }, 300);
        }
    } else {
        showErrorMessage(result.message || "Failed to remove card from wallet");
    }
}

// Share wallet card
function shareWalletCard(cardSlug, cardName) {
    const cardUrl = `${window.location.origin}/card/${cardSlug}`;

    if (navigator.share) {
        navigator.share({
            title: `${cardName}'s Digital Card`,
            text: `Check out ${cardName}'s digital business card`,
            url: cardUrl,
        })
        .then(() => {
            console.log('Share successful');
        })
        .catch((error) => {
            if (error.name === "AbortError") {
                // User cancelled - do nothing
                console.log('Share cancelled');
            } else {
                // Share failed - fallback to copy
                console.error("Share failed:", error);
                copyToClipboard(cardUrl);
            }
        });
    } else {
        // Browser doesn't support Web Share API
        copyToClipboard(cardUrl);
    }
}

// Copy to clipboard helper
function copyToClipboard(text) {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();

    try {
        document.execCommand("copy");
        showSuccessMessage("Link copied to clipboard!");
    } catch (error) {
        console.error("Failed to copy:", error);
        alert(`Copy this link: ${text}`);
    }

    document.body.removeChild(textarea);
}

// Check and handle pending wallet card after login
async function handlePendingWalletCard() {
    const pendingCardId = sessionStorage.getItem("pendingWalletCard");
    const redirectToWallet = sessionStorage.getItem("redirectToWallet");

    if (pendingCardId && redirectToWallet) {
        // Clear session storage
        sessionStorage.removeItem("pendingWalletCard");
        sessionStorage.removeItem("redirectToWallet");

        // Add the card to wallet
        const result = await walletAPI.addCard(pendingCardId);

        if (result.success) {
            // Show wallet page
            showPage("wallet");
            showSuccessMessage("Card added to your wallet successfully!");
        } else {
            showErrorMessage(result.message || "Failed to add card to wallet");
        }
    }
}

// Initialize wallet button click handler (SIMPLIFIED)
function initializeWalletButton() {
    const walletBtn = document.getElementById("walletBtn");
    const walletBtnMobile = document.getElementById("walletBtnMobile");
    
    if (walletBtn) {
        walletBtn.addEventListener("click", async () => {
            showPage("wallet");
            await loadWalletCards();
            // Event listeners are now attached in loadWalletCards()
        });
    }

    if (walletBtnMobile) {
        walletBtnMobile.addEventListener("click", async () => {
            showPage("wallet");
            await loadWalletCards();
            // Event listeners are now attached in loadWalletCards()
        });
    }
}

// Export functions for use in other files
if (typeof window !== "undefined") {
    window.walletAPI = walletAPI;
    window.loadWalletCards = loadWalletCards;
    window.removeFromWallet = removeFromWallet;
    window.shareWalletCard = shareWalletCard;
    window.handlePendingWalletCard = handlePendingWalletCard;
    window.initializeWalletButton = initializeWalletButton;
    window.attachWalletCardListeners = attachWalletCardListeners;
}