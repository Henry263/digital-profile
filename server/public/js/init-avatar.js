// Add this to your main.js or create a separate file and include it on all pages

// Initialize avatar on page load
async function initializeAvatar() {
    const token = localStorage.getItem('token');
    
    if (!token) {
        $('#navbarAvatar').hide();
        return;
    }

    try {
        const response = await $.ajax({
            url: '/api/profile',
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + token
            }
        });

        if (response.success) {
            displayNavbarAvatar(response.profile);
        }
    } catch (error) {
        console.error('Error loading avatar:', error);
        $('#navbarAvatar').hide();
    }
}

// Display avatar in navbar
function displayNavbarAvatar(profile) {
    let navbarAvatar = $('#navbarAvatar');
    
    // Show the avatar container
    navbarAvatar.show().empty();

    if (profile.hasProfilePhoto) {
        // Display profile photo
        navbarAvatar.html(`
            <img src="/api/profile/photo/${profile._id}" 
                 alt="${profile.name || profile.username}" 
                 onerror="this.style.display='none'; this.parentElement.textContent='${profile.initials}';">
        `);
    } else {
        // Display initials
        navbarAvatar.text(profile.initials);
    }
    
    // Make avatar clickable
    navbarAvatar.css('cursor', 'pointer').off('click').on('click', function() {
        window.location.href = '/profile';
    });
}

// Call on every page load
$(document).ready(function() {
    initializeAvatar();
});

// Refresh avatar when returning to page (e.g., after updating profile)
$(window).on('focus', function() {
    initializeAvatar();
});