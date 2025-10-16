// modules/avatar.js
// Profile Photo Management

import { api } from '../core/api-client.js';
import { APP_CONFIG } from '../core/config.js';
import { showSuccessMessage, showErrorMessage } from '../ui/notifications.js';
import { loadProfileData } from './profile.js';

export function updateProfileDisplay(profile) {
    const avatarDisplay = $("#avatarDisplay");
    const avatarInitials = $("#avatarInitials");
    const profilePhotoImg = $("#profilePhotoImg");
    const deleteBtn = $("#deletePhotoBtn");

    if (profile.hasProfilePhoto) {
        // Show photo
        profilePhotoImg.attr("src", `/api/profile/photo/${profile._id}`);
        profilePhotoImg.show();
        avatarDisplay.hide();
        deleteBtn.show();
    } else {
        // Show avatar with initials
        avatarInitials.text(profile.initials);
        avatarDisplay.show();
        profilePhotoImg.hide();
        deleteBtn.hide();
    }
}

export function updateNavbarAvatar(profile) {
    let navbarAvatar = $(".navbar-avatar");

    // Create navbar avatar if it doesn't exist
    if (navbarAvatar.length === 0) {
        navbarAvatar = $('<div class="navbar-avatar"></div>');
        $("#logoutBtn").after(navbarAvatar);
    }

    navbarAvatar.empty();

    if (profile.hasProfilePhoto) {
        navbarAvatar.html(`<img src="/api/profile/photo/${profile._id}" alt="Profile">`);
    } else {
        navbarAvatar.text(profile.initials);
    }

    // Make it clickable
    navbarAvatar.off("click").on("click", function() {
        // Could navigate to profile page
    });
}

export async function uploadProfilePhoto(file) {
    const formData = new FormData();
    formData.append("profilePhoto", file);

    const isHEIC = file.name.toLowerCase().endsWith(".heic") || 
                   file.name.toLowerCase().endsWith(".heif");

    const uploadBtn = $("#uploadPhotoBtn");
    const originalText = uploadBtn.html();
    uploadBtn.prop("disabled", true)
           .text(isHEIC ? "Converting & Uploading..." : "Uploading...");

    try {
        const response = await $.ajax({
            url: "/api/profile/upload-profile-photo",
            method: "POST",
            data: formData,
            processData: false,
            contentType: false,
            headers: {
                Authorization: "Bearer " + localStorage.getItem("token"),
            },
        });

        if (response.success) {
            showSuccessMessage("Profile photo uploaded successfully!");
            $("#deletePhotoBtn").show();
            uploadBtn.prop("disabled", false).html(originalText);
            
            // Reload profile to update navbar
            await loadProfileData();
        }
    } catch (error) {
        console.error("Error uploading photo:", error);
        showErrorMessage(error.responseJSON?.message || "Error uploading photo");

        // Reset preview
        $("#profilePhotoImg").hide();
        $("#avatarDisplay").show();
        $("#profilePhotoInput").val("");
        uploadBtn.prop("disabled", false).html(originalText);
    }
}

export async function deleteProfilePhoto() {
    if (!confirm("Are you sure you want to remove your profile photo?")) {
        return;
    }

    try {
        const response = await $.ajax({
            url: "/api/profile/delete-profile-photo",
            method: "DELETE",
            headers: {
                Authorization: "Bearer " + localStorage.getItem("token"),
            },
        });

        if (response.success) {
            showSuccessMessage("Profile photo removed successfully!");

            // Show avatar again
            $("#profilePhotoImg").hide();
            $("#avatarDisplay").show();
            $("#deletePhotoBtn").hide();
            $("#profilePhotoInput").val("");

            // Reload profile to update navbar
            await loadProfileData();
        }
    } catch (error) {
        console.error("Error deleting photo:", error);
        showErrorMessage("Error removing photo");
    }
}

export function initializeAvatarHandlers() {
    // Handle upload button click
    $("#uploadPhotoBtn").on("click", function() {
        $("#profilePhotoInput").click();
    });

    // Handle file selection
    $("#profilePhotoInput").on("change", async function(e) {
        const file = e.target.files[0];

        if (!file) return;

        // Validate file size
        if (file.size > APP_CONFIG.maxPhotoSize) {
            showErrorMessage("File size must be less than 5MB");
            $(this).val("");
            return;
        }

        const fileName = file.name.toLowerCase();
        const isHEIC = fileName.endsWith(".heic") || fileName.endsWith(".heif");
        const isStandardImage = file.type.startsWith("image/");

        // Validate file type
        if (!isStandardImage && !isHEIC) {
            showErrorMessage("Please select an image file (JPG, PNG, GIF, HEIC)");
            $(this).val("");
            return;
        }

        // Preview handling
        if (isHEIC) {
            console.log("📸 HEIC file - will be converted on server");
            $("#avatarDisplay").show();
            $("#profilePhotoImg").hide();
        } else {
            // Preview standard images
            const reader = new FileReader();
            reader.onload = function(e) {
                $("#profilePhotoImg").attr("src", e.target.result).show();
                $("#avatarDisplay").hide();
            };
            reader.readAsDataURL(file);
        }

        // Upload photo
        await uploadProfilePhoto(file);
    });

    // Handle delete button
    $("#deletePhotoBtn").on("click", deleteProfilePhoto);
}