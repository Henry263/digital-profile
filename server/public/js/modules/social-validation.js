// modules/social-validation.js
// Social Media URL/Handle Validation

import { SOCIAL_MEDIA_PLATFORMS, COMMON_TLDS } from '../core/config.js';
import { showError } from '../ui/notifications.js';

export function isLikelyUrl(value) {
    if (value.startsWith("http://") || value.startsWith("https://")) {
        return true;
    }

    if (value.includes("/")) {
        return true;
    }

    if (value.includes(".")) {
        const parts = value.split(".");

        if (parts.length > 2) {
            return true;
        }

        if (parts.length === 2) {
            const lastPart = parts[1].toLowerCase().split("/")[0];

            if (COMMON_TLDS.includes(lastPart)) {
                return true;
            } else {
                return false;
            }
        }
    }

    return false;
}

export function cleanHandle(handle) {
    return handle.trim().replace(/^@+/, "");
}

export function buildSocialUrl(platform, value) {
    const cleanValue = cleanHandle(value);
    const config = SOCIAL_MEDIA_PLATFORMS[platform];

    if (!config) return value;

    if (platform === "whatsapp") {
        const phone = cleanValue.replace(/[^\d+]/g, "");
        return `${config.baseUrl}${phone}`;
    }

    if (platform === "reddit" && !cleanValue.startsWith("u/")) {
        return `${config.baseUrl}${cleanValue}`;
    }

    return `${config.baseUrl}${cleanValue}`;
}

export function validateSocialMedia(fieldId, value) {
    if (!value || value.trim() === "") {
        return { valid: true, url: "" };
    }

    const trimmedValue = value.trim();
    const config = SOCIAL_MEDIA_PLATFORMS[fieldId];

    if (!config) {
        return { valid: true, url: trimmedValue };
    }

    const isUrl = isLikelyUrl(trimmedValue);

    if (isUrl) {
        try {
            let url = trimmedValue;
            if (!url.startsWith("http://") && !url.startsWith("https://")) {
                url = "https://" + url;
            }

            const urlObj = new URL(url);
            const hasValidDomain = config.domains.some((domain) =>
                urlObj.hostname.includes(domain)
            );

            if (hasValidDomain) {
                return { valid: true, url: url };
            } else {
                return {
                    valid: false,
                    url: "",
                    error: `Please enter a valid ${fieldId} URL or handle`,
                };
            }
        } catch (e) {
            if (config.handlePattern) {
                const cleaned = cleanHandle(trimmedValue);

                if (config.handlePattern.test(cleaned)) {
                    const fullUrl = buildSocialUrl(fieldId, trimmedValue);
                    return { valid: true, url: fullUrl };
                } else {
                    return {
                        valid: false,
                        url: "",
                        error: `Please enter a valid ${fieldId} handle or URL`,
                    };
                }
            } else {
                const fullUrl = buildSocialUrl(fieldId, trimmedValue);
                return { valid: true, url: fullUrl };
            }
        }
    } else {
        if (config.handlePattern) {
            const cleaned = cleanHandle(trimmedValue);

            if (config.handlePattern.test(cleaned)) {
                const fullUrl = buildSocialUrl(fieldId, trimmedValue);
                return { valid: true, url: fullUrl };
            } else {
                return {
                    valid: false,
                    url: "",
                    error: `Please enter a valid ${fieldId} handle`,
                };
            }
        } else {
            const fullUrl = buildSocialUrl(fieldId, trimmedValue);
            return { valid: true, url: fullUrl };
        }
    }
}

export function validateURL(fieldId, errorMessage) {
    const field = document.getElementById(fieldId);
    if (!field) {
        return true;
    }

    const value = field.value.trim();

    if (!value) {
        return true;
    }

    if (fieldId === "website") {
        try {
            let url = value;
            if (!url.startsWith("http://") && !url.startsWith("https://")) {
                url = "https://" + url;
            }
            new URL(url);
            field.setAttribute("data-final-url", url);
            return true;
        } catch (e) {
            showError(fieldId, errorMessage);
            return false;
        }
    }

    const result = validateSocialMedia(fieldId, value);

    if (result.valid) {
        field.setAttribute("data-final-url", result.url);
        return true;
    } else {
        showError(fieldId, result.error || errorMessage);
        return false;
    }
}