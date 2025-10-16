// modules/profile.js
// Profile Management

import { api } from '../core/api-client.js';
import { getUserProfile, setUserProfile } from '../core/auth.js';
import { showLoadingMessage, hideLoadingMessage } from '../utils/helpers.js';
import { showSuccessMessage, showErrorMessage } from '../ui/notifications.js';
import { showPage } from '../ui/navigation.js';
import { updateDisplayPage } from './display.js';
import { updateProfileDisplay, updateNavbarAvatar } from './avatar.js';

export async function handleProfileSave() {
    try {
        showLoadingMessage("Saving profile and generating QR codes...");

        const form = document.getElementById("profileForm");
        if (!form) {
            throw new Error("Profile form not found");
        }

        const socialMediaData = {};
        const socialFields = [
            "instagram", "facebook", "twitter", "linkedin", "calendly",
            "zoom", "snapchat", "tiktok", "youtube", "whatsapp",
            "telegram", "reddit", "pinterest"
        ];

        socialFields.forEach((field) => {
            const input = document.getElementById(field);
            if (input) {
                const finalUrl = input.getAttribute("data-final-url");
                if (finalUrl && finalUrl.trim()) {
                    socialMediaData[field] = finalUrl;
                }
            }
        });

        const formData = new FormData(form);

        const locationData = window.locationAutocomplete
            ? window.locationAutocomplete.getSelectedLocation()
            : null;

        const profileData = {
            name: formData.get("name"),
            title: formData.get("title"),
            organization: formData.get("organization"),
            phone: formData.get("phone"),
            mobile: formData.get("mobile"),
            email: formData.get("email"),
            website: formData.get("website"),
            address: formData.get("address"),
            notes: formData.get("notes"),
            showPhoneNumber: $("#showPhoneNumber").is(":checked"),
            country: {
                name: locationData?.country?.name || formData.get("country") || "",
                code: formData.get("countryCode") || locationData?.country?.code || "",
            },
            state: {
                name: locationData?.state?.name || formData.get("state") || "",
                id: formData.get("stateId") || locationData?.state?.id || "",
                code: formData.get("stateCode") || locationData?.state?.code || "",
            },
            city: {
                name: locationData?.city?.name || formData.get("city") || "",
                id: formData.get("cityId") || locationData?.city?.id || "",
            },
            socialMedia: socialMediaData,
            isPublic: $("#isPublic").is(":checked"),
        };

        const response = await api.saveProfile(profileData);

        if (response.success) {
            setUserProfile(response.profile);

            let message = "Profile saved successfully!";
            if (response.qrGenerated) {
                message += ` Generated ${response.qrCodes?.length || 0} QR codes.`;
            }

            showSuccessMessage(message);

            updateDisplayPage();
            $(".profile-photo-section").show();
            setTimeout(() => {
                showPage("display");
            }, 1500);
        } else {
            throw new Error(response.message || "Save failed");
        }
    } catch (error) {
        console.error("Save profile error:", error);
        showErrorMessage("Failed to save profile: " + error.message);
    } finally {
        hideLoadingMessage();
    }
}

export async function loadProfileData() {
    try {
        const response = await api.getProfile();

        if (response.success && response.profile) {
            const userProfile = response.profile;
            setUserProfile(userProfile);

            document.getElementById("email").value = response.profile.email;
            if (userProfile.showPhoneNumber !== undefined) {
                document.getElementById("showPhoneNumber").checked =
                    userProfile.showPhoneNumber;
            }

            const form = document.getElementById("profileForm");
            if (form) {
                const inputs = form.querySelectorAll("input, textarea");

                inputs.forEach((input) => {
                    const name = input.name;
                    if (name === "country" || name === "state" || name === "city") {
                        return;
                    }

                    if (name && userProfile[name] !== undefined) {
                        input.value = userProfile[name];
                    } else if (
                        name &&
                        userProfile.socialMedia &&
                        userProfile.socialMedia[name] !== undefined
                    ) {
                        input.value = userProfile.socialMedia[name];
                    }
                });
            }

            // Populate location fields
            if (userProfile.country?.name) {
                document.getElementById("country").value = userProfile.country.name;
                document.getElementById("countryCode").value = userProfile.country.code || "";

                if (window.locationAutocomplete) {
                    const country = window.locationAutocomplete.countries.find(
                        (c) => c.code === userProfile.country.code
                    );
                    if (country) {
                        window.locationAutocomplete.selectCountry(country);
                    }
                }
            }

            if (userProfile.state?.name) {
                setTimeout(() => {
                    document.getElementById("state").value = userProfile.state.name;
                    document.getElementById("stateId").value = userProfile.state.id || "";
                    document.getElementById("stateCode").value = userProfile.state.code || "";

                    if (window.locationAutocomplete && window.locationAutocomplete.selectedCountry) {
                        const state = window.locationAutocomplete.currentStates.find(
                            (s) => s.id === userProfile.state.id
                        );
                        if (state) {
                            window.locationAutocomplete.selectState(state);
                        }
                    }
                }, 500);
            }

            if (userProfile.city?.name) {
                setTimeout(() => {
                    document.getElementById("city").value = userProfile.city.name;
                    document.getElementById("cityId").value = userProfile.city.id || "";
                }, 1000);
            }

            if (userProfile.uploadedQR && userProfile.uploadedQR.url) {
                const qrPreview = document.getElementById("qrPreview");
                const qrUploadText = document.getElementById("qrUploadText");

                if (qrPreview && qrUploadText) {
                    qrPreview.src = api.baseURL + userProfile.uploadedQR.url;
                    qrPreview.classList.remove("hidden");
                    qrUploadText.innerHTML = "QR Code uploaded ✅<br><small>Click to change</small>";
                }
            }

            updateProfileDisplay(userProfile);
            updateNavbarAvatar(userProfile);
        } else if (response.success && !response.profile) {
            setUserProfile(null);
            const userdata = await api.getCurrentUser();

            if (userdata.success == true) {
                document.getElementById("email").value = userdata.user.email;
            }
        } else {
            showPage("login");
        }
    } catch (error) {
        console.error("Load profile error:", error);

        if (error.message.includes("retrieving profile")) {
            showErrorMessage("Unable to load your profile. Please try refreshing the page.");
        } else {
            showErrorMessage("Profile loading error: " + error.message);
        }
    }
}

export async function handleQRUpload(event) {
    const file = event.target.files[0];
    if (file) {
        try {
            const response = await api.uploadQRCode(file);

            if (response.success) {
                document.getElementById("qrPreview").src = api.baseURL + response.qrUrl;
                document.getElementById("qrPreview").classList.remove("hidden");
                document.getElementById("qrUploadText").innerHTML =
                    "QR Code uploaded ✅<br><small>Click to change</small>";
                showSuccessMessage("QR Code uploaded successfully!");
            } else {
                throw new Error(response.message);
            }
        } catch (error) {
            console.error("QR upload error:", error);
            showErrorMessage("Failed to upload QR code: " + error.message);
        }
    }
}