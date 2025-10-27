// core/auth.js
// Authentication Logic

import { api } from './api-client.js';
import { showPage } from '../ui/navigation.js';
import { showSuccessMessage, showErrorMessage } from '../ui/notifications.js';
import { CryptoHelper } from '../core/crypto-helper.js';


export let currentUser = null;
export let userProfile = null;

export function setCurrentUser(user) {
  currentUser = user;
}

export function setUserProfile(profile) {
  userProfile = profile;
}

export function getCurrentUser() {
  return currentUser;
}

export function getUserProfile() {
  return userProfile;
}

export async function loginWithGoogle() {
  window.location.href = `${api.baseURL}/auth/google`;
}

export async function signupWithGoogle() {
  window.location.href = `${api.baseURL}/auth/google`;
}

export async function logout() {
  try {
    const success = await api.logout();
    if (success) {
      $("#navbarAvatar").css("display", "none");
      $("#navbarAvatarDesktop").css("display", "none");

      currentUser = null;
      userProfile = null;

      updateAuthUI();
      updateAuthUImobilebuttons();
      showPage("home");
      showSuccessMessage("Successfully logged out!");

      $("#footer-cta").removeClass("display-none-cta-button");
      $("#footer-cta").addClass("cta-section");

      $("#singup-cta-button-div-uc").removeClass("display-none-cta-button");
      $("#singup-cta-button-div-uc").addClass("usecase-cta");
    }
  } catch (error) {
    console.error("Logout error:", error);
    showErrorMessage("Error logging out. Please try again.");
  }
}

function toggleUserMenu() {
  const dropdown = document.getElementById('userDropdown');
  dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
}

export function updateAuthUI() {

  const authNav = document.getElementById('authNav');

  const loginBtn = document.getElementById("loginBtn");
  const signupBtn = document.getElementById("signupBtn");
  const profileBtn = document.getElementById("profileBtn");
  const displayBtn = document.getElementById("displayBtn");
  const walletBtn = document.getElementById("walletBtn");
  const logoutBtn = document.getElementById("logoutBtn");
  const faqBtn = document.getElementById("faqBtn");

  faqBtn?.classList.remove("hidden");

  if (currentUser) {
    //     authNav.innerHTML = `
    //   <div class="user-menu">
    //     <button class="user-avatar" onclick="toggleUserMenu()">
    //       ${currentUser.avatar ?
    //             `<img src="${currentUser.avatar}" alt="${currentUser.name}" />` :
    //             `<div class="avatar-initials">${getInitials(currentUser.name)}</div>`
    //         }
    //     </button>
    //     <div class="user-dropdown" id="userDropdown" style="display: none;">
    //       <div class="dropdown-header">
    //         <strong>${currentUser.name}</strong>
    //         <small>${currentUser.email}</small>
    //       </div>
    //       <a href="#" onclick="showPage('profile'); return false;">
    //         <i class="fas fa-user"></i> My Profile
    //       </a>
    //       <a href="#" onclick="logout(); return false;">
    //         <i class="fas fa-sign-out-alt"></i> Logout
    //       </a>
    //     </div>
    //   </div>
    // `;
    loginBtn?.classList.add("hidden");
    signupBtn?.classList.add("hidden");
    profileBtn?.classList.remove("hidden");
    displayBtn?.classList.remove("hidden");
    walletBtn?.classList.remove("hidden");
    logoutBtn?.classList.remove("hidden");
  } else {

    //     authNav.innerHTML = `
    //   <button class="btn-nav-login" onclick="showPage('emailLoginPage'); return false;">
    //     Login
    //   </button>
    //   <button class="btn-nav-signup" onclick="showPage('emailSignupPage'); return false;">
    //     Sign Up
    //   </button>
    // `;
    loginBtn?.classList.remove("hidden");
    signupBtn?.classList.remove("hidden");
    profileBtn?.classList.add("hidden");
    displayBtn?.classList.add("hidden");
    walletBtn?.classList.add("hidden");
    logoutBtn?.classList.add("hidden");
  }
}

export function updateAuthUImobilebuttons() {
  const loginBtn = document.getElementById("loginBtnMobile");
  const signupBtn = document.getElementById("signupBtnMobile");
  const profileBtn = document.getElementById("profileBtnMobile");
  const displayBtn = document.getElementById("displayBtnMobile");
  const walletBtn = document.getElementById("walletBtnMobile");
  const logoutBtn = document.getElementById("logoutBtnMobile");
  const faqBtn = document.getElementById("faqBtnMobile");

  faqBtn?.classList.remove("hidden");

  if (currentUser) {
    loginBtn?.classList.add("hidden");
    signupBtn?.classList.add("hidden");
    profileBtn?.classList.remove("hidden");
    displayBtn?.classList.remove("hidden");
    walletBtn?.classList.remove("hidden");
    logoutBtn?.classList.remove("hidden");
  } else {
    loginBtn?.classList.remove("hidden");
    signupBtn?.classList.remove("hidden");
    profileBtn?.classList.add("hidden");
    displayBtn?.classList.add("hidden");
    walletBtn?.classList.add("hidden");
    logoutBtn?.classList.add("hidden");
  }
}

export async function getUserStatus() {
  try {
    const data = await $.ajax({
      url: `auth/status`,
      method: "GET",
      dataType: "json",
    });
    return data;
  } catch (error) {
    console.log("Failed to fetch user:", error.message);
  }
}

/**
 * New Code
 */

// Auth API Functions
const authAPI = {
  baseURL: window.location.origin,

  /**
   * Initialize Auth API
   */
  async initialize() {
    // Verify CryptoHelper is available
    if (!window.CryptoHelper) {
      console.error('❌ CryptoHelper not loaded!');
      return false;
    }

    // Initialize crypto functionality
    const cryptoReady = await window.CryptoHelper.initialize();
    if (!cryptoReady) {
      console.error('❌ Crypto functionality not available');
      return false;
    }

    console.log('✅ Auth API initialized');
    return true;
  },
  async signup(email, passwordnormal, name) {
    const password = await CryptoHelper.hashPassword(passwordnormal);
    const response = await fetch(`${this.baseURL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password, name })
    });
    return await response.json();
  },

  async verifyEmail(email, code) {
    const response = await fetch(`${this.baseURL}/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, code })
    });
    return await response.json();
  },

  async resendVerification(email) {
    const response = await fetch(`${this.baseURL}/auth/resend-verification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email })
    });
    return await response.json();
  },

  async login(email, passwordnormal) {
    const password = await CryptoHelper.hashPassword(passwordnormal);
    const response = await fetch(`${this.baseURL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password })
    });
    return await response.json();
  },

  async forgotPassword(email) {
    const response = await fetch(`${this.baseURL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email })
    });
    return await response.json();
  },

  async resetPassword(token, passwordnormal) {
    const password = await CryptoHelper.hashPassword(passwordnormal);
    const response = await fetch(`${this.baseURL}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ token, password })
    });
    return await response.json();
  }
};

// Password Strength Checker
function checkPasswordStrength(password) {
  let strength = 0;
  const requirements = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[@$!%*?&#]/.test(password)
  };

  // Update requirements UI
  Object.keys(requirements).forEach(key => {
    const element = document.getElementById(`req-${key}`);
    if (element) {
      if (requirements[key]) {
        element.classList.add('valid');
        strength++;
      } else {
        element.classList.remove('valid');
      }
    }
  });

  // Update strength bar
  const strengthBarFill = document.getElementById('strengthBarFill');
  const strengthText = document.getElementById('strengthText');

  if (strengthBarFill && strengthText) {
    strengthBarFill.className = 'strength-bar-fill';

    if (strength <= 2) {
      strengthBarFill.classList.add('weak');
      strengthText.textContent = 'Weak password';
      strengthText.style.color = '#e74c3c';
    } else if (strength <= 4) {
      strengthBarFill.classList.add('medium');
      strengthText.textContent = 'Medium password';
      strengthText.style.color = '#f39c12';
    } else {
      strengthBarFill.classList.add('strong');
      strengthText.textContent = 'Strong password';
      strengthText.style.color = '#27ae60';
    }
  }

  return requirements;
}

function checkPasswordStrengthnewpassword(password) {
  let strength = 0;
  const requirements = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[@$!%*?&#]/.test(password)
  };

  // Update requirements UI
  Object.keys(requirements).forEach(key => {
    const element = document.getElementById(`req-newpass-${key}`);
    if (element) {
      if (requirements[key]) {
        element.classList.add('valid');
        strength++;
      } else {
        element.classList.remove('valid');
      }
    }
  });

  // Update strength bar
  const strengthBarFill = document.getElementById('strengthBarFillnewpass');
  const strengthText = document.getElementById('strengthTextnewpass');

  if (strengthBarFill && strengthText) {
    strengthBarFill.className = 'strength-bar-fill-newpass';

    if (strength <= 2) {
      strengthBarFill.classList.add('weak');
      strengthText.textContent = 'Weak password';
      strengthText.style.color = '#e74c3c';
    } else if (strength <= 4) {
      strengthBarFill.classList.add('medium');
      strengthText.textContent = 'Medium password';
      strengthText.style.color = '#f39c12';
    } else {
      strengthBarFill.classList.add('strong');
      strengthText.textContent = 'Strong password';
      strengthText.style.color = '#27ae60';
    }
  }

  return requirements;
}

// Toggle Password Visibility
// function togglePassword(inputId) {
//   const input = document.getElementById(inputId);
//   const button = input.nextElementSibling;
//   const icon = button.querySelector('i');

//   if (input.type === 'password') {
//     input.type = 'text';
//     icon.classList.remove('fa-eye');
//     icon.classList.add('fa-eye-slash');
//   } else {
//     input.type = 'password';
//     icon.classList.remove('fa-eye-slash');
//     icon.classList.add('fa-eye');
//   }
// }



$(document).on('click', '#signinbackbtn', function () {
  showPage('login')
});

$(document).on('click', '.loginbutton', function () {
  showPage('login')
});


$(document).on('click', '#backsignupbtn', function () {
  showPage('signup')
});

$(document).on('click', '#signupbutton', function () {
  showPage('signup')
});

$(document).on('click', '.forgot-link', function () {
  showPage('forgotPassword')
});

$(document).on('click', '#forgotBtn', async function () {
  console.log("forgot password email link");
  const forgetpasswordForm = document.getElementById('forgotPasswordForm');
  const formData = new FormData(forgetpasswordForm);
  const email = formData.get('email').trim().toLowerCase();
  console.log("Email data from form: ", email)
  try {
    const result = await authAPI.forgotPassword(email);

    if (result && result.success) {
      showSuccessMessage("Check your email.")
      showPage("login");
    } else {
      showErrorMessage("Error while sending reset link");
      showPage("login");
    }
  } catch (error) {
    console.log("There is an error while sending reset password link: ", error.message);
    showErrorMessage("Error while sending reset link: " + error.message);
    showPage("login");
  }

});


$(document).on('click', '.toggle-password', function () {
  const button = $(this);
  const inputId = button.data('passtype'); // jQuery automatically reads data-passtype
  const input = $('#' + inputId);
  const icon = button.find('i');

  if (input.attr('type') === 'password') {
    input.attr('type', 'text');
    icon.removeClass('fa-eye').addClass('fa-eye-slash');
  } else {
    input.attr('type', 'password');
    icon.removeClass('fa-eye-slash').addClass('fa-eye');
  }
});

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop().split(';').shift();
  }
  return null;
}
function clearloginform() {
  document.getElementById('loginEmail').value = '';
  document.getElementById('loginPassword').value = '';
}

function clearResetpasswordform() {
  document.getElementById('newPassword').value = '';
  document.getElementById('confirmPassword').value = '';
}


function clearsignupform() {
  document.getElementById('signupName').value = '';
  document.getElementById('signupEmail').value = '';
  document.getElementById('signupPassword').value = '';
}

$(document).on('click', '#resetBtn', async function () {
  try {
    const confirmpasswordInput = document.getElementById('confirmPassword');
    const newpasswordInput = document.getElementById('newPassword');

    const confirmPassword = confirmpasswordInput.value.trim();
    const newPassword = newpasswordInput.value.trim();

    if (confirmPassword === newPassword) {

      if (newPassword && confirmPassword) {
        const resetToken = getCookie('passResetToken');
        if (resetToken) {
          const response = await authAPI.resetPassword(resetToken, confirmPassword);

          console.log("final output token", response);
          if (response && response.success) {
            showSuccessMessage("Password Reset Successfully");
            showPage("login")
            clearResetpasswordform();
          } else {
            showErrorMessage("Network Error", response);
            showPage("login")
          }
        } else {
          showErrorMessage("Token is expired sp request again.");
          showPage("login")
        }

      } else {
        showErrorMessage("Empty Values")
      }

    } else {
      showErrorMessage("Password and confirm password are not matching")
    }
  } catch (err) {
    console.log("On click reset password button", err.message);
  }
});

// Reset and create new password flow
document.addEventListener('DOMContentLoaded', async function () {
  try {
    const resetpasswordForm = document.getElementById('resetPasswordForm');
    if (resetpasswordForm) {
      const confirmpasswordInput = document.getElementById('confirmPassword');
      const newpasswordInput = document.getElementById('newPassword');
      let allValid;
      if (confirmpasswordInput) {
        confirmpasswordInput.addEventListener('input', (e) => {
          const requirements = checkPasswordStrengthnewpassword(e.target.value);
          allValid = Object.values(requirements).every(v => v === true);

        });
      }
      if (newpasswordInput) {
        newpasswordInput.addEventListener('input', (e) => {
          const requirements = checkPasswordStrengthnewpassword(e.target.value);
          allValid = Object.values(requirements).every(v => v === true);
        });
      }



      if (!allValid) {
        document.getElementById('passwordErrornewpass').textContent =
          'Please meet all password requirements';
        return;
      }
    }
  } catch (err) {
    console.log("Error in validating reset password:", err.message);
  }
});
// Email Signup Form Handler
document.addEventListener('DOMContentLoaded', function () {
  const signupForm = document.getElementById('emailSignupForm');
  if (signupForm) {
    const passwordInput = document.getElementById('signupPassword');

    // Password strength checker
    if (passwordInput) {
      passwordInput.addEventListener('input', (e) => {
        checkPasswordStrength(e.target.value);
      });
    }

    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const submitBtn = document.getElementById('createaccountBtn');
      const originalText = submitBtn.innerHTML;

      // Clear previous errors
      document.querySelectorAll('.error-message').forEach(el => el.textContent = '');

      const formData = new FormData(signupForm);
      const name = formData.get('name').trim();
      const email = formData.get('email').trim().toLowerCase();
      const password = formData.get('password');


      // Validate password strength
      const requirements = checkPasswordStrength(password);
      const allValid = Object.values(requirements).every(v => v === true);

      if (!allValid) {
        document.getElementById('passwordError').textContent =
          'Please meet all password requirements';
        return;
      }

      // Disable button
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating Account...';

      try {

        const result = await authAPI.signup(email, password, name);

        if (result.success) {
          // Store email for verification page
          sessionStorage.setItem('verificationEmail', email);

          // Check if we need to redirect to verification
          if (result.redirectToVerification) {
            if (result.codeResent) {
              showSuccessMessage('New verification code sent! Please check your email.');
            } else if (result.codeExpiresIn) {
              const minutes = Math.floor(result.codeExpiresIn / 60);
              showSuccessMessage(`Verification code already sent! Valid for ${minutes} more minutes.`);
            } else {
              showSuccessMessage('Account created! Please check your email for verification code.');
            }

            // Redirect to verification page
            setTimeout(() => {
              document.getElementById('verificationEmail').textContent = email;
              showPage('emailVerification');
            }, 1500);
          } else {
            showSuccessMessage('Account created! Please check your email for verification code.');
            setTimeout(() => {
              document.getElementById('verificationEmail').textContent = email;
              showPage('emailVerification');
            }, 1500);
          }
        } else {
          // Handle different error types
          if (result.useGoogleOAuth) {
            showErrorMessage('Gmail accounts must use Google Sign-In');
            setTimeout(() => loginWithGoogle(), 2000);
          } else if (result.redirectToLogin) {
            showErrorMessage(result.message || 'Account already exists. Please login.');
            setTimeout(() => showPage('emailLoginPage'), 2000);
          } else {
            showErrorMessage(result.message || 'Signup failed');
            if (result.message && result.message.includes('email')) {
              document.getElementById('emailError').textContent = result.message;
            }
          }
        }
      } catch (error) {
        console.error('Signup error:', error);
        showErrorMessage('Network error. Please try again.');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
      }
    });
  }
});

// Email Verification Form Handler
document.addEventListener('DOMContentLoaded', function () {

  const verificationForm = document.getElementById('emailVerificationForm');
  if (verificationForm) {
    const codeInput = document.getElementById('verificationCode');

    // Auto-format code input (only numbers)
    if (codeInput) {
      codeInput.addEventListener('input', (e) => {
        // Remove non-digits and limit to 6 characters
        e.target.value = e.target.value.replace(/\D/g, '').substring(0, 6);
      });

      // Auto-submit when 6 digits entered (optional)
      codeInput.addEventListener('input', (e) => {
        if (e.target.value.length === 6) {
          // Optional: auto-submit after brief delay
          setTimeout(() => {
            if (codeInput.value.length === 6) {
              verificationForm.dispatchEvent(new Event('submit'));
            }
          }, 500);
        }
      });
    }

    verificationForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const submitBtn = document.getElementById('verifyBtn');
      const originalText = submitBtn.innerHTML;

      // Clear previous error
      document.getElementById('codeError').textContent = '';

      const code = document.getElementById('verificationCode').value.trim();
      const email = sessionStorage.getItem('verificationEmail');

      // Validate code
      if (!code || code.length !== 6) {
        document.getElementById('codeError').textContent = 'Please enter a valid 6-digit code';
        return;
      }

      if (!email) {
        showErrorMessage('Session expired. Please sign up again.');
        showPage('emailSignupPage');
        return;
      }

      // Disable button
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verifying...';

      try {
        const result = await authAPI.verifyEmail(email, code);

        if (result.success) {
          showSuccessMessage('Email verified successfully! Redirecting...');
          sessionStorage.removeItem('verificationEmail');

          // Store token if provided
          // if (result.token) {
          //   localStorage.setItem('authToken', result.token);
          // }
          if (result.token) {
            localStorage.setItem('authToken', result.token);
            api.setToken(result.token); // Add this line
          }
          $("#signupName").empty();
          $("#signupEmail").empty();
          $("#signupPassword").empty();

          clearsignupform();

          if (window.verticalNav && window.verticalNav.checkAuth) {
            await window.verticalNav.checkAuth();
          }
          
          // Redirect to profile page after successful verification
          setTimeout(() => {
            window.location.href = '/?page=profile';
          }, 1000);
        } else {
          // Handle different error cases
          if (result.expired) {
            showErrorMessage('Verification code expired. Please request a new one.');
            document.getElementById('codeError').textContent = 'Code expired';
          } else {
            showErrorMessage(result.message || 'Invalid verification code');
            document.getElementById('codeError').textContent = result.message || 'Invalid code';
          }

          // Clear the input
          document.getElementById('verificationCode').value = '';
          document.getElementById('verificationCode').focus();
        }
      } catch (error) {
        console.error('Verification error:', error);
        showErrorMessage('Network error. Please try again.');
        document.getElementById('codeError').textContent = 'Network error';
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
      }
    });
  }
});

// Resend Verification Code
async function resendVerificationCode() {
  const email = sessionStorage.getItem('verificationEmail');

  if (!email) {
    showErrorMessage('Session expired. Please sign up again.');
    showPage('signup');
    return;
  }

  try {
    const result = await authAPI.resendVerification(email);

    if (result.success) {
      showSuccessMessage('Verification code sent!');
    } else {
      showErrorMessage(result.message || 'Failed to resend code');
    }
  } catch (error) {
    console.error('Resend error:', error);
    showErrorMessage('Network error. Please try again.');
  }
}

$(document).on('click', '#resendverification', async function () {
  await resendVerificationCode()
});

async function checkWalletPendingAdd() {
  const urlParams = new URLSearchParams(window.location.search);
  const addtowallet = urlParams.get("redirectToWallet");
  const pagename = urlParams.get("page");
  if (pagename === "login" && (addtowallet == 'true' || addtowallet)) {
    const walletcardid = sessionStorage.getItem('pendingWalletCard');
    if (walletcardid) {
      const response = await fetch(`/api/wallet/add/${walletcardid}`, {
        method: "POST",
        credentials: "include",
      });

      const data = await response.json();

      if (data.success) {
       
        showSuccessMessage("Card added to your wallet! You can view it in the Wallet tab.")
        // Show success message
        // setTimeout(() => {
        //     alert("Card added to your wallet! You can view it in the Wallet tab.");
        // }, 300);

        setTimeout(() => {
         // Use .prop()
        }, 1000);
        window.open('/wallet');

      } else {
        throw new Error(data.message || "Failed to add card");
      }
    } else {
      window.open('/login');
    }

  } else {

  }
}
async function userLogin() {
  try {
    const email = $('#loginEmail').val().trim();
    const password = $('#loginPassword').val().trim();

    const result = await authAPI.login(email, password);

    if (result.success) {
      // ✅ CRITICAL: Store the token first!
      if (result.token) {
        localStorage.setItem('authToken', result.token);
        // Update the API client's token
        api.setToken(result.token);
      }

      showSuccessMessage('Login successful.');
      clearloginform();
      // Now get user data
      const user = await api.getCurrentUser();
      const response = await api.getProfile();

      if (user.success && (response.success && response.profile)) {
        setCurrentUser(user.user);
        const userProfile = response.profile;
        setUserProfile(userProfile);
        updateAuthUI();
        updateAuthUImobilebuttons();
        if (window.verticalNav && window.verticalNav.updateAuthUI) {
          window.verticalNav.updateAuthUI(user.user);
        }

        showPage("display");
        checkWalletPendingAdd();
      } else {
        showErrorMessage('Issue while getting current user');
      }
    } else {
      // Handle different error types
      if (result.useGoogleOAuth) {
        showErrorMessage('This account uses Google Sign-In');
        setTimeout(() => loginWithGoogle(), 2000);
      } else if (result.emailNotVerified) {
        showErrorMessage('Please verify your email first');
        sessionStorage.setItem('verificationEmail', email);
        setTimeout(() => showPage('emailVerification'), 2000);
      } else {
        showErrorMessage(result.message || 'Login failed');
      }
    }

  } catch (error) {
    console.error('Login error:', error.message);
    showErrorMessage('Network error. Please try again.');
  }
}


$(document).on('click', '#signinBtn', async function () {
  await userLogin()
});

$(document).ready(function () {
  $('#loginPassword').on('keypress', async function (event) {
    if (event.which === 13 || event.keyCode === 13) {
      event.preventDefault();
      await userLogin()
    }
  });
});


// Add animations to your CSS if not already present
const style = document.createElement('style');
style.textContent = `
  @keyframes slideInRight {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  @keyframes slideOutRight {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);