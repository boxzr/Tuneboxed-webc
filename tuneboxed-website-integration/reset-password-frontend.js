// TuneBoxed Password Reset Frontend JavaScript
// Replace your existing frontend code with this to avoid CORS issues

// Get reset token from URL parameters
const urlParams = new URLSearchParams(window.location.search);
const resetToken = urlParams.get('token');

// Main password reset function
async function resetPassword(newPassword, confirmPassword) {
    // Clear any previous messages
    clearMessages();
    
    // Validation
    if (!resetToken) {
        showError('Invalid reset link. Please request a new password reset.');
        return;
    }
    
    if (!newPassword || !confirmPassword) {
        showError('Please fill in all fields.');
        return;
    }
    
    if (newPassword !== confirmPassword) {
        showError('Passwords do not match.');
        return;
    }
    
    if (newPassword.length < 8) {
        showError('Password must be at least 8 characters long.');
        return;
    }
    
    // Basic password strength check
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
        showWarning('For better security, use a mix of uppercase, lowercase, and numbers.');
    }
    
    try {
        // Show loading state
        setLoadingState(true);
        
        console.log('🔄 Sending password reset request...');
        
        // Call YOUR backend API (same domain = no CORS issues!)
        const response = await fetch('/api/reset-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                token: resetToken,
                newPassword: newPassword
            })
        });
        
        const result = await response.json();
        console.log('📡 API Response:', result);
        
        if (response.ok && result.success) {
            showSuccess('✅ Password reset successful! Redirecting to app...');
            
            // Redirect back to iOS app after 3 seconds
            setTimeout(() => {
                console.log('🔗 Redirecting to app...');
                window.location.href = result.redirectUrl || 'tuneboxed://password-reset-success';
            }, 3000);
            
        } else {
            showError(result.error || 'Password reset failed. Please try again.');
        }
        
    } catch (error) {
        console.error('❌ Network error:', error);
        showError('Network error. Please check your connection and try again.');
    } finally {
        setLoadingState(false);
    }
}

// UI Helper Functions
function showError(message) {
    const errorDiv = document.getElementById('error-message') || createMessageDiv('error-message', 'error');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    console.error('❌ Error:', message);
}

function showSuccess(message) {
    const successDiv = document.getElementById('success-message') || createMessageDiv('success-message', 'success');
    successDiv.textContent = message;
    successDiv.style.display = 'block';
    console.log('✅ Success:', message);
}

function showWarning(message) {
    const warningDiv = document.getElementById('warning-message') || createMessageDiv('warning-message', 'warning');
    warningDiv.textContent = message;
    warningDiv.style.display = 'block';
    console.warn('⚠️ Warning:', message);
}

function clearMessages() {
    const messageTypes = ['error-message', 'success-message', 'warning-message'];
    messageTypes.forEach(id => {
        const div = document.getElementById(id);
        if (div) {
            div.style.display = 'none';
            div.textContent = '';
        }
    });
}

function createMessageDiv(id, className) {
    const div = document.createElement('div');
    div.id = id;
    div.className = `message ${className}`;
    div.style.display = 'none';
    
    // Try to insert after form or at beginning of container
    const form = document.getElementById('reset-form');
    const container = document.querySelector('.container') || document.body;
    
    if (form && form.parentNode) {
        form.parentNode.insertBefore(div, form.nextSibling);
    } else {
        container.appendChild(div);
    }
    
    return div;
}

function setLoadingState(loading) {
    const submitBtn = document.getElementById('submit-btn') || document.querySelector('button[type="submit"]');
    const passwordInputs = document.querySelectorAll('input[type="password"]');
    
    if (submitBtn) {
        submitBtn.disabled = loading;
        if (loading) {
            submitBtn.dataset.originalText = submitBtn.textContent;
            submitBtn.innerHTML = '🔄 Resetting...';
        } else {
            submitBtn.textContent = submitBtn.dataset.originalText || 'Reset Password';
        }
    }
    
    // Disable password inputs during loading
    passwordInputs.forEach(input => {
        input.disabled = loading;
    });
}

// Form Setup and Event Handlers
function setupForm() {
    // Check if we have a reset token
    if (!resetToken) {
        showError('Invalid reset link. Please request a new password reset from the TuneBoxed app.');
        return;
    }
    
    console.log('🔗 Reset token found:', resetToken.substring(0, 8) + '...');
    
    // Find and setup the form
    const form = document.getElementById('reset-form') || document.querySelector('form');
    
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const newPassword = document.getElementById('new-password')?.value || 
                               document.getElementById('password')?.value || 
                               document.querySelector('input[name="password"]')?.value;
                               
            const confirmPassword = document.getElementById('confirm-password')?.value || 
                                  document.getElementById('confirmPassword')?.value || 
                                  document.querySelector('input[name="confirmPassword"]')?.value;
            
            resetPassword(newPassword, confirmPassword);
        });
        
        console.log('✅ Form event listener attached');
    } else {
        console.error('❌ Could not find password reset form');
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 TuneBoxed Password Reset - Frontend Initialized');
    setupForm();
});

// Also initialize if script loads after DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupForm);
} else {
    setupForm();
}
