// =====================================================
// HOMEOS AUTH.JS
// SADECE AUTHENTICATION / AUTHORIZATION
// =====================================================


// =====================================================
// PATH YÖNETİMİ
// =====================================================

function getHomeOsPath(page) {

    const inPagesDir =
        /\/Pages\/[^/]*$/i.test(
            window.location.pathname
        );


    if (page === 'index.html') {

        return inPagesDir
            ? '../index.html'
            : 'index.html';
    }


    return inPagesDir
        ? page
        : `Pages/${page}`;
}


// =====================================================
// JWT TOKEN AL
// =====================================================

function getAuthToken() {

    return (
        localStorage.getItem('accessToken') ||
        localStorage.getItem('homeos_token') ||
        localStorage.getItem('token') ||
        localStorage.getItem('jwt') ||

        sessionStorage.getItem('accessToken') ||
        sessionStorage.getItem('homeos_token') ||
        sessionStorage.getItem('token') ||
        sessionStorage.getItem('jwt') ||

        null
    );
}


// =====================================================
// JWT TOKEN KAYDET
// =====================================================

function saveAuthToken(
    token,
    remember = true
) {

    if (!token) {

        console.error(
            '[AUTH] JWT token bulunamadı.'
        );

        return false;
    }


    clearAuthToken();


    if (remember) {

        localStorage.setItem(
            'accessToken',
            token
        );

    } else {

        sessionStorage.setItem(
            'accessToken',
            token
        );
    }


    console.log(
        '[AUTH] JWT token kaydedildi.'
    );


    return true;
}


// =====================================================
// JWT TOKEN TEMİZLE
// =====================================================

function clearAuthToken() {

    localStorage.removeItem('accessToken');
    localStorage.removeItem('homeos_token');
    localStorage.removeItem('token');
    localStorage.removeItem('jwt');

    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('homeos_token');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('jwt');
}


// =====================================================
// LOGIN STATE
// =====================================================

function getLoginState() {

    return (
        localStorage.getItem(
            'homeasistan_login_state'
        ) ||

        sessionStorage.getItem(
            'homeasistan_login_state'
        )
    );
}


// =====================================================
// LOGIN KONTROLÜ
// =====================================================

function isLoggedIn() {

    const token =
        getAuthToken();


    const loginState =
        getLoginState();


    return Boolean(
        token &&
        loginState === 'true'
    );
}


// =====================================================
// USER ROLE
// =====================================================

function getUserRole() {

    return (
        localStorage.getItem(
            'homeasistan_user_role'
        ) ||

        sessionStorage.getItem(
            'homeasistan_user_role'
        ) ||

        'misafir'
    );
}


// =====================================================
// ROLE LEVEL
// =====================================================

function getRoleLevel(role) {

    const ROLE_LEVELS = {

        admin: 3,
        administrator: 3,
        superadmin: 3,

        uye: 2,
        user: 2,
        member: 2,
        mod: 2,
        moderator: 2,

        misafir: 1,
        guest: 1
    };


    if (!role) {

        return 1;
    }


    const normalized =
        String(role)
            .toLowerCase()
            .trim();


    return (
        ROLE_LEVELS[
            normalized
        ] || 1
    );
}


// =====================================================
// LOGIN SESSION TEMİZLE
// =====================================================

function clearAuthSession() {

    localStorage.removeItem(
        'homeasistan_login_state'
    );

    sessionStorage.removeItem(
        'homeasistan_login_state'
    );


    localStorage.removeItem(
        'homeasistan_user_role'
    );

    sessionStorage.removeItem(
        'homeasistan_user_role'
    );


    clearAuthToken();
}


// =====================================================
// LOGOUT
// =====================================================

function logoutHomeOS(
    redirect = true
) {

    console.log(
        '[AUTH] Kullanıcı çıkış yapıyor.'
    );


    clearAuthSession();


    if (redirect) {

        window.location.href =
            getHomeOsPath(
                'Login.html'
            );
    }
}


// =====================================================
// GLOBAL FETCH AUTH GUARD
// =====================================================

(function installAuthFetchGuard() {

    if (
        window.__homeosAuthFetchGuardInstalled
    ) {

        return;
    }


    window.__homeosAuthFetchGuardInstalled =
        true;


    const nativeFetch =
        window.fetch.bind(
            window
        );


    window.fetch =
        async function (...args) {

            const request =
                args[0];


            let options =
                args[1] || {};


            const requestUrl =
                typeof request === 'string'
                    ? request
                    : request?.url || '';


            const normalizedUrl =
                requestUrl.toLowerCase();


            // Auth endpointlerinde JWT zorunlu değil
            const isAuthEndpoint =
                normalizedUrl.includes(
                    '/api/auth/login'
                ) ||

                normalizedUrl.includes(
                    '/api/login'
                ) ||

                normalizedUrl.includes(
                    '/api/signup'
                ) ||

                normalizedUrl.includes(
                    '/api/auth/register'
                ) ||

                normalizedUrl.includes(
                    '/api/register'
                );


            const token =
                getAuthToken();


            // =================================================
            // JWT HEADER EKLE
            // =================================================

            if (
                token &&
                !isAuthEndpoint
            ) {

                const headers =
                    new Headers(

                        options.headers ||

                        (
                            request instanceof Request
                                ? request.headers
                                : {}
                        )
                    );


                if (
                    !headers.has(
                        'Authorization'
                    )
                ) {

                    headers.set(
                        'Authorization',
                        `Bearer ${token}`
                    );
                }


                options.headers =
                    headers;


                args[1] =
                    options;
            }


            const response =
                await nativeFetch(
                    ...args
                );


            // =================================================
            // 401
            // =================================================

            if (
                response.status === 401 &&
                !isAuthEndpoint
            ) {

                console.warn(
                    '[AUTH] JWT geçersiz veya süresi dolmuş.'
                );


                clearAuthSession();


                const currentPath =
                    window.location.pathname
                        .toLowerCase();


                if (
                    !currentPath.endsWith(
                        'login.html'
                    ) &&

                    !currentPath.endsWith(
                        'register.html'
                    )
                ) {

                    window.location.href =
                        getHomeOsPath(
                            'Login.html'
                        );
                }
            }


            return response;
        };

})();


// =====================================================
// DOM READY
// =====================================================

document.addEventListener(
    'DOMContentLoaded',
    () => {

        const currentPath =
            window.location.pathname
                .toLowerCase();


        const isLoginPage =
            currentPath.endsWith(
                'login.html'
            );


        const isRegisterPage =
            currentPath.endsWith(
                'register.html'
            );


        // =================================================
        // AUTH CHECK
        // =================================================

        if (
            !isLoggedIn() &&
            !isLoginPage &&
            !isRegisterPage
        ) {

            window.location.href =
                getHomeOsPath(
                    'Login.html'
                );


            return;
        }


        // =================================================
        // ROLE
        // =================================================

        const userRole =
            getUserRole();


        const userLevel =
            getRoleLevel(
                userRole
            );


        console.log(
            '[AUTH] Role:',
            userRole
        );


        console.log(
            '[AUTH] Level:',
            userLevel
        );


        // =================================================
        // SAYFA YETKİLERİ
        // SADECE ERİŞİM KONTROLÜ
        // =================================================

        const pageRules = [

            {
                pattern:
                    'kullaniciyonetimi.html',

                minLevel: 3
            },

            {
                pattern:
                    'sistemizleme.html',

                minLevel: 3
            },

            {
                pattern:
                    'loglar.html',

                minLevel: 3
            },

            {
                pattern:
                    'otomasyonlar.html',

                minLevel: 2
            },

            {
                pattern:
                    'jarvis.html',

                minLevel: 2
            },

            {
                pattern:
                    'kameralar.html',

                minLevel: 2
            }
        ];


        // =================================================
        // SAYFA ERİŞİM KONTROLÜ
        // =================================================

        for (
            const rule of pageRules
        ) {

            if (
                currentPath.endsWith(
                    rule.pattern
                )
            ) {

                if (
                    userLevel <
                    rule.minLevel
                ) {

                    alert(
                        'Bu sayfaya erişim yetkiniz bulunmamaktadır.'
                    );


                    window.location.href =
                        getHomeOsPath(
                            'index.html'
                        );


                    return;
                }
            }
        }


        // =================================================
        // AUTH UI
        // =================================================

        const sidebarNav =
            document.querySelector(
                '#sidebar nav'
            );


        const menuToggle =
            document.getElementById(
                'menuToggle'
            );


        const sidebar =
            document.getElementById(
                'sidebar'
            );


        const authActionBtn =
            document.getElementById(
                'authActionBtn'
            );


        const loggedIn =
            isLoggedIn();


        if (
            sidebarNav
        ) {

            sidebarNav.hidden =
                !loggedIn;
        }


        if (
            menuToggle
        ) {

            menuToggle.hidden =
                !loggedIn;
        }


        if (
            sidebar
        ) {

            sidebar.classList.toggle(
                'collapsed',
                !loggedIn
            );
        }


        // =================================================
        // LOGIN / LOGOUT BUTONU
        // =================================================

        if (
            authActionBtn
        ) {

            const icon =
                authActionBtn.querySelector(
                    'i'
                );


            const text =
                authActionBtn.querySelector(
                    'span'
                );


            if (
                text
            ) {

                text.textContent =
                    loggedIn
                        ? 'Çıkış Yap'
                        : 'Giriş Yap';
            }


            if (
                icon
            ) {

                icon.className =
                    loggedIn
                        ? 'fas fa-sign-out-alt'
                        : 'fas fa-sign-in-alt';
            }


            authActionBtn.addEventListener(
                'click',
                () => {

                    if (
                        isLoggedIn()
                    ) {

                        logoutHomeOS(
                            true
                        );

                    } else {

                        window.location.href =
                            getHomeOsPath(
                                'Login.html'
                            );
                    }
                }
            );
        }

    }
);