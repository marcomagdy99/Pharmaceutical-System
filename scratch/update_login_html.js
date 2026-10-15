const fs = require('fs');

let html = fs.readFileSync('login.html', 'utf8');

const target = `            </div>
            <!-- END: Login Form View -->`;

const forceBoxHtml = `            </div>
            <!-- END: Login Form View -->

            <!-- START: Force Password Change View -->
            <div class="login-box" id="forcePasswordBox" style="display: none;">
                <div class="logo-container">
                    <img src="images/pharma-icon-192.png" alt="PharmaCare Logo" class="login-logo-img">
                    <h1 class="logo-title">PharmaCare</h1>
                    <p class="logo-subtitle text-primary fw-bold" id="forcePassSubtitle" style="color: var(--primary-color, #0d6efd) !important;">🔒 First-Time Security Setup</p>
                </div>

                <div class="alert alert-info py-2 px-3 mb-3 border-0 rounded-3 text-start" id="forcePassNotice" style="font-size: 0.85rem; line-height: 1.5; background: rgba(13, 110, 253, 0.08); color: var(--text-primary, #1e293b); border-inline-start: 4px solid #0d6efd !important;">
                    <i class="fas fa-user-shield me-2 text-primary"></i>
                    <span id="forcePassNoticeText">Welcome! For security, you must choose a new personal password before accessing the system.</span>
                </div>

                <div class="error-message" id="forcePassError" style="display: none;">
                    <i class="fas fa-exclamation-circle error-icon"></i>
                    <span id="forcePassErrorText">Please meet all password requirements.</span>
                </div>

                <div class="form-group mb-3">
                    <label class="form-label" id="lblNewPassword">New Password</label>
                    <div class="input-group">
                        <i class="fas fa-key input-icon" style="line-height: inherit; font-size: 16px;"></i>
                        <input type="password" id="forceNewPassword" class="form-control" placeholder="Enter new password (min. 8 characters)" autocomplete="new-password">
                        <button type="button" class="password-toggle" id="toggleForceNewPassword" onclick="toggleForcePasswordVisibility('forceNewPassword', this)">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                    <div class="progress mt-2" style="height: 4px; background: #e2e8f0; border-radius: 4px; overflow: hidden;">
                        <div id="forceStrengthBar" class="progress-bar bg-danger" style="width: 0%; height: 100%; transition: width 0.3s, background-color 0.3s;"></div>
                    </div>
                </div>

                <div class="form-group mb-3">
                    <label class="form-label" id="lblConfirmPassword">Confirm New Password</label>
                    <div class="input-group">
                        <i class="fas fa-check-double input-icon" style="line-height: inherit; font-size: 16px;"></i>
                        <input type="password" id="forceConfirmPassword" class="form-control" placeholder="Confirm your new password" autocomplete="new-password" onkeydown="if(event.key==='Enter') submitForcePasswordChange()">
                        <button type="button" class="password-toggle" id="toggleForceConfirmPassword" onclick="toggleForcePasswordVisibility('forceConfirmPassword', this)">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                </div>

                <div class="password-requirements text-start mb-3" style="font-size: 0.8rem; color: #64748b; line-height: 1.6;">
                    <div id="chkLength"><i class="fas fa-circle text-muted me-1" style="font-size: 7px;"></i> <span>At least 8 characters</span></div>
                    <div id="chkComplexity"><i class="fas fa-circle text-muted me-1" style="font-size: 7px;"></i> <span>Contains letters and numbers</span></div>
                    <div id="chkMatch"><i class="fas fa-circle text-muted me-1" style="font-size: 7px;"></i> <span>Passwords match</span></div>
                </div>

                <button type="button" class="btn-login" id="btnSubmitForcePassword" onclick="submitForcePasswordChange()">
                    <span class="btn-text" id="btnSubmitForceText">Save Password & Continue</span>
                    <div class="spinner"></div>
                </button>

                <div class="login-footer">
                    <span>© 2026 PharmaCare. All rights reserved.</span>
                </div>
            </div>
            <!-- END: Force Password Change View -->`;

if (html.includes(target)) {
  html = html.replace(target, forceBoxHtml);
  fs.writeFileSync('login.html', html, 'utf8');
  console.log('✅ Updated login.html with forcePasswordBox');
} else {
  console.error('❌ Could not find target in login.html');
}
