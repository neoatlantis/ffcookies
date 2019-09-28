$(function(){
//////////////////////////////////////////////////////////////////////////////

function displayPassword(password){
    return [
        password.slice(0, 6),
        password.slice(6, 12),
        password.slice(12, 18),
        password.slice(18, 24),
        password.slice(24, 30),
    ].join(" ");
}

function writeQRCode(fileioID, password){
    const text = "http://example.com/#ffcookies#" + fileioID + "#" + password;
    new QRCode("qrcode", {
        "text": text,
    });
    const dataurl = $("#qrcode").find("canvas")[0].toDataURL("image/png");
    $("#qrcode-page").css("background-image", "url(" + dataurl + ")").show();
}



(async function work(){
   $("#password").val("");

    await openpgp.initWorker({ path: "/openpgp.worker.js" });

    var exported = await browser.cookies.getAll({});

    var password = base32.encode(
        await openpgp.crypto.random.getRandomBytes(30)
    ).slice(0,30);

    var ciphertext = (await openpgp.encrypt({
        message: openpgp.message.fromText(JSON.stringify(exported)),
        passwords: [password],
        compression: openpgp.enums.compression.zip,
    })).data;

    $("#preview").text(ciphertext);
    $("#password").val(displayPassword(password));

    $("#fileio-btn").data("ciphertext", ciphertext).data("password", password);
})();


$("#fileio-btn").click(function(){
    const self = this;
    var ciphertext = $(this).data("ciphertext");
    var password = $(this).data("password");

    if($(self).data("uploaded") === true){
        $("#qrcode-page").show();
        return;
    }

    $("#fileio-btn").attr("disabled", true);
    $.post({
        url: "https://file.io?expires=2d",
        data: { text: ciphertext },
    }).done(function (d) {
        //Do what you want with the return data
        $("#fileio-url").text(d.link);
        writeQRCode(d.link.slice(-6), password);
        $(self).data("uploaded", true);
    })
    .fail(function(){
        alert("Upload failed. Try again later.");
    })
    .always(function(){
        $("#fileio-btn").attr("disabled", false);
    })
    ;

});

$("#qrcode-page").click(function(){
    $(this).hide();
});

//////////////////////////////////////////////////////////////////////////////
});
