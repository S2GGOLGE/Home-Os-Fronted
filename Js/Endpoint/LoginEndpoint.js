const API_BASE_URL = getApiBaseUrl();



function getApiBaseUrl() {

    const queryApiBase =
        new URLSearchParams(window.location.search)
        .get("apiBase");


    if(queryApiBase){

        localStorage.setItem(
            "homeos_api_base_url",
            queryApiBase
        );

        return queryApiBase.replace(/\/$/, "");

    }



    const configuredApiBase =
        window.HOMEOS_API_BASE_URL ||
        localStorage.getItem(
            "homeos_api_base_url"
        );



    if(configuredApiBase){

        return configuredApiBase.replace(
            /\/$/,
            ""
        );

    }



    if(
        window.location.protocol === "file:" ||
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1"
    ){

        return "https://localhost:7201/api";

    }



    return `${window.location.origin}/api`;

}





function parseApiPayload(text){

    if(!text)
        return null;


    try{

        return JSON.parse(text);

    }
    catch{

        console.error(
            "API JSON hatası:",
            text
        );


        throw new Error(
            "API geçerli JSON döndürmedi."
        );

    }

}





function unwrapApiResponse(payload){

    if(
        payload &&
        typeof payload === "object" &&
        "success" in payload &&
        "data" in payload
    ){

        return payload;

    }



    return {

        success:true,

        data:payload,

        error:null

    };

}







async function loginUser(
    username,
    password
){

    const url =
        `${API_BASE_URL}/auth/login`;



    console.log(
        "Login URL:",
        url
    );



    try{


        const response =
            await fetch(
                url,
                {

                    method:"POST",


                    headers:
                    {
                        "Content-Type":
                            "application/json"
                    },


                    body:
                    JSON.stringify(
                    {

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
            "Status:",
            response.status
        );


        console.log(
            "Response:",
            text
        );





        const payload =
            text
            ?
            unwrapApiResponse(
                parseApiPayload(text)
            )
            :
            {

                success:
                    response.ok,


                data:null,


                error:null

            };







        // 5 dakika Rate Limit

        if(response.status === 429){

            return {

                success:false,

                blocked:true,

                message:
                "Çok fazla giriş denemesi yapıldı. 5 dakika bekleyin."

            };

        }





        if(
            response.ok &&
            payload.success
        ){


            const data =
                payload.data || {};



            // JWT Kaydet

            if(data.token){

                localStorage.setItem(
                    "homeos_token",
                    data.token
                );

            }



            return {

                success:true,

                data:data

            };

        }






        return {

            success:false,

            message:
                payload.error ||
                payload.message ||
                "Giriş başarısız."

        };




    }
    catch(error){


        console.error(
            "Login bağlantı hatası:",
            error
        );



        return {

            success:false,

            message:
                error.message ||
                "Sunucuya bağlanılamadı."

        };

    }

}