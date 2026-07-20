const API_BASE_URL = getApiBaseUrl();

// =====================================================
// API BASE URL
// =====================================================

function getApiBaseUrl() {

const queryApiBase =
    new URLSearchParams(
        window.location.search
    ).get("apiBase");


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
```

}

// =====================================================
// API RESPONSE PARSE
// =====================================================

function parseApiPayload(text) {

```
if (!text) {
    return null;
}


try {

    return JSON.parse(text);

}
catch (error) {

    console.error(
        "[LOGIN] API JSON hatası:",
        text
    );

    throw new Error(
        "API geçerli JSON döndürmedi."
    );
}
```

}

// =====================================================
// API RESPONSE NORMALIZE
// =====================================================

function unwrapApiResponse(payload) {

```
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

    error: null,

    message: null
};
```

}

// =====================================================
// JWT TOKEN KAYDET
// =====================================================

function saveLoginToken(token) {

```
if (!token) {

    console.error(
        "[LOGIN] JWT token bulunamadı."
    );

    return false;
}


// Ana JWT anahtarı
localStorage.setItem(
    "accessToken",
    token
);


// Eski sistemlerle uyumluluk
localStorage.setItem(
    "token",
    token
);


localStorage.setItem(
    "jwt",
    token
);


// Eski homeos_token sistemi
localStorage.setItem(
    "homeos_token",
    token
);


console.log(
    "[LOGIN] JWT token başarıyla kaydedildi."
);


return true;
```

}

// =====================================================
// LOGIN STATE KAYDET
// =====================================================

function saveLoginState(data) {

```
localStorage.setItem(
    "homeasistan_login_state",
    "true"
);


const role =
    data?.user?.role ||
    data?.role ||
    "uye";


localStorage.setItem(
    "homeasistan_user_role",
    role
);


console.log(
    "[LOGIN] Login state kaydedildi."
);


console.log(
    "[LOGIN] Kullanıcı rolü:",
    role
);


}


async function loginUser(
username,
password
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
        "[LOGIN] HTTP Status:",
        response.status
    );


    console.log(
        "[LOGIN] API Response:",
        text
    );


    let rawPayload =
        null;


    if (text) {

        rawPayload =
            parseApiPayload(
                text
            );
    }


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
                "Çok fazla giriş denemesi yapıldı. 5 dakika bekleyin."
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
            payload.data ||
            {};


        // =================================================
        // JWT TOKEN BUL
        // =================================================

        const token =
            data.accessToken ||
            data.token ||
            data.jwt ||
            rawPayload?.accessToken ||
            rawPayload?.token ||
            rawPayload?.jwt;


        if (!token) {

            console.error(
                "[LOGIN] API başarılı döndü ancak JWT token bulunamadı.",
                data
            );


            return {

                success: false,

                message:
                    "Giriş başarılı görünüyor ancak JWT token alınamadı."
            };
        }


        // =================================================
        // JWT KAYDET
        // =================================================

        const tokenSaved =
            saveLoginToken(
                token
            );


        if (!tokenSaved) {

            return {

                success: false,

                message:
                    "JWT token kaydedilemedi."
            };
        }


        // =================================================
        // LOGIN STATE KAYDET
        // =================================================

        saveLoginState(
            data
        );


        console.log(
            "[LOGIN] Giriş başarılı."
        );


        return {

            success: true,

            data: data,

            token: token
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
            rawPayload?.message ||
            "Giriş başarısız."
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
