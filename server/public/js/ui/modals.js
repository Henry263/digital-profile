// ui/modals.js
// Modal Management System

const MODALS = {
    privacy: "privacy-modal",
    terms: "terms-modal",
    faq: "faq-modal",
    suggestions: "suggestions-modal",
    contact: "contact-modal"
};

const TRIGGERS = {
    privacy: "privacy-link",
    terms: "terms-link",
    faq: "faq-link",
    suggestions: "suggestions-link",
    contact: "contact-link"
};

export function openModal(modalName) {
    const modalId = MODALS[modalName];
    const modal = document.getElementById(modalId);
    
    if (modal) {
        modal.style.display = "block";
        document.body.style.overflow = "hidden";
    }
}

export function closeModal(modalName) {
    const modalId = MODALS[modalName];
    const modal = document.getElementById(modalId);
    
    if (modal) {
        modal.style.display = "none";
        document.body.style.overflow = "auto";
    }
}

export function closeAllModals() {
    Object.values(MODALS).forEach((modalId) => {
        const modal = document.getElementById(modalId);
        if (modal && modal.style.display === "block") {
            modal.style.display = "none";
        }
    });
    document.body.style.overflow = "auto";
}

function initializeFAQAccordion() {
    document.querySelectorAll(".faq-question").forEach((question) => {
        if (question) {
            question.addEventListener("click", () => {
                const answer = question.nextElementSibling;
                if (answer) {
                    const isOpen = answer.classList.contains("show");

                    // Close all answers
                    document.querySelectorAll(".faq-answer").forEach((ans) => {
                        ans.classList.remove("show");
                    });

                    // Toggle current answer
                    if (!isOpen) {
                        answer.classList.add("show");
                    }
                }
            });
        }
    });
}

function initializeModalTriggers() {
    // Add event listeners for modal triggers
    Object.entries(TRIGGERS).forEach(([key, triggerId]) => {
        const trigger = document.getElementById(triggerId);
        if (trigger) {
            trigger.addEventListener("click", (e) => {
                e.preventDefault();
                openModal(key);
            });
        }
    });
}

function initializeCloseButtons() {
    // Add event listeners for close buttons
    document.querySelectorAll(".close").forEach((closeBtn) => {
        if (closeBtn) {
            closeBtn.addEventListener("click", () => {
                closeAllModals();
            });
        }
    });

    // Close modal when clicking outside
    Object.values(MODALS).forEach((modalId) => {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.addEventListener("click", (e) => {
                if (e.target === modal) {
                    modal.style.display = "none";
                    document.body.style.overflow = "auto";
                }
            });
        }
    });
}

export function initializeModals() {
    initializeModalTriggers();
    initializeCloseButtons();
    initializeFAQAccordion();
}

// Utility function to show custom modal
export function showCustomModal(content, options = {}) {
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
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    const modalContent = document.createElement("div");
    modalContent.style.cssText = `
        background: white;
        padding: 30px;
        border-radius: 20px;
        max-width: ${options.maxWidth || '500px'};
        max-height: 90vh;
        overflow-y: auto;
        text-align: ${options.textAlign || 'center'};
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
    `;

    const buttonText = options.buttonText || "Got it!";
    const buttonColor = options.buttonColor || "#667eea";

    modalContent.innerHTML = content + `
        <button id="closeCustomModalBtn" 
                style="background: ${buttonColor}; color: white; border: none; 
                       padding: 10px 20px; border-radius: 10px; cursor: pointer; 
                       font-size: 16px; margin-top: 20px;">
            ${buttonText}
        </button>
    `;

    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    document.getElementById("closeCustomModalBtn").addEventListener("click", function() {
        modal.remove();
        if (options.onClose) {
            options.onClose();
        }
    });

    // Close on outside click if enabled
    if (options.closeOnOutsideClick !== false) {
        modal.addEventListener("click", function(e) {
            if (e.target === modal) {
                modal.remove();
                if (options.onClose) {
                    options.onClose();
                }
            }
        });
    }

    return modal;
}