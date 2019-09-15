$(function(){
//////////////////////////////////////////////////////////////////////////////

function displayPassword(password){
    return [
        password.slice(0, 5),
        password.slice(5, 10),
        password.slice(10, 15),
        password.slice(15, 20),
    ].join(" ");
}


(async function work(){
   $("#password").val("");

    await openpgp.initWorker({ path: "/openpgp.worker.js" });

    var exported = await browser.cookies.getAll({});

    var password = base32.encode(
        await openpgp.crypto.random.getRandomBytes(15)
    ).slice(0,20);

    var ciphertext = (await openpgp.encrypt({
        message: openpgp.message.fromText(JSON.stringify(exported)),
        passwords: [password],
        compression: openpgp.enums.compression.zip,
    })).data;

    $("#preview").text(ciphertext);
    $("#password").val(displayPassword(password));

    $("#fileio-btn").data("ciphertext", ciphertext);
})();


$("#fileio-btn").click(function(){
    var ciphertext = $(this).data("ciphertext");
    $("#fileio-btn").attr("disabled", true);

    $.post({
        url: "https://file.io?expires=2d",
        data: { text: ciphertext },
    }).done(function (d) {
        //Do what you want with the return data
        $("#fileio").text(d.link);
    })
    .always(function(){
        $("#fileio-btn").attr("disabled", false);
    })
    ;

});

//////////////////////////////////////////////////////////////////////////////
});
