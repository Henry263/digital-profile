// utils/validators.js
// Validation Functions
import { showError } from '../ui/notifications.js';
export function isValidEmail(email) {
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    return emailRegex.test(email);
}

export function isValidPhone(phone) {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.trim());
}

export function validateFieldLength(fieldId, maxLength, fieldName) {
    const field = document.getElementById(fieldId);
    const value = field.value.trim();

    if (value.length > maxLength) {
        // const { showError } = require('./form-errors.js');
        showError(
            fieldId,
            `${fieldName} cannot be more than ${maxLength} characters (current: ${value.length})`
        );
        return false;
    }
    return true;
}

export function validateNameOrganizationDifferent() {
    const nameField = document.getElementById("name");
    const organizationField = document.getElementById("organization");

    const name = nameField.value.trim().toLowerCase();
    const organization = organizationField.value.trim().toLowerCase();

    if (name && organization && name === organization) {
        // const { showError } = require('./form-errors.js');
        showError(
            "organization",
            "Organization name cannot be the same as your name"
        );
        return false;
    }
    return true;
}

export function validateRequired(fieldId, errorMessage) {
    const field = document.getElementById(fieldId);
    const value = field.value.trim();

    if (!value) {
        // const { showError } = require('./form-errors.js');
        showError(fieldId, errorMessage);
        return false;
    }
    return true;
}

export function validatePhone(fieldId) {
    const field = document.getElementById(fieldId);
    const value = field.value.trim();

    if (!value) return true;

    if (!/^\d{10}$/.test(value)) {
        // const { showError } = require('./form-errors.js');
        showError(fieldId, "Please enter exactly 10 digits");
        return false;
    }

    return true;
}