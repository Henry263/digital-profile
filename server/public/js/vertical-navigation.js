// js/vertical-navigation.js
// Vertical Sidebar Navigation - Integrated with existing app structure

import { showPage } from './ui/navigation.js';
import { api } from './core/api-client.js';
import { getCurrentUser, logout } from './core/auth.js';
import { showSuccessMessage, showErrorMessage } from './ui/notifications.js';

/**
 * Initialize Vertical Navigation System
 */
export function initVerticalNavigation() {
    console.log('Initializing vertical navigation...');
    
    setupSidebarNavigation();
    setupMobileMenu();
    checkAuthenticationStatus();
    
    // Handle page routing on load (if URL has page parameter)
    handleInitialRoute();
}

/**
 * Setup Sidebar Navigation Click Handlers
 */
function setupSidebarNavigation() {
    const navItems = document.querySelectorAll('.sidebar .nav-item');
    
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Get the page from data attribute
            const page = this.getAttribute('data-page');
            
            if (page) {
                // Remove active class from all items
                navItems.forEach(nav => nav.classList.remove('active'));
                
                // Add active class to clicked item
                this.classList.add('active');
                
                // Use existing showPage function from navigation.js
                showPage(page);
                
                // Update URL
                updateURL(page);
                
                // Close mobile menu if open
                closeMobileMenu();
                
                // Scroll to top
                window.scrollTo(0, 0);
            }
        });
    });
}

/**
 * Setup Mobile Menu Toggle
 */
function setupMobileMenu() {
    const menuToggle = document.getElementById('mobileMenuToggle');
    const sidebar = document.querySelector('.sidebar');
    
    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', function() {
            sidebar.classList.toggle('mobile-open');
            
            // Update icon
            const icon = this.querySelector('i');
            if (sidebar.classList.contains('mobile-open')) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-times');
            } else {
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        });
        
        // Close menu when clicking outside on mobile
        document.addEventListener('click', function(e) {
            if (window.innerWidth <= 768) {
                if (!sidebar.contains(e.target) && !menuToggle.contains(e.target)) {
                    closeMobileMenu();
                }
            }
        });
    }
}

/**
 * Close Mobile Menu
 */
function closeMobileMenu() {
    if (window.innerWidth <= 768) {
        const sidebar = document.querySelector('.sidebar');
        const menuToggle = document.getElementById('mobileMenuToggle');
        
        if (sidebar && menuToggle) {
            sidebar.classList.remove('mobile-open');
            const icon = menuToggle.querySelector('i');
            if (icon) {
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        }
    }
}

/**
 * Check Authentication Status and Update UI
 */
async function checkAuthenticationStatus() {
    try {
        const user = getCurrentUser();
        
        if (user) {
            // User is authenticated
            updateUIForAuthenticatedUser(user);
        } else {
            // Check with API
            const response = await api.checkAuthStatus();
            
            if (response) {
                const userProfile = await api.getCurrentUser();
                if (userProfile.success && userProfile.user) {
                    updateUIForAuthenticatedUser(userProfile.user);
                } else {
                    updateUIForGuestUser();
                }
            } else {
                updateUIForGuestUser();
            }
        }
    } catch (error) {
        console.error('Auth check error:', error);
        updateUIForGuestUser();
    }
}

/**
 * Update UI for Authenticated User
 */
function updateUIForAuthenticatedUser(user) {
    // Show/hide appropriate navigation items
    const loginBtn = document.getElementById('loginBtnSidebar');
    const signupBtn = document.getElementById('signupBtnSidebar');
    const profileBtn = document.getElementById('profileBtnSidebar');
    const displayBtn = document.getElementById('displayBtnSidebar');
    const walletBtn = document.getElementById('walletBtnSidebar');
    const logoutBtn = document.getElementById('logoutBtnSidebar');
    const userProfileSection = document.getElementById('userProfileSection');
    
    if (loginBtn) loginBtn.classList.add('hidden');
    if (signupBtn) signupBtn.classList.add('hidden');
    if (profileBtn) profileBtn.classList.remove('hidden');
    if (displayBtn) displayBtn.classList.remove('hidden');
    if (walletBtn) walletBtn.classList.remove('hidden');
    if (logoutBtn) logoutBtn.style.display = 'flex';
    
    // Update user profile section
    if (userProfileSection) {
        userProfileSection.style.display = 'flex';
        
        const userName = document.getElementById('sidebarUserName');
        const userEmail = document.getElementById('sidebarUserEmail');
        const userInitials = document.getElementById('sidebarUserInitials');
        
        if (userName) userName.textContent = user.name || user.email || 'User';
        if (userEmail) userEmail.textContent = user.email || '';
        
        if (userInitials && (user.name || user.email)) {
            const name = user.name || user.email;
            const initials = name
                .split(' ')
                .map(word => word[0])
                .join('')
                .toUpperCase()
                .substring(0, 2);
            userInitials.textContent = initials;
        }
    }
}

/**
 * Update UI for Guest User
 */
function updateUIForGuestUser() {
    const loginBtn = document.getElementById('loginBtnSidebar');
    const signupBtn = document.getElementById('signupBtnSidebar');
    const profileBtn = document.getElementById('profileBtnSidebar');
    const displayBtn = document.getElementById('displayBtnSidebar');
    const walletBtn = document.getElementById('walletBtnSidebar');
    const logoutBtn = document.getElementById('logoutBtnSidebar');
    const userProfileSection = document.getElementById('userProfileSection');
    
    if (loginBtn) loginBtn.classList.remove('hidden');
    if (signupBtn) signupBtn.classList.remove('hidden');
    if (profileBtn) profileBtn.classList.add('hidden');
    if (displayBtn) displayBtn.classList.add('hidden');
    if (walletBtn) walletBtn.classList.add('hidden');
    if (logoutBtn) logoutBtn.style.display = 'none';
    if (userProfileSection) userProfileSection.style.display = 'none';
}

/**
 * Handle Logout
 */
async function handleLogout() {
    try {
        // Use existing logout function from auth.js
        await logout();
        
        // Update UI
        updateUIForGuestUser();
        
        // Redirect to home
        showPage('home');
        updateURL('home');
        setActiveNavItem('home');
        
        // Show notification
        showSuccessMessage('Logged out successfully');
    } catch (error) {
        console.error('Logout error:', error);
        showErrorMessage('Error logging out');
    }
}

/**
 * Setup Logout Button
 */
const logoutBtnSidebar = document.getElementById('logoutBtnSidebar');
if (logoutBtnSidebar) {
    logoutBtnSidebar.addEventListener('click', handleLogout);
}

/**
 * Update URL without reload
 */
function updateURL(page) {
    const url = new URL(window.location);
    url.searchParams.set('page', page);
    window.history.pushState({}, '', url);
}

/**
 * Set Active Navigation Item
 */
function setActiveNavItem(page) {
    const navItems = document.querySelectorAll('.sidebar .nav-item');
    navItems.forEach(item => {
        const itemPage = item.getAttribute('data-page');
        if (itemPage === page) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}

/**
 * Handle Initial Route on Page Load
 */
function handleInitialRoute() {
    const urlParams = new URLSearchParams(window.location.search);
    const page = urlParams.get('page');
    
    if (page) {
        setActiveNavItem(page);
    } else {
        // Default to home or display based on auth
        const currentUser = getCurrentUser();
        setActiveNavItem(currentUser ? 'display' : 'home');
    }
}

/**
 * Handle Browser Back/Forward Buttons
 */
window.addEventListener('popstate', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const page = urlParams.get('page') || 'home';
    showPage(page);
    setActiveNavItem(page);
});

/**
 * Export functions for use in other scripts
 */
if (typeof window !== 'undefined') {
    window.verticalNav = {
        init: initVerticalNavigation,
        setActive: setActiveNavItem,
        closeMobile: closeMobileMenu,
        checkAuth: checkAuthenticationStatus,
        updateAuthUI: updateUIForAuthenticatedUser,
        updateGuestUI: updateUIForGuestUser
    };
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    // console.log("True")
    document.addEventListener('DOMContentLoaded', initVerticalNavigation);
} else {
    // console.log("false")
    initVerticalNavigation();
}