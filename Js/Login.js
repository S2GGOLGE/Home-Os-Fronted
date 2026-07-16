document.addEventListener("DOMContentLoaded", () => {


    const togglePassword =
        document.getElementById("togglePassword");


    const password =
        document.getElementById("password");


    const loginForm =
        document.getElementById("loginForm");


    const username =
        document.getElementById("username");


    const remember =
        document.getElementById("remember");


    const btn =
        document.querySelector(".btn-login");




    const rememberedUsername =
        localStorage.getItem(
            "homeasistan_remembered_username"
        );



    if(rememberedUsername){

        username.value =
            rememberedUsername;

        remember.checked =
            true;

        password.focus();

    }
    else{

        username.focus();

    }





    // ===============================
    // 5 Dakika Login Block
    // ===============================


    const LOGIN_BLOCK_TIME =
        5 * 60 * 1000;




    function getBlockTime(){

        const value =
            localStorage.getItem(
                "homeos_login_block"
            );


        if(!value)
            return 0;



        const time =
            Number(value) - Date.now();



        if(time <= 0){

            localStorage.removeItem(
                "homeos_login_block"
            );


            return 0;

        }



        return time;

    }





    function startBlock(){

        localStorage.setItem(
            "homeos_login_block",
            Date.now() + LOGIN_BLOCK_TIME
        );

    }







    function updateBlockButton(){


        const remaining =
            getBlockTime();



        if(remaining <= 0){


            btn.disabled = false;


            btn.style.pointerEvents =
                "auto";


            btn.innerHTML =
            `
            <span>Giriş Yap</span>
            <i class="fas fa-arrow-right"></i>
            `;


            return;

        }





        btn.disabled = true;


        btn.style.pointerEvents =
            "none";



        const min =
            Math.floor(
                remaining / 60000
            );



        const sec =
            Math.floor(
                (remaining % 60000) / 1000
            );



        btn.innerHTML =
        `
        <i class="fas fa-lock"></i>
        <span>
        Bekleyin ${min}:${sec
        .toString()
        .padStart(2,"0")}
        </span>
        `;

    }





    setInterval(
        updateBlockButton,
        1000
    );


    updateBlockButton();






    // ===============================
    // Şifre Göster Gizle
    // ===============================


    togglePassword.addEventListener(
        "click",
        function(){


            const type =
                password.type === "password"
                ?
                "text"
                :
                "password";


            password.type =
                type;



            const icon =
                this.querySelector("i");



            icon.classList.toggle(
                "fa-eye"
            );


            icon.classList.toggle(
                "fa-eye-slash"
            );


        }
    );








    // ===============================
    // LOGIN
    // ===============================


    loginForm.addEventListener(
        "submit",
        async(e)=>{


            e.preventDefault();



            if(getBlockTime() > 0){

                updateBlockButton();

                return;

            }





            const usernameVal =
                username.value.trim();



            const passwordVal =
                password.value;





            const oldText =
                btn.innerHTML;




            btn.innerHTML =
            `
            <i class="fas fa-spinner fa-spin"></i>
            <span>Giriş Yapılıyor...</span>
            `;



            btn.style.pointerEvents =
                "none";





            try{


                const result =
                    await loginUser(
                        usernameVal,
                        passwordVal
                    );






                if(result.success){



                    localStorage.removeItem(
                        "homeos_login_block"
                    );




                    const data =
                        result.data || {};




                    const role =
                        data.role ||
                        "User";




                    const loginState =
                    JSON.stringify({

                        username:
                            usernameVal,


                        role:
                            role,


                        loginTime:
                            new Date()
                            .toISOString()

                    });







                    localStorage.setItem(
                        "homeasistan_user_role",
                        role
                    );





                    if(remember.checked){


                        localStorage.setItem(
                            "homeasistan_remembered_username",
                            usernameVal
                        );


                        localStorage.setItem(
                            "homeasistan_login_state",
                            loginState
                        );


                    }
                    else{


                        sessionStorage.setItem(
                            "homeasistan_login_state",
                            loginState
                        );


                    }






                    btn.innerHTML =
                    `
                    <i class="fas fa-check"></i>
                    <span>Başarılı!</span>
                    `;




                    setTimeout(()=>{


                        window.location.href =
                            "../index.html";


                    },800);




                }

                else{



                    if(result.blocked){


                        startBlock();

                        updateBlockButton();

                        return;

                    }





                    btn.innerHTML =
                    `
                    <i class="fas fa-times"></i>
                    <span>
                    ${result.message}
                    </span>
                    `;




                    setTimeout(()=>{


                        btn.innerHTML =
                            oldText;


                        btn.style.pointerEvents =
                            "auto";


                    },3000);



                }




            }
            catch(error){



                console.error(
                    error
                );



                btn.innerHTML =
                `
                <i class="fas fa-times"></i>
                <span>Bağlantı Hatası</span>
                `;



                setTimeout(()=>{


                    btn.innerHTML =
                        oldText;


                    btn.style.pointerEvents =
                        "auto";


                },3000);



            }



        }
    );


});