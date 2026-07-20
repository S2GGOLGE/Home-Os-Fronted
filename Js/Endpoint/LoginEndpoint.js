
// =====================================================
// HOMEOS API BASE URL
// =====================================================

const API_BASE_URL = getApiBaseUrl();


// =====================================================
// API BASE URL
// =====================================================

function getApiBaseUrl() {

    const queryApiBase =
        new URLSearchParams(window.location.search)
            .get("apiBase");

    if (queryApiBase) {

        const normalizedUrl =
            queryApiBase.replace(/\/$/, "");

        localStorage.setItem(
            "homeos_api_base_url",
            normalizedUrl
        );

        return normalizedUrl;
    }


    const configuredApiBase =
        window.HOMEOS_API_BASE_URL ||
        localStorage.getItem(
            "homeos_api_base_url"
        );


    if (configuredApiBase) {

        return configuredApiBase.replace(
            /\/$/,
            ""
        );
    }


    if (
        window.location.protocol === "file:" ||
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1"
    ) {

        return "https://localhost:7201/api";
    }


    return `${window.location.origin}/api`;
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
            "[LOGIN] Kaydedilecek JWT token bulunamadı."
        );

        return false;
    }


    if (remember) {

        // Önce eski tokenları temizle
        localStorage.removeItem("token");
        localStorage.removeItem("jwt");

        sessionStorage.removeItem("accessToken");
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("jwt");


        // Yeni token
        localStorage.setItem(
            "accessToken",
            token
        );

    }
    else {

        // Önce eski tokenları temizle
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("jwt");

        localStorage.removeItem("accessToken");
        localStorage.removeItem("token");
        localStorage.removeItem("jwt");


        // Yeni token
        sessionStorage.setItem(
            "accessToken",
            token
        );
    }


    console.log(
        "[LOGIN] JWT token başarıyla kaydedildi."
    );


    return true;
}


// =====================================================
// API JSON PARSE
// =====================================================

function parseApiPayload(text) {

    if (!text) {

        return null;
    }


    try {

        return JSON.parse(text);

    }
    catch (error) {

        console.error(
            "[LOGIN] API JSON parse hatası:",
            text
        );

        throw new Error(
            "API geçerli JSON döndürmedi."
        );
    }
}


// =====================================================
// API RESPONSE NORMALIZE
// =====================================================

function unwrapApiResponse(payload) {

    if (
        payload &&
        typeof payload === "object" &&
        "success" in payload &&
        "data" in payload
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
        "[LOGIN] Login URL:",
        url
    );


    try {

        const response =
            await fetch(
                url,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
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
            "[LOGIN] Status:",
            response.status
        );


        console.log(
            "[LOGIN] Response:",
            text
        );


        // =================================================
        // RATE LIMIT
        // Backend 429 durumunda düz text döndürüyor.
        // Bu yüzden JSON parse ETMİYORUZ.
        // =================================================

        if (
            response.status === 429
        ) {

            console.warn(
                "[LOGIN] Rate Limit aktif."
            );


            return {

                success: false,

                blocked: true,

                status: 429,

                message:
                    "Çok fazla giriş denemesi yapıldı. Lütfen 5 dakika sonra tekrar deneyin."

            };
        }


        // =================================================
        // RESPONSE BOŞSA
        // =================================================

        if (!text) {

            return {

                success:
                    response.ok,

                data: null,

                message:
                    response.ok
                        ? "Giriş başarılı."
                        : "Sunucudan boş yanıt alındı."

            };
        }


        // =================================================
        // JSON PARSE
        // =================================================

        let payload;


        try {

            payload =
                unwrapApiResponse(
                    parseApiPayload(
                        text
                    )
                );

        }
        catch (parseError) {

            console.error(
                "[LOGIN] API JSON olmayan yanıt döndürdü:",
                text
            );


            return {

                success: false,

                status:
                    response.status,

                message:
                    response.ok
                        ? "API geçersiz bir yanıt döndürdü."
                        : text ||
                          "Sunucudan geçersiz yanıt alındı."

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


            // =================================================
            // JWT TOKEN AL
            // =================================================

            const token =
                data.accessToken ||
                data.token ||
                data.jwt;


            if (!token) {

                console.error(
                    "[LOGIN] Login başarılı fakat JWT token bulunamadı.",
                    data
                );


                return {

                    success: false,

                    message:
                        "Giriş başarılı ancak JWT token alınamadı."

                };
            }


            // =================================================
            // JWT KAYDET
            // =================================================

            const tokenSaved =
                saveAuthToken(
                    token,
                    remember
                );


            if (!tokenSaved) {

                return {

                    success: false,

                    message:
                        "JWT token kaydedilemedi."

                };
            }


            // =================================================
            // ROLE
            // =================================================

            const userRole =
                data.role ||
                data.user?.role ||
                "uye";


            // =================================================
            // LOGIN STATE
            // =================================================

            if (remember) {

                localStorage.setItem(
                    "homeasistan_login_state",
                    "true"
                );

                localStorage.setItem(
                    "homeasistan_user_role",
                    userRole
                );


                sessionStorage.removeItem(
                    "homeasistan_login_state"
                );

                sessionStorage.removeItem(
                    "homeasistan_user_role"
                );

            }
            else {

                sessionStorage.setItem(
                    "homeasistan_login_state",
                    "true"
                );

                sessionStorage.setItem(
                    "homeasistan_user_role",
                    userRole
                );


                localStorage.removeItem(
                    "homeasistan_login_state"
                );

                localStorage.removeItem(
                    "homeasistan_user_role"
                );

            }


            console.log(
                "[LOGIN] Giriş başarılı."
            );


            console.log(
                "[LOGIN] Kullanıcı:",
                data.user
            );


            console.log(
                "[LOGIN] Rol:",
                userRole
            );


            console.log(
                "[LOGIN] JWT başarıyla kaydedildi."
            );


            return {

                success: true,

                data: data,

                token: token,

                user:
                    data.user ||
                    null,

                role:
                    userRole

            };
        }


        // =================================================
        // LOGIN BAŞARISIZ
        // =================================================

        return {

            success: false,

            status:
                response.status,

            message:
                payload.error ||
                payload.message ||
                "Kullanıcı adı veya şifre hatalı."

        };


    }
    catch (error) {

        console.error(
            "[LOGIN] Bağlantı hatası:",
            error
        );


        return {

            success: false,

            message:
                error.message ||
                "Sunucuya bağlanılamadı."

        };

    }
}