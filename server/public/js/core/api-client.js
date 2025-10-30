// core/api-client.js
// API Client Class

import { APP_CONFIG } from './config.js';

export let userPublicIP = null;

async function getRealPublicIP() {
    try {
        const response = await fetch("/api/card/get-client-ip");
        const data = await response.json();
        if (data.success) {
            return data.ip;
        }
        return null;
    } catch (error) {
        console.error("Failed to get public IP:", error);
        return null;
    }
}

// Initialize IP on load
(async function() {
    userPublicIP = await getRealPublicIP();
})();

export class SmartLifeCoverAPI {
    constructor(baseURL = APP_CONFIG.baseURL) {
        this.baseURL = baseURL;
        this.token = this.getToken();
    }

    async getUserWithProfile() {
        return this.apiRequest('/auth/user-profile');
      }

    getToken() {
        return localStorage.getItem("authToken") || null;
    }

    setToken(token) {
        this.token = token;
        localStorage.setItem("authToken", token);
    }

    clearToken() {
        this.token = null;
        localStorage.removeItem("authToken");
    }

    async apiRequest(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: {
                "Content-Type": "application/json",
                ...options.headers,
            },
            credentials: "include",
            ...options,
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "API request failed");
            }

            return data;
        } catch (error) {
            console.error("API Request Error:", error);
            throw error;
        }
    }

    // Authentication
    async checkAuthStatus() {
        try {
            const response = await this.apiRequest("/auth/status");
            return response.authenticated;
        } catch (error) {
            return false;
        }
    }

    async getCurrentUser() {
        // return this.apiRequest("/auth/me");
        try {
            return this.apiRequest('/auth/user-profile'); 
        } catch (error) {
            console.error("Get getCurrentUser error:", error);
            return { success: false, error: error.message };
        }
    }

    async logout() {
        try {
            await this.apiRequest("/auth/logout", { method: "POST" });
            this.clearToken();
            return true;
        } catch (error) {
            console.error("Logout error:", error);
            this.clearToken();
            return false;
        }
    }

    // Profile
    async getProfile() {
        try {
            return await this.apiRequest("/api/profile");
        } catch (error) {
            console.error("Get profile error:", error);
            return { success: false, error: error.message };
        }
    }

    async saveProfile(profileData) {
        return this.apiRequest("/api/profile", {
            method: "POST",
            body: JSON.stringify(profileData),
        });
    }

    async uploadQRCode(file) {
        const formData = new FormData();
        formData.append("qrCode", file);

        return this.apiRequest("/api/profile/upload-qr", {
            method: "POST",
            headers: {},
            body: formData,
        });
    }

    async updatesuggestions(suggestiondata) {
        return this.apiRequest("/api/suggestions", {
            method: "POST",
            body: JSON.stringify(suggestiondata),
        });
    }

    async updatecontactinfo(contactdata) {
        return this.apiRequest("/api/contact", {
            method: "POST",
            body: JSON.stringify(contactdata),
        });
    }

    async deleteProfile() {
        return this.apiRequest("/api/profile", { method: "DELETE" });
    }

    async getAnalytics() {
        return this.apiRequest("/api/profile/analytics");
    }

    // Card
    async getPublicCard(cardId) {
        return this.apiRequest(`/api/card/${cardId}`);
    }

    async getCardhtmlData(identifier) {
        return this.apiRequest(`/api/card/card-html/${identifier}`);
    }

    async downloadVCard(identifier) {
        const url = `${this.baseURL}/api/card/${identifier}/vcard`;
        window.open(url, "_blank");
    }

    async downloadWalletPass(identifier) {
        const url = `${this.baseURL}/api/card/${identifier}/wallet-pass`;
        window.open(url, "_blank");
    }

    async getQRCode(identifier, size = 400) {
        return `${this.baseURL}/api/card/${identifier}/qr?size=${size}`;
    }

    async getstyledQRCode(identifier, size = 400) {
        return `${this.baseURL}/api/card/${identifier}/download-styled-qr`;
    }

    async trackSocialClick(cardId, platform) {
        return this.apiRequest(`/api/card/${cardId}/track/${platform}`, {
            method: "POST",
        });
    }

    async trackContactClick(cardId, action) {
        return this.apiRequest(`/api/card/${cardId}/track/contact/${action}`, {
            method: "POST",
        });
    }

    async searchCards(query, limit = 10) {
        return this.apiRequest(
            `/api/card/search/${encodeURIComponent(query)}?limit=${limit}`
        );
    }
}

// Export singleton instance
export const api = new SmartLifeCoverAPI();