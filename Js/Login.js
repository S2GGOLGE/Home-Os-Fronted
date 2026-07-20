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
                password.getAttribute("type") === "password"
                ?
                "text"
                :
                "password";


            password.setAttribute(
                "type",
                type
            );



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
    // Modal pw-toggle butonları (Şifre Göster/Gizle)
    // ===============================

    document.querySelectorAll(".pw-toggle").forEach(
        function(btn){
            btn.addEventListener(
                "click",
                function(){
                    const targetId =
                        this.getAttribute("data-target");

                    const input =
                        document.getElementById(targetId);

                    if(!input) return;

                    const type =
                        input.getAttribute("type") === "password"
                        ?
                        "text"
                        :
                        "password";

                    input.setAttribute(
                        "type",
                        type
                    );

                    const icon =
                        this.querySelector("i");

                    if(icon){
                        icon.classList.toggle(
                            "fa-eye"
                        );
                        icon.classList.toggle(
                            "fa-eye-slash"
                        );
                    }
                }
            );
        }
    );



    // ===============================
    // Şifre Değiştir Modal (cpForm)
    // ===============================

    const cpForm =
        document.getElementById("cpForm");

    if(cpForm){

        cpForm.addEventListener(
            "submit",
            async function(e){

                e.preventDefault();

                const cpAlert =
                    document.getElementById("cpAlert");

                const cpSubmit =
                    document.getElementById("cpSubmit");

                const cpUsername =
                    document.getElementById("cpUsername");

                const cpCurrentPassword =
                    document.getElementById("cpCurrentPassword");

                const cpNewPassword =
                    document.getElementById("cpNewPassword");

                const cpNewPasswordRepeat =
                    document.getElementById("cpNewPasswordRepeat");


                // Alanları kontrol et
                if(
                    !cpUsername.value.trim() ||
                    !cpCurrentPassword.value ||
                    !cpNewPassword.value ||
                    !cpNewPasswordRepeat.value
                ){
                    if(cpAlert){
                        cpAlert.textContent =
                            "Tüm alanları doldurunuz.";
                        cpAlert.className =
                            "modal-alert error";
                    }
                    return;
                }


                // Yeni şifre eşleşme kontrolü
                if(
                    cpNewPassword.value !==
                    cpNewPasswordRepeat.value
                ){
                    if(cpAlert){
                        cpAlert.textContent =
                            "Yeni şifreler eşleşmiyor.";
                        cpAlert.className =
                            "modal-alert error";
                    }
                    return;
                }


                // Buton durumunu güncelle
                const oldContent =
                    cpSubmit.innerHTML;

                cpSubmit.innerHTML =
                `
                <i class="fas fa-spinner fa-spin"></i>
                <span>Güncelleniyor...</span>
                `;

                cpSubmit.style.pointerEvents =
                    "none";


                try{

                    const result =
                        await updatePassword(
                            cpUsername.value.trim(),
                            cpCurrentPassword.value,
                            cpNewPassword.value,
                            cpNewPasswordRepeat.value
                        );


                    if(result.success){

                        if(cpAlert){
                            cpAlert.textContent =
                                result.message ||
                                "Şifre başarıyla güncellendi!";
                            cpAlert.className =
                                "modal-alert success";
                        }

                        cpSubmit.innerHTML =
                        `
                        <i class="fas fa-check"></i>
                        <span>Başarılı!</span>
                        `;

                        setTimeout(function(){
                            if(window.HomeOSModal){
                                window.HomeOSModal.close(
                                    "changePasswordModal"
                                );
                            }
                            cpSubmit.innerHTML =
                                oldContent;
                            cpSubmit.style.pointerEvents =
                                "auto";
                        }, 2000);

                    }
                    else{

                        if(cpAlert){
                            cpAlert.textContent =
                                result.message ||
                                "Şifre güncellenemedi.";
                            cpAlert.className =
                                "modal-alert error";
                        }

                        cpSubmit.innerHTML =
                            oldContent;

                        cpSubmit.style.pointerEvents =
                            "auto";

                    }

                }
                catch(error){

                    console.error(
                        "Şifre güncelleme hatası:",
                        error
                    );

                    if(cpAlert){
                        cpAlert.textContent =
                            "Bağlantı hatası oluştu.";
                        cpAlert.className =
                            "modal-alert error";
                    }

                    cpSubmit.innerHTML =
                        oldContent;

                    cpSubmit.style.pointerEvents =
                        "auto";

                }

            }
        );

    }



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