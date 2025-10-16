// modules/form-validation.js
// Complete Form Validation

import { showError, clearAllErrors, scrollToFirstError } from '../ui/notifications.js';
import { validateURL } from './social-validation.js';
import { 
    validateRequired, 
    validatePhone, 
    validateFieldLength,
    validateNameOrganizationDifferent 
} from '../utils/validators.js';
import { APP_CONFIG, VALID_SOCIAL_FIELDS } from '../core/config.js';

export function validateForm() {
    clearAllErrors();
    let isValid = true;

    // Validate required fields
    isValid = validateRequired("name", "Full name is required") && isValid;
    isValid = validateRequired("email", "Email address is required") && isValid;

    // Validate name length
    const nameValue = document.getElementById("name").value.trim();
    if (nameValue) {
        isValid = validateFieldLength("name", APP_CONFIG.maxNameLength, "Name") && isValid;
    }

    // Validate organization length
    const organizationValue = document.getElementById("organization").value.trim();
    if (organizationValue) {
        isValid = validateFieldLength("organization", APP_CONFIG.maxOrgLength, "Organization") && isValid;
    }

    // Validate name and organization are different
    if (nameValue && organizationValue) {
        isValid = validateNameOrganizationDifferent() && isValid;
    }

    // Validate phone numbers (optional but must be valid if provided)
    const phone = document.getElementById("phone").value.trim();
    const mobile = document.getElementById("mobile").value.trim();

    if (phone) {
        isValid = validatePhone("phone") && isValid;
    }

    if (mobile) {
        isValid = validatePhone("mobile") && isValid;
    }

    // Validate website (optional)
    const website = document.getElementById("website").value.trim();
    if (website) {
        isValid = validateURL("website", "Please enter a valid website URL") && isValid;
    }

    // Validate social media URLs (optional)
    VALID_SOCIAL_FIELDS.forEach((field) => {
        const value = document.getElementById(field).value.trim();
        if (value) {
            isValid = validateURL(field, `Please enter a valid ${field} URL`) && isValid;
        }
    });

    return isValid;
}

export function setupRealtimeValidation() {
    const form = document.getElementById("profileForm");
    if (!form) return;

    // Validate on input change (debounced)
    form.addEventListener("input", function(e) {
        setTimeout(() => {
            validateForm();
        }, 100);
    });

    // Validate on blur for immediate feedback
    form.addEventListener("blur", function(e) {
        const fieldId = e.target.id;
        if (!fieldId) return;

        // Clear previous error
        if (VALID_SOCIAL_FIELDS.includes(fieldId)) {
            const socialItem = e.target.closest(".social-item");
            const errorContainer = socialItem?.querySelector(".input-error");
            if (errorContainer) {
                errorContainer.innerHTML = "";
            }
        } else {
            const existingError = e.target.parentNode.querySelector(".error-message");
            if (existingError) {
                existingError.remove();
            }
        }

        e.target.style.borderColor = "";
        e.target.style.backgroundColor = "";

        // Validate specific field
        validateField(fieldId, e.target.value.trim());

        // Check overall form validity
        setTimeout(() => {
            validateForm();
        }, 50);
    }, true);
}

function validateField(fieldId, fieldValue) {
    let fieldValid = true;

    switch (fieldId) {
        case "name":
            fieldValid = validateRequired(fieldId, "Full name is required");
            if (fieldValid && fieldValue) {
                fieldValid = validateFieldLength("name", APP_CONFIG.maxNameLength, "Name");
            }
            if (fieldValid && fieldValue) {
                const orgValue = document.getElementById("organization").value.trim();
                if (orgValue) {
                    fieldValid = validateNameOrganizationDifferent();
                }
            }
            break;

        case "organization":
            if (fieldValue) {
                fieldValid = validateFieldLength("organization", APP_CONFIG.maxOrgLength, "Organization");
            }
            if (fieldValid && fieldValue) {
                const nameValue = document.getElementById("name").value.trim();
                if (nameValue) {
                    fieldValid = validateNameOrganizationDifferent();
                }
            }
            break;

        case "email":
            fieldValid = validateRequired(fieldId, "Email is required");
            break;

        case "phone":
        case "mobile":
            if (fieldValue) {
                fieldValid = validatePhone(fieldId);
            }
            break;

        case "website":
            if (fieldValue) {
                fieldValid = validateURL("website", "Please enter a valid website URL");
            }
            break;

        default:
            if (VALID_SOCIAL_FIELDS.includes(fieldId) && fieldValue) {
                fieldValid = validateURL(fieldId, `Please enter a valid ${fieldId} URL`);
            }
    }

    return fieldValid;
}

// Initialize validation when form is ready
export function initializeFormValidation() {
    setupRealtimeValidation();
    
    // Handle checkbox changes
    $("#isPublic").on("change", function() {
        const isChecked = $(this).is(":checked");
        const helpText = $(this).closest(".form-group").find(".form-text");

        if (isChecked) {
            helpText.text("When checked, others can view your card using the link or QR code");
            helpText.removeClass("text-danger").addClass("text-muted");
        } else {
            helpText.text("Your card will be private - only you can access it when logged in");
            helpText.removeClass("text-muted").addClass("text-danger");
        }
    });
}