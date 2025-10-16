// forms/suggestions.js
// Suggestions Form Handler

import { api } from '../core/api-client.js';
import { showSuccessMessage, showErrorMessage } from '../ui/notifications.js';
import { isValidEmail } from '../utils/validators.js';

function validateSuggestionForm(data) {
    const errors = [];

    if (!data.name || data.name.trim().length < 2) {
        errors.push({
            field: "suggestion-name",
            message: "Name must be at least 2 characters",
        });
    }

    if (!data.email || !isValidEmail(data.email)) {
        errors.push({
            field: "suggestion-email",
            message: "Please enter a valid email address",
        });
    }

    if (!data.title || data.title.trim().length < 5) {
        errors.push({
            field: "suggestion-title",
            message: "Title must be at least 5 characters",
        });
    }

    if (!data.details || data.details.trim().length < 20) {
        errors.push({
            field: "suggestion-details",
            message: "Details must be at least 20 characters",
        });
    }

    return errors;
}

function displayValidationErrors(errors) {
    // Clear previous errors
    document.querySelectorAll(".form-error").forEach(el => el.remove());

    errors.forEach(error => {
        const field = document.getElementById(error.field);
        if (field) {
            const errorDiv = document.createElement("div");
            errorDiv.className = "form-error";
            errorDiv.style.cssText = `
                color: #dc3545;
                font-size: 0.875rem;
                margin-top: 0.25rem;
            `;
            errorDiv.textContent = error.message;
            field.parentNode.insertBefore(errorDiv, field.nextSibling);
            field.style.borderColor = "#dc3545";
        }
    });
}

async function handleSuggestionSubmit(e) {
    e.preventDefault();

    // Hide any existing success messages
    const successMessage = document.getElementById("contact-success");
    if (successMessage) {
        successMessage.style.display = "none";
    }

    const formData = new FormData(e.target);
    const suggestionData = {
        name: formData.get("name"),
        email: formData.get("email"),
        category: formData.get("category"),
        title: formData.get("title"),
        details: formData.get("details"),
    };

    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalBtnHTML = submitBtn.innerHTML;

    // Validate
    const validationErrors = validateSuggestionForm(suggestionData);
    if (validationErrors.length > 0) {
        displayValidationErrors(validationErrors);
        return;
    }

    // Show loading
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
    submitBtn.disabled = true;

    try {
        const result = await api.updatesuggestions(suggestionData);

        if (result && result.success) {
            showSuccessMessage(result.message);

            // Reset form
            e.target.reset();

            // Close modal
            const modal = e.target.closest(".modal");
            if (modal) {
                modal.style.display = "none";
                document.body.style.overflow = "auto";
            }
        } else {
            throw new Error(result.message || "Failed to submit suggestion");
        }
    } catch (error) {
        console.error("Suggestion submission error:", error);

        let errorMessage = "There was an error submitting your suggestion. ";

        if (error.message.includes("fetch") || error.message.includes("NetworkError")) {
            errorMessage += "Please check your internet connection and try again.";
        } else if (error.message.includes("similar suggestion")) {
            errorMessage = "A similar suggestion was already submitted recently. Please try a different suggestion.";
        } else {
            errorMessage += error.message || "Please try again later.";
        }

        showErrorMessage(errorMessage);
    } finally {
        submitBtn.innerHTML = originalBtnHTML;
        submitBtn.disabled = false;
    }
}

export function initializeSuggestionsForm() {
    const suggestionsForm = document.getElementById("suggestions-form");
    if (suggestionsForm) {
        suggestionsForm.addEventListener("submit", handleSuggestionSubmit);

        // Clear errors on input
        suggestionsForm.addEventListener("input", (e) => {
            if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") {
                e.target.style.borderColor = "";
                const error = e.target.parentNode.querySelector(".form-error");
                if (error) {
                    error.remove();
                }
            }
        });
    }
}