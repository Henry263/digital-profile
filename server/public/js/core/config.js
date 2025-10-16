// core/config.js
// Configuration and Constants

export const APP_CONFIG = {
    baseURL: window.location.origin,
    apiTimeout: 30000,
    qrCodeSize: 400,
    maxPhotoSize: 5 * 1024 * 1024, // 5MB
    maxNameLength: 60,
    maxOrgLength: 60
};

export const SOCIAL_MEDIA_PLATFORMS = {
    instagram: {
        baseUrl: "https://instagram.com/",
        domains: ["instagram.com"],
        handlePattern: /^@?[\w](?!.*?\.{2})[\w.]{0,28}[\w]$/,
    },
    facebook: {
        baseUrl: "https://facebook.com/",
        domains: ["facebook.com", "fb.com"],
        handlePattern: /^@?[a-zA-Z0-9.]{3,}$/,
    },
    twitter: {
        baseUrl: "https://twitter.com/",
        domains: ["twitter.com", "x.com"],
        handlePattern: /^@?[a-zA-Z0-9_]{1,15}$/,
    },
    linkedin: {
        baseUrl: "https://linkedin.com/in/",
        domains: ["linkedin.com"],
        handlePattern: /^[a-zA-Z0-9-]{3,100}$/,
    },
    youtube: {
        baseUrl: "https://youtube.com/@",
        domains: ["youtube.com", "youtu.be"],
        handlePattern: /^@?[a-zA-Z0-9_-]{3,30}$/,
    },
    tiktok: {
        baseUrl: "https://tiktok.com/@",
        domains: ["tiktok.com"],
        handlePattern: /^@?[a-zA-Z0-9_.]{2,24}$/,
    },
    snapchat: {
        baseUrl: "https://snapchat.com/add/",
        domains: ["snapchat.com"],
        handlePattern: /^[a-zA-Z][a-zA-Z0-9._-]{1,15}$/,
    },
    whatsapp: {
        baseUrl: "https://wa.me/",
        domains: ["wa.me", "whatsapp.com"],
        handlePattern: /^\+?[1-9]\d{1,14}$/,
    },
    calendly: {
        baseUrl: "https://calendly.com/",
        domains: ["calendly.com"],
        handlePattern: /^[a-zA-Z0-9-_]{3,30}$/,
    },
    telegram: {
        baseUrl: "https://t.me/",
        domains: ["t.me", "telegram.com", "telegram.me"],
        handlePattern: /^@?[a-zA-Z0-9_]{5,32}$/,
    },
    reddit: {
        baseUrl: "https://reddit.com/u/",
        domains: ["reddit.com"],
        handlePattern: /^(u\/)?[a-zA-Z0-9_-]{3,20}$/,
    },
    pinterest: {
        baseUrl: "https://pinterest.com/",
        domains: ["pinterest.com"],
        handlePattern: /^[a-zA-Z0-9_]{3,30}$/,
    },
    zoom: {
        baseUrl: "",
        domains: ["zoom.us", "zoom.com"],
        handlePattern: null,
    }
};

export const COMMON_TLDS = [
    "com", "org", "net", "edu", "gov", "co", "io", "ai", "app", "dev",
    "uk", "us", "ca", "au", "de", "fr", "in", "me", "info", "biz",
    "ly", "it", "es", "ru", "jp", "cn", "br", "mx", "id", "ph",
    "vn", "tv", "cc", "ws", "mobi", "online", "site", "tech", "store", "xyz"
];

export const SOCIAL_ICONS = {
    instagram: '<i class="fab fa-instagram"></i>',
    facebook: '<i class="fab fa-facebook"></i>',
    twitter: '<i class="fab fa-twitter"></i>',
    linkedin: '<i class="fab fa-linkedin"></i>',
    calendly: '<i class="fas fa-calendar-alt"></i>',
    snapchat: '<i class="fab fa-snapchat"></i>',
    tiktok: '<i class="fab fa-tiktok"></i>',
    youtube: '<i class="fab fa-youtube"></i>',
    whatsapp: '<i class="fab fa-whatsapp"></i>',
    zoom: '<i class="fas fa-headphones"></i>',
    reddit: '<i class="fa-brands fa-reddit"></i>',
    telegram: '<i class="fa-brands fa-telegram"></i>',
    pinterest: '<i class="fa-brands fa-pinterest"></i>'
};

export const VALID_SOCIAL_FIELDS = [
    "instagram", "facebook", "twitter", "linkedin", "calendly",
    "zoom", "snapchat", "tiktok", "youtube", "whatsapp",
    "telegram", "reddit", "pinterest"
];