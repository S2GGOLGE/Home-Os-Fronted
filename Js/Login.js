document.addEventListener('DOMContentLoaded', () => {

    // ── Giriş Formu ───────────────────────────────────────────────────────────

    const togglePassword = document.getElementById('togglePassword');
    const password       = document.getElementById('password');
    const loginForm      = document.getElementById('loginForm');
    const username       = document.getElementById('username');
    const remember       = document.getElementById('remember');
    const rememberedUsername = localStorage.getItem('homeasistan_remembered_username');

    if (rememberedUsername) {
        username.value  = rememberedUsername;
        remember.checked = true;
        password.focus();
    } else {
        username.focus();
    }

    // Şifre Göster / Gizle
    togglePassword.addEventListener('click', function () {
        const type = password.getAttribute('type') === 'password' ? 'text' : 'password';
        password.setAttribute('type', type);
        const icon = this.querySelector('i');
        icon.classList.toggle('fa-eye');
        icon.classList.toggle('fa-eye-slash');
    });

    // Giriş Yap
    loginForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        const btn             = this.querySelector('.btn-login');
        const originalContent = btn.innerHTML;
        const originalBg      = btn.style.background || '';
        const usernameVal     = username.value.trim();
        const passwordVal     = password.value;

        btn.innerHTML      = '<i class="fas fa-spinner fa-spin"></i><span>Giriş Yapılıyor...</span>';
        btn.style.pointerEvents = 'none';

        try {
            const result = await loginUser(usernameVal, passwordVal);

            if (result.success) {
                const data     = result.data || {};
                const userRole = data.role || data.Role || 'User';

                const loginState = JSON.stringify({
                    username: usernameVal,
                    role: userRole,
                    loginTime: new Date().toISOString()
                });

                localStorage.setItem('homeasistan_user_role', userRole);

                if (remember.checked) {
                    localStorage.setItem('homeasistan_remembered_username', usernameVal);
                    localStorage.setItem('homeasistan_login_state', loginState);
                    sessionStorage.removeItem('homeasistan_login_state');
                } else {
                    localStorage.removeItem('homeasistan_remembered_username');
                    localStorage.removeItem('homeasistan_login_state');
                    sessionStorage.setItem('homeasistan_login_state', loginState);
                }

                btn.innerHTML      = '<i class="fas fa-check"></i><span>Başarılı!</span>';
                btn.style.background = '#0a2e1a';
                btn.style.color      = '#00ff88';

                setTimeout(() => { window.location.href = '../index.html'; }, 800);

            } else {
                btn.innerHTML      = `<i class="fas fa-times"></i><span style="font-size:13px">Hata: ${result.message}</span>`;
                btn.style.background = 'var(--color-error)';
                setTimeout(() => {
                    btn.innerHTML        = originalContent;
                    btn.style.background = originalBg;
                    btn.style.pointerEvents = 'auto';
                }, 3000);
            }
        } catch {
            btn.innerHTML      = '<i class="fas fa-times"></i><span>Bağlantı Hatası</span>';
            btn.style.background = 'var(--color-error)';
            setTimeout(() => {
                btn.innerHTML        = originalContent;
                btn.style.background = originalBg;
                btn.style.pointerEvents = 'auto';
            }, 3000);
        }
    });


    // ── Modal açılınca kullanıcı adını otomatik doldur ────────────────────────

    const cpModal = document.getElementById('changePasswordModal');

    cpModal.addEventListener('modal:open', () => {
        const cpUsername = document.getElementById('cpUsername');
        if (username.value.trim() && !cpUsername.value) {
            cpUsername.value = username.value.trim();
        }
    });


    // ── Modal içi şifre göster / gizle toggle'ları ────────────────────────────

    cpModal.querySelectorAll('.pw-toggle').forEach(btn => {
        btn.addEventListener('click', function () {
            const input  = document.getElementById(this.dataset.target);
            const icon   = this.querySelector('i');
            const hidden = input.type === 'password';
            input.type   = hidden ? 'text' : 'password';
            icon.classList.toggle('fa-eye',      !hidden);
            icon.classList.toggle('fa-eye-slash', hidden);
        });
    });


    // ── Şifre Değiştir Formu ─────────────────────────────────────────────────

    const cpForm   = document.getElementById('cpForm');
    const cpAlert  = document.getElementById('cpAlert');
    const cpSubmit = document.getElementById('cpSubmit');

    cpForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const uname       = document.getElementById('cpUsername').value.trim();
        const current     = document.getElementById('cpCurrentPassword').value;
        const newPw       = document.getElementById('cpNewPassword').value;
        const newPwRepeat = document.getElementById('cpNewPasswordRepeat').value;

        // İstemci doğrulama
        if (!uname || !current || !newPw || !newPwRepeat)
            return showCpAlert('error', 'Tüm alanları doldurun.');
        if (newPw !== newPwRepeat)
            return showCpAlert('error', 'Yeni şifreler eşleşmiyor.');
        if (current === newPw)
            return showCpAlert('error', 'Yeni şifre mevcut şifreyle aynı olamaz.');

        // Yükleniyor
        cpSubmit.disabled  = true;
        cpSubmit.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Güncelleniyor...</span>';
        cpAlert.className  = 'modal-alert';
        cpAlert.textContent = '';

        try {
            const result = await updatePassword(uname, current, newPw, newPwRepeat);

            if (result.success) {
                showCpAlert('success', '✓ Şifre başarıyla güncellendi!');
                cpForm.reset();
                setTimeout(() => HomeOSModal.close('changePasswordModal'), 2000);
            } else {
                showCpAlert('error', result.message || 'Bir hata oluştu.');
            }
        } catch {
            showCpAlert('error', 'Sunucuya bağlanılamadı.');
        } finally {
            cpSubmit.disabled  = false;
            cpSubmit.innerHTML = '<span>Güncelle</span><i class="fas fa-arrow-right"></i>';
        }
    });

    // Modal kapanınca alert temizle
    cpModal.addEventListener('modal:close', () => {
        cpAlert.className   = 'modal-alert';
        cpAlert.textContent = '';
    });

    function showCpAlert(type, message) {
        cpAlert.className   = `modal-alert modal-alert--${type}`;
        cpAlert.textContent = message;
    }
});
