// core/auth.js
// Authentication Logic

import { api } from './api-client.js';
import { showPage } from '../ui/navigation.js';
import { showSuccessMessage, showErrorMessage } from '../ui/notifications.js';

export let currentUser = null;
export let userProfile = null;

export function setCurrentUser(user) {
    currentUser = user;
}

export function setUserProfile(profile) {
    userProfile = profile;
}

export function getCurrentUser() {
    return currentUser;
}

export function getUserProfile() {
    return userProfile;
}

export async function loginWithGoogle() {
    window.location.href = `${api.baseURL}/auth/google`;
}

export async function signupWithGoogle() {
    window.location.href = `${api.baseURL}/auth/google`;
}

export async function logout() {
    try {
        const success = await api.logout();
        if (success) {
            $("#navbarAvatar").css("display", "none");
            $("#navbarAvatarDesktop").css("display", "none");

            currentUser = null;
            userProfile = null;

            updateAuthUI();
            updateAuthUImobilebuttons();
            showPage("home");
            showSuccessMessage("Successfully logged out!");

            $("#footer-cta").removeClass("display-none-cta-button");
            $("#footer-cta").addClass("cta-section");

            $("#singup-cta-button-div-uc").removeClass("display-none-cta-button");
            $("#singup-cta-button-div-uc").addClass("usecase-cta");
        }
    } catch (error) {
        console.error("Logout error:", error);
        showErrorMessage("Error logging out. Please try again.");
    }
}

export function updateAuthUI() {
    const loginBtn = document.getElementById("loginBtn");
    const signupBtn = document.getElementById("signupBtn");
    const profileBtn = document.getElementById("profileBtn");
    const displayBtn = document.getElementById("displayBtn");
    const walletBtn = document.getElementById("walletBtn");
    const logoutBtn = document.getElementById("logoutBtn");
    const faqBtn = document.getElementById("faqBtn");

    faqBtn?.classList.remove("hidden");
    
    if (currentUser) {
        loginBtn?.classList.add("hidden");
        signupBtn?.classList.add("hidden");
        profileBtn?.classList.remove("hidden");
        displayBtn?.classList.remove("hidden");
        walletBtn?.classList.remove("hidden");
        logoutBtn?.classList.remove("hidden");
    } else {
        loginBtn?.classList.remove("hidden");
        signupBtn?.classList.remove("hidden");
        profileBtn?.classList.add("hidden");
        displayBtn?.classList.add("hidden");
        walletBtn?.classList.add("hidden");
        logoutBtn?.classList.add("hidden");
    }
}

export function updateAuthUImobilebuttons() {
    const loginBtn = document.getElementById("loginBtnMobile");
    const signupBtn = document.getElementById("signupBtnMobile");
    const profileBtn = document.getElementById("profileBtnMobile");
    const displayBtn = document.getElementById("displayBtnMobile");
    const walletBtn = document.getElementById("walletBtnMobile");
    const logoutBtn = document.getElementById("logoutBtnMobile");
    const faqBtn = document.getElementById("faqBtnMobile");

    faqBtn?.classList.remove("hidden");
    
    if (currentUser) {
        loginBtn?.classList.add("hidden");
        signupBtn?.classList.add("hidden");
        profileBtn?.classList.remove("hidden");
        displayBtn?.classList.remove("hidden");
        walletBtn?.classList.remove("hidden");
        logoutBtn?.classList.remove("hidden");
    } else {
        loginBtn?.classList.remove("hidden");
        signupBtn?.classList.remove("hidden");
        profileBtn?.classList.add("hidden");
        displayBtn?.classList.add("hidden");
        walletBtn?.classList.add("hidden");
        logoutBtn?.classList.add("hidden");
    }
}

export async function getUserStatus() {
    try {
        const data = await $.ajax({
            url: `auth/status`,
            method: "GET",
            dataType: "json",
        });
        return data;
    } catch (error) {
        console.log("Failed to fetch user:", error.message);
    }
}