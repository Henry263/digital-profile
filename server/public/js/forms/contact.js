// forms/contact.js
// Contact Form Handler

import { api } from '../core/api-client.js';
import { showSuccessMessage, showErrorMessage } from '../ui/notifications.js';
import { isValidEmail, isValidPhone } from '../utils/validators.js';

function validateContactForm(data) {
    // Name validation
    if (!data.name || data.name.trim().length < 2) {
        return "Please enter a valid name (at least 2 characters)";
    }

    // Email validation
    if (!data.email || !isValidEmail(data.email)) {
        return "Please enter a valid email address";
    }

    // Subject validation
    if (!data.subject) {
        return "Please select a subject";
    }

    // Message validation
    if (!data.message || data.message.trim().length < 10) {
        return "Please enter a message (at least 10 characters)";
    }

    // Phone validation (if provided)
    if (data.phone && data.phone.trim() && !isValidPhone(data.phone)) {
        return "Please enter a valid phone number or leave it empty";
    }

    return null; // No errors
}

async function handleContactSubmit(e) {
    e.preventDefault();

    // Hide any existing success messages
    const successMessage = document.getElementById("contact-success");
    if (successMessage) {
        successMessage.style.display = "none";
    }

    const formData = new FormData(e.target);
    const contactData = {
        name: formData.get("name"),
        email: formData.get("email"),
        phone: formData.get("phone"),
        subject: formData.get("subject"),
        message: formData.get("message"),
    };

    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalBtnHTML = submitBtn.innerHTML;

    // Validate
    const validationError = validateContactForm(contactData);
    if (validationError) {
        showErrorMessage(validationError);
        return;
    }

    // Show loading
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
    submitBtn.disabled = true;

    try {
        const result = await api.updatecontactinfo(contactData);

        if (result && result.success) {
            // Show success message
            if (successMessage) {
                successMessage.style.display = "block";
                successMessage.textContent = "Thank you for contacting us. We will get back to you soon!";
            } else {
                showSuccessMessage("Thank you for contacting us. We will get back to you soon!");
            }

            // Reset form
            e.target.reset();

            // Auto-close modal after 3 seconds
            setTimeout(() => {
                const modal = document.getElementById("contact-modal");
                if (modal) {
                    modal.style.display = "none";
                    document.body.style.overflow = "auto";
                }
                if (successMessage) {
                    successMessage.style.display = "none";
                }
            }, 3000);
        } else {
            throw new Error(result.message || "Failed to send message");
        }
    } catch (error) {
        console.error("Contact submission error:", error);

        let errorMessage = "There was an error sending your message. ";

        if (error.message.includes("fetch") || error.message.includes("NetworkError")) {
            errorMessage += "Please check your internet connection and try again.";
        } else if (error.message.includes("validation") || error.message.includes("required")) {
            errorMessage = "Please fill in all required fields correctly.";
        } else {
            errorMessage += error.message || "Please try again later.";
        }

        showErrorMessage(errorMessage);
    } finally {
        submitBtn.innerHTML = originalBtnHTML;
        submitBtn.disabled = false;
    }
}

export function initializeContactForm() {
    const contactForm = document.getElementById("contact-form");
    if (contactForm) {
        contactForm.addEventListener("submit", handleContactSubmit);

        // Clear error highlighting on input
        contactForm.addEventListener("input", (e) => {
            if (e.target.tagName === "INPUT" || 
                e.target.tagName === "TEXTAREA" || 
                e.target.tagName === "SELECT") {
                e.target.style.borderColor = "";
            }
        });
    }

    // Modal close functionality
    const modal = document.getElementById("contact-modal");
    const closeBtn = modal?.querySelector(".close");

    if (closeBtn) {
        closeBtn.addEventListener("click", function() {
            modal.style.display = "none";
            document.body.style.overflow = "auto";

            const successMessage = document.getElementById("contact-success");
            if (successMessage) {
                successMessage.style.display = "none";
            }
        });
    }

    // Close modal when clicking outside
    if (modal) {
        modal.addEventListener("click", function(e) {
            if (e.target === modal) {
                modal.style.display = "none";
                document.body.style.overflow = "auto";

                const successMessage = document.getElementById("contact-success");
                if (successMessage) {
                    successMessage.style.display = "none";
                }
            }
        });
    }
}