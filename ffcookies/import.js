$(function(){
//////////////////////////////////////////////////////////////////////////////

// parse URL on page load

(function(){
    if(window.location.hash.slice(0, 11) == "#ffcookies#"){
        var hashsplit = window.location.hash.split("#");
        const fileioTag = hashsplit[2];
        const password = hashsplit[3];
        if(fileioTag !== undefined){
            $("#fileioid").val(fileioTag);
        }
        if(password !== undefined){
            $("#password").val(password);
        }
    }
})();


// --------------------------------------------------------------------------

$("#loadfile").click(function(){
    var fileioid = $("#fileioid").val().trim();
    if(!fileioid){
        alert("Please fill the file.io url.");
        return;
    }
    var url = "https://file.io/" + fileioid;
    $(this).attr("disabled", true);
    $.get(url)
    .done(function(d){
        $("#preview").val(d);
    })
    .always(function(){
        $("#loadfile").attr("disabled", false);
        $("#fileioid").val("");
    });
});


function buildCookieURL(cookie){
    var domain = cookie.domain;
    if(domain.slice(0, 1) == ".") domain = domain.slice(1);
    return (cookie.secure?"https":"http") + "://" + domain + cookie.path;
}



async function load(existingOnly, truncateCookies){
    var count = 0;
    var password = $("#password").val().replace(/[^0-9a-z]/g, "");
    var ciphertext = $("textarea").val();
    if(password.length != 30){
        alert("Please input a correct password.");
        return;
    }

    try{
        var plaintext = (await openpgp.decrypt({
            message: (await openpgp.message.readArmored(ciphertext)),
            passwords: [password],
        })).data;
    } catch(e){
        alert("Please input a correct password.");
        return;
    }

    try{
        var data = JSON.parse(plaintext);
    } catch(e){
        alert("Invalid ciphertext. Not an export of cookies?");
        return;
    }

    console.debug("import", data);

    const existingCookies = await browser.cookies.getAll({});
    var existingURLs = [];

    existingCookies.forEach(function(cookie){
        existingURLs.push(buildCookieURL(cookie));
    });

    if(truncateCookies){
        count = 0;
        existingCookies.forEach(function(cookie){
            count += 1;
            browser.cookies.remove({
                "name": cookie.name,
                "storeId": cookie.storeId,
                "url": buildCookieURL(cookie),
                "firstPartyDomain": cookie.firstPartyDomain,
            });
        });
        console.log("Removed " + count + " existing cookies.");
    }

    var writingCookies = [];
    if(existingOnly){
        data.forEach(function(newCookie){
            if(existingURLs.includes(buildCookieURL(newCookie))){
                writingCookies.push(newCookie);
            }
        });
    } else {
        writingCookies = data;
    }

    count = 0;
    writingCookies.forEach(function(cookie){
        count += 1;
        const toSet = {
            domain: cookie.domain,
            expirationDate: cookie.expirationDate,
            firstPartyDomain: cookie.firstPartyDomain,
            httpOnly: cookie.httpOnly,
            name: cookie.name,
            path: cookie.path,
            url: buildCookieURL(cookie),
            sameSite: cookie.sameSite,
            secure: cookie.secure,
            storeId: cookie.storeId,
            value: cookie.value,
        };
        console.log(toSet);
        browser.cookies.set(toSet);
    });

    console.log(count + " cookies set.", writingCookies);

    //alert(count + " cookies set.");
    

}

$("#loadcookies-existing").click(function(){ load(true, false); });
$("#loadcookies-all").click(function(){ load(false, false); });
$("#loadcookies-clear").click(function(){ load(false, true); });


(async function work(){
    await openpgp.initWorker({ path: "/openpgp.worker.js" });
})();
//////////////////////////////////////////////////////////////////////////////
});
