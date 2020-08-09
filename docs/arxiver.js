var url = "https://script.google.com/a/uci.edu/macros/s/AKfycbyONjH15L_56ITZPrwitTU6fNQi8oTZLR8fWaK8Uy_VEIxXqcQ/exec";

$(document).ready(function() {
    $("#submit").click(function (e) {
        $.ajax({
            dataType: "json",
            url: url + '?id=' + $("#id").val() + '&root=' + $("#root").val(),
            success: function(result) {
                $("#message").text(result["status"]);
                $("#title").text(result["title"]);
                //$("#path").append(...);
            },
            error: function(jqXHR, textStatus, errorThrown) {
                $("#message").text(textStatus);
            }
        });
        return false;
    });
});
