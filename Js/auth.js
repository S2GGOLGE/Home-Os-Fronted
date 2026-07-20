
function getHomeOsPath(page) {

    const inPagesDir =
        /\/Pages\/[^/]*$/i.test(
            window.location.pathname
        );

    if (
        page === 'index.html'
    ) {
        return inPagesDir
            ? '../index.html'
            : 'index.html';
    }

    return inPagesDir
        ? page
        : `Pages/${page}`;
}


// =====================================================
// JWT TOKEN YÖNETİMİ
// =====================================================

function getAuthToken() {

    return (
        localStorage.getItem(
            'accessToken'
        )
        ||
        localStorage.getItem(
            'token'
        )
        ||
        localStorage.getItem(
            'jwt'
        )
        ||
        sessionStorage.getItem(
            'accessToken'
        )
        ||
        sessionStorage.getItem(
            'token'
        )
        ||
        sessionStorage.getItem(
            'jwt'
        )
        ||
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

    if (
        !token
    ) {

        console.error(
            '[AUTH] Kaydedilecek JWT token bulunamadı.'
        );

        return false;
    }


    if (
        remember
    ) {

        localStorage.setItem(
            'accessToken',
            token
        );

        // Eski token anahtarlarını temizle
        localStorage.removeItem(
            'token'
        );

        localStorage.removeItem(
            'jwt'
        );

    }
    else {

        sessionStorage.setItem(
            'accessToken',
            token
        );

        sessionStorage.removeItem(
            'token'
        );

        sessionStorage.removeItem(
            'jwt'
        );
    }


    console.log(
        '[AUTH] JWT token başarıyla kaydedildi.'
    );


    return true;
}


// =====================================================
// JWT TOKEN TEMİZLE
// =====================================================

function clearAuthToken() {

    localStorage.removeItem(
        'accessToken'
    );

    localStorage.removeItem(
        'token'
    );

    localStorage.removeItem(
        'jwt'
    );


    sessionStorage.removeItem(
        'accessToken'
    );

    sessionStorage.removeItem(
        'token'
    );

    sessionStorage.removeItem(
        'jwt'
    );
}


// =====================================================
// LOGIN STATE
// =====================================================

function getLoginState() {

    return (
        localStorage.getItem(
            'homeasistan_login_state'
        )
        ||
        sessionStorage.getItem(
            'homeasistan_login_state'
        )
    );
}


// =====================================================
// LOGIN DURUMU
// JWT + LOGIN STATE KONTROLÜ
// =====================================================

function isLoggedIn() {

    const loginState =
        getLoginState();

    const token =
        getAuthToken();


    return Boolean(
        loginState
        &&
        token
    );
}


// =====================================================
// LOGIN STATE TEMİZLE
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


    if (
        redirect
    ) {

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
        async function (
            ...args
        ) {

            const response =
                await nativeFetch(
                    ...args
                );


            const requestUrl =
                typeof args[0] === 'string'
                    ? args[0]
                    : args[0]?.url || '';


            const normalizedUrl =
                requestUrl.toLowerCase();


            // Login / Register endpointleri
            // 401 aldığında otomatik logout yapma
            const isAuthEndpoint =
                normalizedUrl.includes(
                    '/api/auth/login'
                )
                ||
                normalizedUrl.includes(
                    '/api/login'
                )
                ||
                normalizedUrl.includes(
                    '/api/signup'
                )
                ||
                normalizedUrl.includes(
                    '/api/auth/register'
                )
                ||
                normalizedUrl.includes(
                    '/api/register'
                );


            // API isteği 401 döndürdüyse
            if (
                response.status === 401
                &&
                !isAuthEndpoint
            ) {

                console.warn(
                    '[AUTH] API 401 Unauthorized:',
                    requestUrl
                );


                // Oturumu temizle
                clearAuthSession();


                // Login sayfasında değilsek
                // Login sayfasına yönlendir
                if (
                    !window.location.pathname
                        .toLowerCase()
                        .endsWith(
                            'login.html'
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


        // =================================================
        // LOGIN / REGISTER SAYFALARI
        // =================================================

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
            !isLoggedIn()
            &&
            !isLoginPage
            &&
            !isRegisterPage
        ) {

            console.warn(
                '[AUTH] Geçerli oturum bulunamadı.'
            );


            window.location.href =
                getHomeOsPath(
                    'Login.html'
                );


            return;
        }


        // =================================================
        // ROLE SYSTEM
        // =================================================

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


        // =================================================
        // USER ROLE
        // =================================================

        function getUserRole() {

            return (
                localStorage.getItem(
                    'homeasistan_user_role'
                )
                ||
                sessionStorage.getItem(
                    'homeasistan_user_role'
                )
                ||
                'misafir'
            );
        }


        // =================================================
        // ROLE LEVEL
        // =================================================

        function getRoleLevel(
            role
        ) {

            if (
                !role
            ) {

                return 1;
            }


            const normalized =
                String(
                    role
                )
                .toLowerCase()
                .trim();


            return (
                ROLE_LEVELS[
                    normalized
                ]
                ||
                1
            );
        }


        const userRole =
            getUserRole();


        const userLevel =
            getRoleLevel(
                userRole
            );


        console.log(
            '[AUTH] Kullanıcı rolü:',
            userRole
        );


        console.log(
            '[AUTH] Yetki seviyesi:',
            userLevel
        );


        // =================================================
        // PAGE AUTHORIZATION RULES
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
        // DIRECT PAGE AUTHORIZATION
        // =================================================

        for (
            const rule
            of pageRules
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
        // ROLE UI
        // =================================================

        function applyRoleUi() {


            // Admin
            document
                .querySelectorAll(
                    '.role-admin, [data-role="admin"]'
                )
                .forEach(
                    el => {

                        if (
                            userLevel <
                            3
                        ) {

                            el.style.setProperty(
                                'display',
                                'none',
                                'important'
                            );

                            el.hidden =
                                true;
                        }
                    }
                );


            // Üye / User
            document
                .querySelectorAll(
                    '.role-uye, [data-role="uye"], [data-role="user"]'
                )
                .forEach(
                    el => {

                        if (
                            userLevel <
                            2
                        ) {

                            el.style.setProperty(
                                'display',
                                'none',
                                'important'
                            );

                            el.hidden =
                                true;
                        }
                    }
                );


            // Sidebar linkleri
            document
                .querySelectorAll(
                    '#sidebar nav a'
                )
                .forEach(
                    link => {


                        const href =
                            link.getAttribute(
                                'href'
                            )
                            ||
                            '';


                        const normalizedHref =
                            href.toLowerCase();


                        for (
                            const rule
                            of pageRules
                        ) {


                            if (
                                normalizedHref.endsWith(
                                    rule.pattern
                                )
                            ) {


                                if (
                                    userLevel <
                                    rule.minLevel
                                ) {

                                    link.style.setProperty(
                                        'display',
                                        'none',
                                        'important'
                                    );
                                }
                            }
                        }
                    }
                );
        }


        // =================================================
        // AUTH UI
        // =================================================

        function applyAuthUi() {


            const loggedIn =
                isLoggedIn();


            // Sidebar
            if (
                sidebarNav
            ) {

                sidebarNav.hidden =
                    !loggedIn;
            }


            // Menu
            if (
                menuToggle
            ) {

                menuToggle.hidden =
                    !loggedIn;


                menuToggle.setAttribute(
                    'aria-hidden',
                    String(
                        !loggedIn
                    )
                );
            }


            // Sidebar collapsed
            if (
                sidebar
            ) {

                sidebar.classList.toggle(
                    'collapsed',
                    !loggedIn
                );
            }


            // Login / Logout Button
            if (
                authActionBtn
            ) {


                const icon =
                    authActionBtn
                        .querySelector(
                            'i'
                        );


                const text =
                    authActionBtn
                        .querySelector(
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


                authActionBtn.setAttribute(
                    'aria-label',
                    loggedIn
                        ? 'Çıkış Yap'
                        : 'Giriş Yap'
                );
            }


            if (
                loggedIn
            ) {

                applyRoleUi();
            }
        }


        // =================================================
        // LOGOUT BUTTON
        // =================================================

        if (
            authActionBtn
        ) {


            authActionBtn.addEventListener(
                'click',
                () => {


                    if (
                        isLoggedIn()
                    ) {

                        logoutHomeOS(
                            true
                        );

                        return;
                    }


                    window.location.href =
                        getHomeOsPath(
                            'Login.html'
                        );
                }
            );
        }


        // =================================================
        // MOBILE NAVIGATION
        // =================================================

        function setupMobileNavigation() {


            if (
                !document.getElementById(
                    'mobile-nav-styles'
                )
            ) {


                const style =
                    document.createElement(
                        'style'
                    );


                style.id =
                    'mobile-nav-styles';


                style.textContent = `

                    .mobile-bottom-nav {
                        display: none;
                    }

                    .drawer-backdrop {
                        display: none;
                        position: fixed;
                        inset: 0;
                        background: rgba(0, 0, 0, 0.6);
                        backdrop-filter: blur(4px);
                        z-index: 9998;
                    }

                    .drawer-backdrop.active {
                        display: block;
                    }

                    @media (max-width: 768px) {

                        #sidebar {

                            position: fixed !important;
                            top: 0 !important;
                            left: 0 !important;
                            bottom: 0 !important;

                            height: 100vh !important;
                            width: 280px !important;

                            z-index: 9999 !important;

                            transform:
                                translateX(-100%);

                            transition:
                                transform 0.3s
                                cubic-bezier(
                                    0.4,
                                    0,
                                    0.2,
                                    1
                                ) !important;

                            display: flex !important;

                            flex-direction:
                                column !important;

                            background:
                                #111111 !important;

                            box-shadow:
                                5px 0 25px
                                rgba(
                                    0,
                                    0,
                                    0,
                                    0.5
                                );
                        }


                        #sidebar.active-drawer {

                            transform:
                                translateX(0)
                            !important;
                        }


                        #sidebar.collapsed {

                            transform:
                                translateX(-100%)
                            !important;
                        }


                        body {

                            padding-bottom:
                                70px !important;
                        }


                        .content,
                        main {

                            padding-bottom:
                                70px !important;
                        }


                        .mobile-bottom-nav {

                            display: flex;

                            position: fixed;

                            bottom: 0;
                            left: 0;
                            right: 0;

                            height: 60px;

                            background:
                                #141414;

                            border-top:
                                1px solid
                                var(
                                    --border-line,
                                    #252525
                                );

                            z-index:
                                9997;

                            justify-content:
                                space-around;

                            align-items:
                                center;

                            padding:
                                5px 10px;
                        }


                        .mobile-bottom-item {

                            display: flex;

                            flex-direction:
                                column;

                            align-items:
                                center;

                            justify-content:
                                center;

                            color:
                                #888888;

                            text-decoration:
                                none;

                            font-size:
                                11px;

                            cursor:
                                pointer;

                            transition:
                                color 0.2s;

                            background:
                                none;

                            border:
                                none;

                            outline:
                                none;
                        }


                        .mobile-bottom-item i {

                            font-size:
                                20px;

                            margin-bottom:
                                3px;
                        }


                        .mobile-bottom-item.active {

                            color:
                                var(
                                    --accent-green,
                                    #00ff88
                                );
                        }


                        .mobile-bottom-item:hover {

                            color:
                                #ffffff;
                        }
                    }
                `;


                document.head.appendChild(
                    style
                );
            }


            if (
                !isLoggedIn()
            ) {

                return;
            }


            // =================================================
            // DRAWER BACKDROP
            // =================================================

            let backdrop =
                document.getElementById(
                    'sidebar-backdrop'
                );


            if (
                !backdrop
            ) {


                backdrop =
                    document.createElement(
                        'div'
                    );


                backdrop.id =
                    'sidebar-backdrop';


                backdrop.className =
                    'drawer-backdrop';


                document.body.appendChild(
                    backdrop
                );


                backdrop.addEventListener(
                    'click',
                    closeMobileDrawer
                );
            }


            // =================================================
            // BOTTOM NAV
            // =================================================

            let bottomNav =
                document.getElementById(
                    'mobile-bottom-navigation'
                );


            if (
                !bottomNav
            ) {


                bottomNav =
                    document.createElement(
                        'div'
                    );


                bottomNav.id =
                    'mobile-bottom-navigation';


                bottomNav.className =
                    'mobile-bottom-nav';


                const currentPath =
                    window.location.pathname
                        .toLowerCase();


                const isDash =
                    currentPath.endsWith(
                        'index.html'
                    )
                    ||
                    currentPath.endsWith(
                        '/'
                    )
                    ||
                    currentPath === '';


                const isDev =
                    currentPath.endsWith(
                        'cihazlar.html'
                    );


                const isRooms =
                    currentPath.endsWith(
                        'odalar.html'
                    );


                const isJarvis =
                    currentPath.endsWith(
                        'jarvis.html'
                    );


                bottomNav.innerHTML = `

                    <a
                        href="${getHomeOsPath('index.html')}"
                        class="mobile-bottom-item ${isDash ? 'active' : ''}"
                    >
                        <i class="fas fa-chart-pie"></i>
                        <span>Panel</span>
                    </a>


                    <a
                        href="${getHomeOsPath('Cihazlar.html')}"
                        class="mobile-bottom-item ${isDev ? 'active' : ''}"
                    >
                        <i class="fas fa-lightbulb"></i>
                        <span>Cihazlar</span>
                    </a>


                    <a
                        href="${getHomeOsPath('Odalar.html')}"
                        class="mobile-bottom-item ${isRooms ? 'active' : ''}"
                    >
                        <i class="fas fa-door-open"></i>
                        <span>Odalar</span>
                    </a>


                    <a
                        href="${getHomeOsPath('Jarvis.html')}"
                        class="mobile-bottom-item ${isJarvis ? 'active' : ''}"
                    >
                        <i class="fas fa-robot"></i>
                        <span>Jarvis</span>
                    </a>


                    <button
                        class="mobile-bottom-item"
                        id="mobileMenuTrigger"
                    >
                        <i class="fas fa-bars"></i>
                        <span>Menü</span>
                    </button>
                `;


                document.body.appendChild(
                    bottomNav
                );


                const trigger =
                    document.getElementById(
                        'mobileMenuTrigger'
                    );


                if (
                    trigger
                ) {

                    trigger.addEventListener(
                        'click',
                        event => {

                            event.stopPropagation();

                            toggleMobileDrawer();
                        }
                    );
                }
            }
        }


        // =================================================
        // MOBILE DRAWER
        // =================================================

        function toggleMobileDrawer() {


            if (
                !sidebar
            ) {

                return;
            }


            const isOpen =
                sidebar.classList.contains(
                    'active-drawer'
                );


            if (
                isOpen
            ) {

                closeMobileDrawer();

            }
            else {

                openMobileDrawer();
            }
        }


        function openMobileDrawer() {


            if (
                !sidebar
            ) {

                return;
            }


            sidebar.classList.add(
                'active-drawer'
            );


            sidebar.classList.remove(
                'collapsed'
            );


            const backdrop =
                document.getElementById(
                    'sidebar-backdrop'
                );


            if (
                backdrop
            ) {

                backdrop.classList.add(
                    'active'
                );
            }
        }


        function closeMobileDrawer() {


            if (
                !sidebar
            ) {

                return;
            }


            sidebar.classList.remove(
                'active-drawer'
            );


            sidebar.classList.add(
                'collapsed'
            );


            const backdrop =
                document.getElementById(
                    'sidebar-backdrop'
                );


            if (
                backdrop
            ) {

                backdrop.classList.remove(
                    'active'
                );
            }
        }


        // =================================================
        // INITIALIZE
        // =================================================

        applyAuthUi();

        setupMobileNavigation();

    }
);

const token =
    data.accessToken ||
    data.token ||
    data.jwt;

if (!token) {
    throw new Error(
        'JWT token alınamadı.'
    );
}

saveAuthToken(
    token,
    true
);

localStorage.setItem(
    'homeasistan_login_state',
    'true'
);

localStorage.setItem(
    'homeasistan_user_role',
    data.user?.role ||
    data.role ||
    'uye'
);