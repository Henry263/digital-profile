// utils/device-detection.js
// Device Detection Utilities

export function isAndroid() {
    return /Android/i.test(navigator.userAgent);
}

export function isIOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

export function isIPad() {
    return (
        /iPad/.test(navigator.userAgent) ||
        (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
    );
}

export function isIPhone() {
    return /iPhone/.test(navigator.userAgent);
}

export function isDesktop() {
    return (
        !isIOS() &&
        !isIPad() &&
        !isAndroid() &&
        !/webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    );
}