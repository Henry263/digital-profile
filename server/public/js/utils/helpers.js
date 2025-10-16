// utils/helpers.js
// General Utility Functions

export function generateSerialNumber() {
    return "QRP-" + Date.now() + "-" + Math.random().toString(36).substr(2, 9);
}

export function generateAuthToken() {
    return "auth-" + Math.random().toString(36).substr(2, 15);
}

export function setUserEmail(email) {
    const emailField = document.getElementById("email");
    if (emailField) {
        emailField.value = email;
        emailField.setAttribute("readonly", true);
        emailField.style.backgroundColor = "#f8f9fa";
        emailField.style.cursor = "not-allowed";
        emailField.style.color = "#6c757d";
    }
}

export function createVCard(userData) {
    return `BEGIN:VCARD
VERSION:3.0
FN:${userData.name}
TEL:${userData.phone}
EMAIL:${userData.email}
URL:${userData.website}
NOTE:${userData.qrCodeData}
END:VCARD`;
}

export function getPersonalizedUrl() {
    const qrContainer = document.getElementById("generatedQR");
    if (qrContainer) {
        const urlInput = qrContainer.querySelector("#standaloneUrl");
        if (urlInput) {
            return urlInput.value;
        }
    }
    return window.location.href;
}

export function showLoadingIndicator() {
    const loader = document.createElement("div");
    loader.id = "wallet-loader";
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

export function hideLoadingIndicator() {
    const loader = document.getElementById("wallet-loader");
    if (loader) {
        loader.remove();
    }
}

export function showLoadingMessage(message) {
    const existing = document.getElementById("loadingMessage");
    if (existing) existing.remove();

    const msg = document.createElement("div");
    msg.id = "loadingMessage";
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

export function hideLoadingMessage() {
    const msg = document.getElementById("loadingMessage");
    if (msg) msg.remove();
}

export async function copyStandaloneUrl() {
    // const urlInput = document.getElementById("standaloneUrl");
    const copyBtn = document.querySelector(".copy-url-btn");
    const url = $(copyBtn).data('personal-card-url')

    try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(url);
        } else {
            urlInput.select();
            document.execCommand("copy");
        }

       
        const originalText = copyBtn.textContent;
        copyBtn.textContent = "Copied!";
        copyBtn.style.background = "#28a745";

        setTimeout(() => {
            copyBtn.textContent = originalText;
            copyBtn.style.background = "#667eea";
        }, 2000);

        // Import dynamically to avoid circular dependency
        const { showSuccessMessage } = await import('../ui/notifications.js');
        showSuccessMessage("Card URL copied to clipboard!");
    } catch (err) {
        console.error("Failed to copy URL:", err);
        const { showErrorMessage } = await import('../ui/notifications.js');
        showErrorMessage("Failed to copy URL. Please copy manually.");
    }
}