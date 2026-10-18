function preparationscen() {
    var chkScenario = document.getElementsByName("scen");
    for (i in chkScenario) {      
        var inputName = chkScenario[i].value;
        var cookieValue = (getCookie(inputName) != 'false');
        chkScenario[i].checked = cookieValue;
    }
};

function preparationmodu() {
    var chkModule = document.getElementsByName("modu");
    for (i in chkModule) {      
        var inputName = chkModule[i].value;
        var cookieValue = (getCookie(inputName) != 'false');
        chkModule[i].checked = cookieValue;
    }
};

function preparationhero() {
    var chkHeros = document.getElementsByName("hero");
    for (i in chkHeros) {      
        var inputName = chkHeros[i].value;
        var cookieValue = (getCookie(inputName) != 'false');
        chkHeros[i].checked = cookieValue;
    }
};


function preparationlists() {
    $('.openHide').click(function() {
        Next = this.parentElement.nextSibling.nextSibling;
        if (this.value.includes("+")) {
            this.value = this.value.replaceAll("+", "-");
            Next.style.display = "block";
        }
        else {
            this.value = this.value.replaceAll("-", "+");
            Next.style.display = "none";
        };
    });
};


function preparationjoueurs() {
    var cookieValue = getCookie("j");
    $("#players").val(cookieValue);
};


function cookieChecker() { 
    var cookie = false;
    var cookieContent = $('.cookie-disclaimer');
    checkCookie();
    if (cookie === true) {
      cookieContent.hide();
    }


function checkCookie() {
    var isC = getCookie("isCookie");
    if (isC !== "") {
        cookie = true;
    } else {
        if (isC !== "" && isC !== null) {
            setCookie("cvalue", "cvalue", 365);
        }
    }
}


function deleteCookie() {
    setCookie('cname', '', -1);
}
       

$('.accept-cookie').click(function () {
    setCookie("isCookie", "cvalue", 365);
    cookieContent.hide();

});


$('.decline-cookie').click(function () {
    deleteCookie();
    cookieContent.hide();
    });
};


function setCookie(cname, cvalue, exdays=365) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
    var expires = "expires="+d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
};


function getCookie(cname) {
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for(var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
        c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
        return c.substring(name.length, c.length);
        }
    }
    return "";
};


function randomPreparation() {
    $('#randomizer').click(function(){
        random();
    });
};


function affichage() {
    var t=1;
    var x=(2*getCookie("j"))+4;
    while(t<x) {
        document.getElementById(t).innerHTML='<img src="'+$(document.getElementById("0"+t)).val()+'">';
        t=t+1;
    }
};


function random() {
    var t=1;
    var x=(2*getCookie("j"))+4;
    while(t<x) {
        while($(document.getElementById("0"+t)).val() == "images/autres/Aléatoire.png") {
            var array = document.getElementsByClassName('willBeRandomized'+t);
            var rand  = Math.floor(Math.random() * array.length);
            var arrayDeVerif = verif();
            document.getElementById("0"+t).selectedIndex = rand;
            if(arrayDeVerif.includes($(document.getElementById("0"+t)).val())) {
                document.getElementById("0"+t).selectedIndex = 0;
            };
        }
        t=t+1;
    }
    affichage();
};


function verif() {
    var arr = [];
    var t=1;
    var x=(2*getCookie("j"))+4;
    while(t<x) {
        $(arr.push($(document.getElementById("0"+t)).val()));
        t=t+1;
    };
    return arr;
}


function randomSolo(x) {
    var v=0;
    while($(document.getElementById("0"+x)).val() == "images/autres/Aléatoire.png" || v==0) {
        var array = document.getElementsByClassName('willBeRandomized'+x);
        var rand  = Math.floor(Math.random() * array.length);
        var arrayDeVerif = verif();
        document.getElementById("0"+x).selectedIndex = rand;
        if(arrayDeVerif.includes($(document.getElementById("0"+x)).val())) {
            document.getElementById("0"+x).selectedIndex = 0;
        };
        v=v+1;
    }
    affichage();
};


function check() {
    $('.allOrNothing').click(function() {
        var sibling = this.parentNode;
        if (this.checked == true) {
            while (sibling) {
                var toCheck = sibling.firstChild;
                toCheck.checked = true;
                setCookie(toCheck.value,true);
                sibling = sibling.nextElementSibling.nextElementSibling;     
            }
        }
        else {
            while (sibling) {
                var toUncheck = sibling.firstChild;
                toUncheck.checked = false;
                setCookie(toUncheck.value,false);
                sibling = sibling.nextElementSibling.nextElementSibling;
                
            }
        }
    });
};


function accueil() {
    $('header').click(function() {
        location.href = "index.php";
    });
};


function reinitialisation() {
    $('#redo').click(function() {
        var t=1;
        var x=(2*getCookie("j"))+4;
        while(t<x) {
            document.getElementById("0"+t).selectedIndex = 0;
            t=t+1;
        };
        affichage();
    });
};