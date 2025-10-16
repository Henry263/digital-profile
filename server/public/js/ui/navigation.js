// ui/navigation.js
// Page Navigation Management

import { getCurrentUser } from '../core/auth.js';
import { loadProfileData } from '../modules/profile.js';
import { updateDisplayPage } from '../modules/display.js';
import { showErrorMessage } from './notifications.js';

export async function showPage(pageId) {
    const currentUser = getCurrentUser();
    
    // Check for standalone mode
    const isStandalone = await checkStandaloneMode();
    if (isStandalone) {
        return;
    }

    // Restrict access to authenticated pages
    if (!currentUser && (pageId === "profile" || pageId === "display" || pageId === "wallet")) {
        showPage("home");
        showErrorMessage("Please log in to access Profile and Card page");
        return;
    }

    document.querySelectorAll(".page").forEach((page) => {
        page.classList.remove("active");
        page.style.display = "none";
    });

    const targetPage = document.getElementById(pageId + "Page");

    if (targetPage) {
        targetPage.classList.add("active");
        targetPage.style.display = "block";

        if (pageId === "profile") {
            loadProfileData();
        } else if (pageId === "display") {
            updateDisplayPage();
        } else if (pageId === "wallet") {
            if (typeof loadWalletCards === "function") {
                loadWalletCards();
            }
        }
    }
}

export async function checkStandaloneMode() {
    const urlParams = new URLSearchParams(window.location.search);
    const cardParam = urlParams.get("card");

    if (cardParam) {
        document.querySelector(".navbar").style.display = "none";
        document.getElementById("standalonePage").style.display = "flex";
        document.querySelectorAll(".page:not(#standalonePage)").forEach((page) => {
            page.style.display = "none";
        });

        const { loadStandaloneCard } = await import('../modules/display.js');
        const success = await loadStandaloneCard();
        return success;
    }
    return false;
}

export async function handleURLParams() {
    const urlParams = new URLSearchParams(window.location.search);

    if (!urlParams.toString()) {
        showPage("display");
        return null;
    }

    const params = {};
    for (const [key, value] of urlParams.entries()) {
        params[key] = value;
    }

    if (urlParams.has("page")) {
        const { getUserStatus } = await import('../core/auth.js');
        const pagename = urlParams.get("page");
        
        const pageMap = {
            home: "home",
            faq: "faq",
            usecase: "usecase",
            scenario: "usecase"
        };

        if (pageMap[pagename]) {
            showPage(pageMap[pagename]);
            return params;
        }

        // Pages requiring auth check
        const authPages = ["signup", "login", "profile", "wallet"];
        if (authPages.includes(pagename)) {
            const user = await getUserStatus();
            
            if (user && user.authenticated) {
                showPage(pagename === "signup" || pagename === "login" ? "display" : pagename);
            } else {
                showPage(pagename === "profile" || pagename === "wallet" ? "login" : pagename);
            }
        }
    }

    return params;
}