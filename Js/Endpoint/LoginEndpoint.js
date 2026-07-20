
// =====================================================
// API BASE URL
// =====================================================

function getApiBaseUrl() {

    const queryApiBase =
        new URLSearchParams(
            window.location.search
        ).get('apiBase');


    if (queryApiBase) {

        const normalized =
            queryApiBase.replace(
                /\/$/,
                ''
            );


        localStorage.setItem(
            'homeos_api_base_url',
            normalized
        );


        return normalized;
    }


    const configuredApiBase =
        window.HOMEOS_API_BASE_URL ||
        localStorage.getItem(
            'homeos_api_base_url'
        );


    if (configuredApiBase) {

        return configuredApiBase.replace(
            /\/$/,
            ''
        );
    }


    if (
        window.location.protocol === 'file:' ||
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1'
    ) {

        return 'https://localhost:7201/api';
    }


    return `${window.location.origin}/api`;
}


// =====================================================
// API JSON PARSE
// =====================================================

function parseApiPayload(text) {

    if (!text) {

        return null;
    }


    try {

        return JSON.parse(
            text
        );

    }
    catch (error) {

        console.error(
            '[LOGIN] API JSON parse hatası:',
            error
        );


        console.error(
            '[LOGIN] Ham API cevabı:',
            text
        );


        throw new Error(
            'API geçerli JSON döndürmedi.'
        );
    }
}


// =====================================================
// API RESPONSE NORMALIZE
// =====================================================

function unwrapApiResponse(payload) {

    if (
        payload &&
        typeof payload === 'object' &&
        Object.prototype.hasOwnProperty.call(
            payload,
            'success'
        ) &&
        Object.prototype.hasOwnProperty.call(
            payload,
            'data'
        )
    ) {

        return payload;
    }


    return {

        success: true,

        data: payload,

        error: null
    };
}


// =====================================================
// LOGIN
// =====================================================

async function loginUser(
    username,
    password,
    remember = true
) {

    const url =
        `${API_BASE_URL}/auth/login`;


    console.log(
        '[LOGIN] Login URL:',
        url
    );


    try {

        const response =
            await fetch(
                url,
                {

                    method: 'POST',

                    headers: {

                        'Content-Type':
                            'application/json',

                        'Accept':
                            'application/json'
                    },

                    body:
                        JSON.stringify({

                            username:
                                username,

                            passwordHash:
                                password
                        })
                }
            );


        const text =
            await response.text();


        console.log(
            '[LOGIN] HTTP Status:',
            response.status
        );


        console.log(
            '[LOGIN] API Response:',
            text
        );


        // =================================================
        // API JSON PARSE
        // =================================================

        const rawPayload =
            text
                ? parseApiPayload(text)
                : null;


        // =================================================
        // API RESPONSE NORMALIZE
        // =================================================

        const payload =
            unwrapApiResponse(
                rawPayload
            );


        // =================================================
        // RATE LIMIT
        // =================================================

        if (
            response.status === 429
        ) {

            return {

                success: false,

                blocked: true,

                message:
                    'Çok fazla giriş denemesi yapıldı. 5 dakika bekleyin.'
            };
        }


        // =================================================
        // LOGIN SUCCESS
        // =================================================

        if (
            response.ok &&
            payload.success
        ) {

            const data =
                payload.data || {};


            // =================================================
            // JWT TOKEN
            // =================================================

            const token =
                data.accessToken ||
                data.token ||
                data.jwt;


            if (!token) {

                console.error(
                    '[LOGIN] JWT token bulunamadı.',
                    data
                );


                return {

                    success: false,

                    message:
                        'Giriş başarılı ancak JWT token alınamadı.'
                };
            }


            // =================================================
            // TOKEN KAYDET
            // =================================================

            if (
                typeof saveAuthToken === 'function'
            ) {

                saveAuthToken(
                    token,
                    remember
                );

            }
            else {

                // auth.js yüklenmediyse
                // fallback

                if (remember) {

                    localStorage.setItem(
                        'accessToken',
                        token
                    );

                }
                else {

                    sessionStorage.setItem(
                        'accessToken',
                        token
                    );
                }
            }


            // =================================================
            // LOGIN STATE
            // =================================================

            if (remember) {

                localStorage.setItem(
                    'homeasistan_login_state',
                    'true'
                );


                sessionStorage.removeItem(
                    'homeasistan_login_state'
                );

            }
            else {

                sessionStorage.setItem(
                    'homeasistan_login_state',
                    'true'
                );


                localStorage.removeItem(
                    'homeasistan_login_state'
                );
            }


            // =================================================
            // ROLE
            // =================================================

            const role =
                data.role ||
                data.user?.role ||
                'uye';


            if (remember) {

                localStorage.setItem(
                    'homeasistan_user_role',
                    role
                );


                sessionStorage.removeItem(
                    'homeasistan_user_role'
                );

            }
            else {

                sessionStorage.setItem(
                    'homeasistan_user_role',
                    role
                );


                localStorage.removeItem(
                    'homeasistan_user_role'
                );
            }


            // =================================================
            // DEBUG
            // =================================================

            console.log(
                '[LOGIN] Giriş başarılı.'
            );


            console.log(
                '[LOGIN] Kullanıcı:',
                data.user
            );


            console.log(
                '[LOGIN] Rol:',
                role
            );


            console.log(
                '[LOGIN] JWT kaydedildi.'
            );


            console.log(
                '[LOGIN] Token mevcut:',
                Boolean(
                    typeof getAuthToken === 'function'
                        ? getAuthToken()
                        : token
                )
            );


            // =================================================
            // RESULT
            // =================================================

            return {

                success: true,

                data: data,

                token: token,

                role: role
            };
        }


        // =================================================
        // LOGIN FAILED
        // =================================================

        return {

            success: false,

            message:
                payload.error ||
                payload.message ||
                'Kullanıcı adı veya şifre hatalı.'
        };
    }


    catch (error) {

        console.error(
            '[LOGIN] Bağlantı hatası:',
            error
        );


        return {

            success: false,

            message:
                error.message ||
                'Sunucuya bağlanılamadı.'
        };
    }
}

const API_BASE_URL =
    getApiBaseUrl();


// =====================================================
// API URL
// =====================================================

function getApiBaseUrl() {

    const queryApiBase =
        new URLSearchParams(
            window.location.search
        ).get(
            'apiBase'
        );


    if (queryApiBase) {

        const normalized =
            queryApiBase.replace(
                /\/$/,
                ''
            );


        localStorage.setItem(
            'homeos_api_base_url',
            normalized
        );


        return normalized;
    }


    const configuredApiBase =
        window.HOMEOS_API_BASE_URL ||
        localStorage.getItem(
            'homeos_api_base_url'
        );


    if (configuredApiBase) {

        return configuredApiBase.replace(
            /\/$/,
            ''
        );
    }


    if (
        window.location.protocol === 'file:' ||
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1'
    ) {

        return 'https://localhost:7201/api';
    }


    return `${window.location.origin}/api`;
}


// =====================================================
// API RESPONSE PARSE
// =====================================================

function parseApiPayload(text) {

    if (!text) {

        return null;
    }


    try {

        return JSON.parse(
            text
        );

    }
    catch (error) {

        console.error(
            '[LOGIN] API JSON hatası:',
            text
        );


        throw new Error(
            'API geçerli JSON döndürmedi.'
        );
    }
}


// =====================================================
// API RESPONSE UNWRAP
// =====================================================

function unwrapApiResponse(payload) {

    if (
        payload &&
        typeof payload === 'object' &&
        'success' in payload &&
        'data' in payload
    ) {

        return payload;
    }


    return {

        success: true,

        data: payload,

        error: null
    };
}


// =====================================================
// LOGIN
// =====================================================

async function loginUser(
    username,
    password,
    remember = true
) {

    const url =
        `${API_BASE_URL}/auth/login`;


    console.log(
        '[LOGIN] Login URL:',
        url
    );


    try {

        const response =
            await fetch(
                url,
                {

                    method: 'POST',

                    headers: {

                        'Content-Type':
                            'application/json',

                        'Accept':
                            'application/json'
                    },

                    body:
                        JSON.stringify({

                            username:
                                username,

                            passwordHash:
                                password
                        })
                }
            );


        const text =
            await response.text();


        console.log(
            '[LOGIN] Status:',
            response.status
        );


        console.log(
            '[LOGIN] Response:',
            text
        );


        const rawPayload =
            text
                ? parseApiPayload(text)
                : null;


        const payload =
            unwrapApiResponse(
                rawPayload
            );


        // =================================================
        // RATE LIMIT
        // =================================================

        if (
            response.status === 429
        ) {

            return {

                success: false,

                blocked: true,

                message:
                    'Çok fazla giriş denemesi yapıldı. 5 dakika bekleyin.'
            };
        }


        // =================================================
        // LOGIN BAŞARILI
        // =================================================

        if (
            response.ok &&
            payload.success
        ) {

            const data =
                payload.data || {};


            // Backend farklı isim kullanıyorsa
            // hepsini destekle

            const token =
                data.accessToken ||
                data.token ||
                data.jwt;


            if (!token) {

                console.error(
                    '[LOGIN] Backend cevap verdi ancak JWT token bulunamadı.',
                    data
                );


                return {

                    success: false,

                    message:
                        'Giriş başarılı görünüyor ancak JWT token alınamadı.'
                };
            }


            // =================================================
            // JWT KAYDET
            // auth.js içindeki fonksiyon
            // =================================================

            saveAuthToken(
                token,
                remember
            );


            // =================================================
            // LOGIN STATE
            // =================================================

            if (remember) {

                localStorage.setItem(
                    'homeasistan_login_state',
                    'true'
                );

            }
            else {

                sessionStorage.setItem(
                    'homeasistan_login_state',
                    'true'
                );
            }


            // =================================================
            // ROLE
            // =================================================

            const role =
                data.user?.role ||
                data.role ||
                'uye';


            if (remember) {

                localStorage.setItem(
                    'homeasistan_user_role',
                    role
                );

                sessionStorage.removeItem(
                    'homeasistan_user_role'
                );

            }
            else {

                sessionStorage.setItem(
                    'homeasistan_user_role',
                    role
                );

                localStorage.removeItem(
                    'homeasistan_user_role'
                );
            }


            console.log(
                '[LOGIN] Giriş başarılı.'
            );


            console.log(
                '[LOGIN] JWT kaydedildi.'
            );


            console.log(
                '[LOGIN] Kullanıcı rolü:',
                role
            );


            return {

                success: true,

                data: data,

                token: token,

                role: role
            };
        }


        // =================================================
        // LOGIN BAŞARISIZ
        // =================================================

        return {

            success: false,

            message:
                payload.error ||
                payload.message ||
                'Kullanıcı adı veya şifre hatalı.'
        };


    }
    catch (error) {

        console.error(
            '[LOGIN] Bağlantı hatası:',
            error
        );


        return {

            success: false,

            message:
                error.message ||
                'Sunucuya bağlanılamadı.'
        };
    }
}

