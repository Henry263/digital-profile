// modules/wallet.js
// Wallet Pass Generation (Simplified)
// Note: Full wallet implementation available in original file

import { getUserProfile } from '../core/auth.js';
import { isIOS, isAndroid, isDesktop } from '../utils/device-detection.js';
import { generateSerialNumber, generateAuthToken, showLoadingIndicator, hideLoadingIndicator } from '../utils/helpers.js';

export function addToWallet() {
    const userProfile = getUserProfile();
    if (!userProfile) return;

    const userData = {
        name: document.getElementById("displayName").textContent || "John Doe",
        phone: document.getElementById("displayPhoneLink")?.querySelector(".method-value")?.textContent || "",
        email: document.getElementById("displayEmail").textContent || "",
        website: document.getElementById("displayWebsite")?.querySelector(".method-value")?.textContent || "",
        qrCodeData: window.location.href,
    };

    if (isIOS()) {
        generateAndSaveToWallet(userData);
    } else if (isAndroid()) {
        generateGoogleWalletPass(userData);
    } else if (isDesktop()) {
        downloadJSONAndShowPreview(userData);
    } else {
        createSimpleWalletPass(userData);
    }
}

function createPassData(userData) {
    return {
        formatVersion: 1,
        passTypeIdentifier: "pass.com.qrprofiler.digitalcard",
        serialNumber: generateSerialNumber(),
        teamIdentifier: "YOUR_TEAM_ID",
        authenticationToken: generateAuthToken(),
        organizationName: "Digital QR Profiler",
        description: "Digital Business Card",
        logoText: "QRprofile",
        foregroundColor: "rgb(255, 255, 255)",
        backgroundColor: "rgb(102, 126, 234)",
        labelColor: "rgb(255, 255, 255)",
        generic: {
            primaryFields: [{
                key: "name",
                label: "Name",
                value: userData.name,
            }],
            secondaryFields: [
                { key: "phone", label: "Phone", value: userData.phone },
                { key: "email", label: "Email", value: userData.email }
            ],
            auxiliaryFields: userData.website ? [{
                key: "website",
                label: "Website",
                value: userData.website,
            }] : []
        },
        barcode: {
            message: userData.qrCodeData,
            format: "PKBarcodeFormatQR",
            messageEncoding: "iso-8859-1",
        }
    };
}

async function generateAndSaveToWallet(userData) {
    const passData = createPassData(userData);
    const userProfile = getUserProfile();
    
    if (window.location.protocol === 'https:' && userProfile) {
        generatePassViaServer(passData, userData, 'apple');
    } else {
        showIOSInstructions(userData);
    }
}

async function generatePassViaServer(passData, userData, walletType) {
    showLoadingIndicator();
    const userProfile = getUserProfile();
    const applepassurl = `/api/card/${userProfile.slug}/apple-wallet-pass`;
    const endpoint = walletType === "apple" ? applepassurl : "/api/generate-google-pass";

    try {
        const response = await fetch(endpoint, {
            method: "GET",
            headers: {
                Accept: "application/vnd.apple.pkpass, application/octet-stream",
            },
        });

        hideLoadingIndicator();

        if (!response.ok) {
            throw new Error(`Failed to generate ${walletType} wallet pass`);
        }

        const url = window.location.origin + endpoint;

        if (walletType === "apple" && isIOS()) {
            return;
        } else if (walletType === "google" && isAndroid()) {
            const googleWalletUrl = `https://pay.google.com/gp/v/save/${url}`;
            window.location.href = googleWalletUrl;
        } else {
            const downloadLink = document.createElement("a");
            downloadLink.href = url;
            downloadLink.download = `${userData.name.replace(/\s+/g, "_")}.${walletType === "apple" ? "pkpass" : "gwpass"}`;
            downloadLink.style.display = "none";
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
        }
    } catch (error) {
        hideLoadingIndicator();
        console.error(`Error generating ${walletType} wallet pass:`, error);

        if (walletType === "apple") {
            showIOSInstructions(userData);
        } else {
            showGoogleWalletInstructions(userData);
        }
    }
}

function createSimpleWalletPass(userData) {
    // Preview HTML for wallet pass
    const passHTML = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
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
            }
            .pass-content h1 {
                font-size: 20px;
                margin: 0 0 10px 0;
            }
            .pass-content p {
                margin: 3px 0;
                font-size: 14px;
            }
        </style>
    </head>
    <body>
        <div class="wallet-pass">
            <div class="pass-content">
                <h1>${userData.name}</h1>
                <p>${userData.phone}</p>
                <p>${userData.email}</p>
                ${userData.website ? `<p>${userData.website}</p>` : ""}
            </div>
        </div>
    </body>
    </html>`;

    const newTab = window.open();
    newTab.document.write(passHTML);
    newTab.document.close();
}

function showIOSInstructions(userData) {
    showModal(`
        <h2>Add to Apple Wallet</h2>
        <p>To add this business card to your Apple Wallet:</p>
        <ol style="text-align: left; margin: 20px 0;">
            <li>A wallet pass file will be generated</li>
            <li>Tap "Add" when prompted</li>
            <li>The card will appear in your Wallet app</li>
        </ol>
    `);
}

function showModal(content) {
    const modal = document.createElement("div");
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
    `;

    const modalContent = document.createElement("div");
    modalContent.style.cssText = `
        background: white;
        padding: 30px;
        border-radius: 20px;
        max-width: 500px;
        text-align: center;
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

    document.getElementById("closeModalBtn").addEventListener("click", function() {
        modal.remove();
    });
}