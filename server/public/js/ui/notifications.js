// ui/notifications.js
// Toast Notifications

export function showSuccessMessage(message) {
    const msg = document.createElement("div");
    msg.style.cssText = `
        position: fixed;
        bottom: 2rem;
        right: 2rem;
        background: #28a745;
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 10px;
        z-index: 1001;
        font-weight: 600;
        box-shadow: 0 10px 25px rgba(40, 167, 69, 0.3);
        animation: slideInUp 0.3s ease;
    `;
    msg.textContent = message;
    document.body.appendChild(msg);
    setTimeout(() => {
        msg.style.animation = "slideOutDown 0.3s ease forwards";
        setTimeout(() => msg.remove(), 300);
    }, 3000);
}

export function showErrorMessage(message) {
    const msg = document.createElement("div");
    msg.style.cssText = `
        position: fixed;
        bottom: 2rem;
        right: 2rem;
        background: #dc3545;
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 10px;
        z-index: 1001;
        font-weight: 600;
        box-shadow: 0 10px 25px rgba(220, 53, 69, 0.3);
    `;
    msg.textContent = message;
    document.body.appendChild(msg);
    setTimeout(() => msg.remove(), 4000);
}

export function showError(fieldId, message) {
    const field = document.getElementById(fieldId);

    field.style.borderColor = "#ee8b46";
    field.style.backgroundColor = "#fff5f5";

    const socialFields = [
        "instagram", "facebook", "twitter", "linkedin", "calendly",
        "zoom", "snapchat", "tiktok", "youtube", "whatsapp",
        "telegram", "reddit", "pinterest"
    ];

    if (socialFields.includes(fieldId)) {
        const socialItem = field.closest(".social-item");
        const errorContainer = socialItem.querySelector(".input-error");

        if (errorContainer) {
            errorContainer.innerHTML = `
                <div class="error-message" style="
                    color: #ee8b46;
                    font-size: 0.875rem;
                    margin-top: 0.5rem;
                    font-weight: 500;
                    display: block;
                    width: 100%;
                ">${message}</div>
            `;
        }
    } else {
        const formGroup = field.closest(".form-group");
        const existingError = formGroup.querySelector(".error-message");
        if (existingError) {
            existingError.remove();
        }

        const errorDiv = document.createElement("div");
        errorDiv.className = "error-message";
        errorDiv.style.cssText = `
            color: #ee8b46;
            font-size: 0.875rem;
            margin-top: 0.5rem;
            font-weight: 500;
            display: block;
            width: 100%;
        `;
        errorDiv.textContent = message;

        field.parentNode.insertBefore(errorDiv, field.nextSibling);
    }
}

export function clearAllErrors() {
    const inputs = document.querySelectorAll("#profileForm input, #profileForm textarea");
    inputs.forEach((input) => {
        input.style.borderColor = "";
        input.style.backgroundColor = "";
    });

    const socialErrorContainers = document.querySelectorAll(".input-error");
    socialErrorContainers.forEach((container) => {
        container.innerHTML = "";
    });

    const errorMessages = document.querySelectorAll(".error-message");
    errorMessages.forEach((error) => error.remove());
}
                
export function scrollToFirstError() {
    const errorFields = document.querySelectorAll(".error-message");
    const socialErrorFields = document.querySelectorAll(".input-error:not(:empty)");

    let firstErrorElement = null;

    if (errorFields.length > 0) {
        const firstError = errorFields[0];
        firstErrorElement =
            firstError.previousElementSibling ||
            firstError.parentElement.querySelector("input, textarea, select");
    }

    if (!firstErrorElement && socialErrorFields.length > 0) {
        const firstSocialError = socialErrorFields[0];
        const socialItem = firstSocialError.closest(".social-item");
        firstErrorElement = socialItem ? socialItem.querySelector("input") : null;
    }

    if (firstErrorElement) {
        firstErrorElement.scrollIntoView({
            behavior: "smooth",
            block: "center",
        });

        setTimeout(() => {
            firstErrorElement.focus();
            firstErrorElement.style.animation = "shake 0.5s";
            setTimeout(() => {
                firstErrorElement.style.animation = "";
            }, 500);
        }, 300);
    }
}