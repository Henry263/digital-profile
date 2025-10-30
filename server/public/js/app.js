// app.js
// Main Application Entry Point

// Core imports
import { api } from './core/api-client.js';

import './vertical-navigation.js';
import {
    setCurrentUser,
    setUserProfile,
    getCurrentUser,
    loginWithGoogle,
    signupWithGoogle,
    logout,
    updateAuthUI,
    updateAuthUImobilebuttons
} from './core/auth.js';

// Module imports
import { handleProfileSave, loadProfileData, handleQRUpload } from './modules/profile.js';
import {
    updateDisplayPage,
    downloadVCard,
    downloadQRCode,
    downloadStyledQRCard
} from './modules/display.js';
import { addToWallet } from './modules/wallet.js';
import { validateForm, initializeFormValidation } from './modules/form-validation.js';
import { initializeAvatarHandlers } from './modules/avatar.js';

// UI imports
import { showPage, handleURLParams } from './ui/navigation.js';
import { showSuccessMessage, showErrorMessage, scrollToFirstError } from './ui/notifications.js';
import { initializeModals } from './ui/modals.js';

// Form imports
import { initializeSuggestionsForm } from './forms/suggestions.js';
import { initializeContactForm } from './forms/contact.js';

// Utils
import { setUserEmail, copyStandaloneUrl } from './utils/helpers.js';


import './init-avatar.js';
import './countries-autocomplete.js';
import './wallet.js';

// Initialize event handlers
function initializeEventHandlers() {
    // Navigation buttons
    $("#signupWithGoogle-btn").on("click", signupWithGoogle);
    $("#singup-cta-button").on("click", () => showPage("signup"));
    $("#singup-cta-button-uc").on("click", () => showPage("signup"));
    $("#signupBtn").on("click", () => showPage("signup"));
    $("#faqBtn").on("click", () => showPage("faq"));
    $("#usecaseBtn").on("click", () => showPage("usecase"));
    $("#homepage-signup").on("click", () => showPage("signup"));
    $(".signupbutton").on("click", () => showPage("signup"));
    $(".homebutton").on("click", () => showPage("home"));
    $(".profilebutton").on("click", () => showPage("home"));
    $("#loginBtn").on("click", () => showPage("login"));
    $("#displayBtn").on("click", () => showPage("display"));
    $("#profileBtn").on("click", () => showPage("profile"));
    $("#logoutBtn").on("click", logout);
    $("#googlesignin-button").on("click", loginWithGoogle);

    // Card actions
    $("#qr-upload-div").on("click", () => document.getElementById("qrUpload").click());
    $("#downloadVCard-btn").on("click", downloadVCard);
    $("#shareCard-btn").on("click", copyStandaloneUrl);
    $("#addToWallet-btn").on("click", addToWallet);

    // Button which are available on my card page.
    $("#downloadQRCode-btn").on("click", downloadQRCode);

    // Dynamic buttons (delegated)
    // $(document).on("click", "#downloadQRCode-btn-dynamic", downloadStyledQRCard);
    $(document).on("click", "#downloadQRCode-btn-dynamic", downloadQRCode);
    $(document).on("click", "#downloadonlyQRCode-btn-dynamic", downloadStyledQRCard);

    $(document).on("click", "#downloadVCard-btn-dynamic", downloadVCard);
    $(document).on("click", ".copy-url-btn", copyStandaloneUrl);

    // Profile form
    $(".save-btn").on("click", function (e) {
        e.preventDefault();

        if (validateForm()) {
            handleProfileSave();
        } else {
            scrollToFirstError();
            showErrorMessage("Please fix the errors before saving");
        }
    });

    // Mobile menu toggle
    $("#hamburgerMenu").on("click", function () {
        $(this).toggleClass("active");
        $("#mobileMenu").toggleClass("active");
        $("body").toggleClass("menu-open");
    });

    // Close mobile menu when clicking outside
    $(document).on("click", function (event) {
        if (!$(event.target).closest(".mobile-menu, .hamburger-menu").length) {
            $("#hamburgerMenu").removeClass("active");
            $("#mobileMenu").removeClass("active");
            $("body").removeClass("menu-open");
        }
    });

    // Mobile menu buttons - ALL buttons
    $(".mobile-menu-btn.homebutton").on("click", function () {
        $(".homebutton").first().click();
        closeMobileMenu();
    });

    $("#loginBtnMobile").on("click", () => {
        $("#loginBtn").click();
        closeMobileMenu();
    });

    $("#signupBtnMobile").on("click", () => {
        $("#signupBtn").click();
        closeMobileMenu();
    });

    $("#profileBtnMobile").on("click", () => {
        $("#profileBtn").click();
        closeMobileMenu();
    });

    $("#displayBtnMobile").on("click", () => {
        $("#displayBtn").click();
        closeMobileMenu();
    });

    $("#walletBtnMobile").on("click", () => {
        $("#walletBtn").click();
        closeMobileMenu();
    });

    $("#usecaseBtnMobile").on("click", () => {
        $("#usecaseBtn").click();
        closeMobileMenu();
    });

    $("#faqBtnMobile").on("click", () => {
        $("#faqBtn").click();
        closeMobileMenu();
    });

    $("#logoutBtnMobile").on("click", () => {
        $("#logoutBtn").click();
        closeMobileMenu();
    });

    // Helper function
    function closeMobileMenu() {
        $("#hamburgerMenu").removeClass("active");
        $("#mobileMenu").removeClass("active");
        $("body").removeClass("menu-open");
    }
}

// Initialize application
async function initializeApplication() {
    console.log("🚀 Application starting...");

    // Initialize wallet button if exists
    if (typeof initializeWalletButton === "function") {
        initializeWalletButton();
    }

    // Check standalone mode first
    // const isStandalone = await checkStandaloneMode();

    // if (!isStandalone) {
        try {
            const response = await api.getUserWithProfile();

            if (response.success && response.authenticated) {
                // console.log('✅ User authenticated', response.user);

                // Set user data
                // currentUser = response.user;
                setCurrentUser(response.user);
                
               
                // Set profile data if exists
                if (response.profile) {
                    // userProfile = response.profile;
                    setUserProfile(response.profile);
                    // console.log('✅ Profile loaded');
                    setUserEmail(response.profile.email);
                    $("#navbarAvatar").show();
                    $("#navbarAvatarDesktop").show();
                    showPage("display");
                    $("#footer-cta").addClass("display-none-cta-button");
                    $("#singup-cta-button-div-uc").addClass("display-none-cta-button");

                    // Handle pending wallet card if available
                    if (typeof handlePendingWalletCard === 'function') {
                        await handlePendingWalletCard();
                    }

                    handleURLParams();
                } else {
                    showPage("profile");
                }

                // Update UI
                updateAuthUI();
                updateAuthUImobilebuttons();

                // Show appropriate page
                const urlParams = new URLSearchParams(window.location.search);
                const requestedPage = urlParams.get('page');

                if (requestedPage) {
                    showPage(requestedPage);
                } else if (response.profile) {
                    showPage('display'); // or whatever your default page is
                } else {
                    showPage('profile'); // No profile, show profile creation
                }

                // Handle OAuth callback success
                if (urlParams.get('auth') === 'success') {
                    showSuccessMessage('Successfully logged in!');
                    window.history.replaceState({}, document.title, window.location.pathname);
                }

            } else {
                // Not authenticated
                console.log('ℹ️ User not authenticated');
                currentUser = null;
                userProfile = null;
                updateAuthUI();
                showPage('home');
            }

            // console.log('✅ Application initialized');
            // ============
            // Old Code

            // const isAuthenticated = await api.checkAuthStatus();
            // console.log("isAuthenticated: ", isAuthenticated);
            // if (isAuthenticated) {
            //     try {
            //         const user = await api.getCurrentUser();
            //         console.log("user: ", user);
            //         if (user.success) {
            //             setCurrentUser(user.user);
            //             updateAuthUI();
            //             updateAuthUImobilebuttons();

            //             const profileResponse = await api.getProfile();

            //             if (profileResponse.success && profileResponse.profile) {
            //                 $(".profile-photo-section").show();
            //                 await loadProfileData();
            //                 setUserEmail(user.user.email);
            //                 $("#navbarAvatar").show();
            //                 $("#navbarAvatarDesktop").show();
            //                 showPage("display");
            //                 $("#footer-cta").addClass("display-none-cta-button");
            //                 $("#singup-cta-button-div-uc").addClass("display-none-cta-button");

            //                 // Handle pending wallet card if available
            //                 if (typeof handlePendingWalletCard === 'function') {
            //                     await handlePendingWalletCard();
            //                 }

            //                 handleURLParams();
            //             } else {
            //                 $(".profile-photo-section").hide();
            //                 setUserEmail(user.user.email);
            //                 showPage("profile");
            //             }
            //         }
            //     } catch (error) {
            //         console.error("User initialization error:", error);
            //         setCurrentUser(null);
            //         handleURLParams();
            //     }
            // } else {
            //     setCurrentUser(null);
            //     handleURLParams();
            //     $("#footer-cta").removeClass("display-none-cta-button");
            //     $("#singup-cta-button-div-uc").removeClass("display-none-cta-button");
            // }
        } catch (error) {
            console.error("Auth check error:", error);
            setCurrentUser(null);
            handleURLParams();
            $("#footer-cta").removeClass("display-none-cta-button");
            $("#singup-cta-button-div-uc").removeClass("display-none-cta-button");
        }

        updateAuthUI();
        updateAuthUImobilebuttons();

        // Handle OAuth callback
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get("auth") === "success") {
            showSuccessMessage("Successfully logged in!");
            setTimeout(async () => {
                if (typeof handlePendingWalletCard === 'function') {
                    await handlePendingWalletCard();
                }

                const profileResponse = await api.getProfile();
                if (profileResponse.success && profileResponse.profile) {
                    showPage("display");
                } else {
                    showPage("profile");
                }
            }, 1000);
            window.history.replaceState({}, document.title, window.location.pathname);
        } else if (urlParams.get("error")) {
            showErrorMessage("Login failed. Please try again.");
            handleURLParams();
            $("#footer-cta").removeClass("display-none-cta-button");
            $("#singup-cta-button-div-uc").removeClass("display-none-cta-button");
        }
    // }

    console.log("✅ Application initialized");
}

// Initialize on DOM ready
document.addEventListener("DOMContentLoaded", async function () {

    $("#navbarAvatar").hide();
    $("#navbarAvatarDesktop").hide();
    // Initialize all modules
    initializeEventHandlers();
    initializeModals();
    initializeSuggestionsForm();
    initializeContactForm();
    initializeAvatarHandlers();
    initializeFormValidation();

    // Initialize main application
    await initializeApplication();

    // Setup screen size check
    checkScreenWidth();
    window.addEventListener("resize", checkScreenWidth);

    // Setup URL change handlers
    $(window).on("popstate", handleURLParams);
    $(window).on("hashchange", handleURLParams);
});

// Modified DOMContentLoaded handler
// document.addEventListener('DOMContentLoaded', async function() {
//     // Check if this is a standalone card view first
//     const isStandalone = await checkStandaloneMode();
    
//     if (!isStandalone) {
//       // Normal application mode - single initialization call
//       await initializeApplication();
//     }
//   });

function checkScreenWidth() {
    const navbar = document.querySelector(".navbar");
    const container = document.querySelector(".container");
    const screenWidth = window.innerWidth;

    if (screenWidth < 330) {
        navbar.style.display = "none";
        container.style.display = "none";
        showResolutionMessage();
    } else {
        navbar.style.display = "flex";
        container.style.display = "block";
        hideResolutionMessage();
    }
}

function showResolutionMessage() {
    if (document.getElementById("resolution-message")) return;

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
    `;

    messageOverlay.innerHTML = `
        <div style="background: white; padding: 2rem; border-radius: 20px; text-align: center; max-width: 90%;">
            <div style="font-size: 3rem; margin-bottom: 1rem;">📱</div>
            <h2 style="color: #333; margin-bottom: 1rem;">Screen Too Small</h2>
            <p style="color: #666; line-height: 1.5;">
                This application requires a minimum screen width of 400px.
            </p>
            <p style="color: #999; font-size: 0.9rem;">
                Current width: ${window.innerWidth}px | Required: 400px minimum
            </p>
        </div>
    `;

    document.body.appendChild(messageOverlay);
}

function hideResolutionMessage() {
    const msg = document.getElementById("resolution-message");
    if (msg) msg.remove();
}

// Update Authentication UI



// Close dropdown when clicking outside
document.addEventListener('click', function (event) {
    const userMenu = document.querySelector('.user-menu');
    const dropdown = document.getElementById('userDropdown');

    if (dropdown && userMenu && !userMenu.contains(event.target)) {
        dropdown.style.display = 'none';
    }
});

// Make key functions globally accessible
window.showPage = showPage;
window.trackSocialClick = (platform) => import('./modules/display.js').then(m => m.trackSocialClick(platform));