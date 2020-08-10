var url = "https://script.google.com/a/uci.edu/macros/s/AKfycbyONjH15L_56ITZPrwitTU6fNQi8oTZLR8fWaK8Uy_VEIxXqcQ/exec";

function link(name, target) {
    return $("<a></a>").text(name).attr("href", target);
}

function text(content) {
    return $("<span></span>").html(content);
}

function submit(e) {
    let id = $("#id").val();
    console.log('id >>' + id + '<<');
    if(!id) {
        alert("Enter a valid arxiv identifier");
        $("#id").focus();
        return false;
    }
    $.ajax({
        dataType: "jsonp",
        url: url + '?id=' + id + '&root=' + $("#root").val(),
        success: function(result) {
            let div = $("<div class='result'></div>");
            if(result["status"] == "ok") {
                div.append(link(result["pdfLink"], result["pdfLink"]));
                div.append(text(" &rarr; "));
                div.append(link(result["category"], result["categoryLink"]));
                div.append(text(" / "));
                div.append(link(result["year"], result["yearLink"]));
                div.append(text(" / "));
                div.append(link(result["name"], result["fileLink"]));
                let size = new Number(result["pdfSize"]);
                if(size == 0) {
                    div.append(text(" (already downloaded)").addClass("note"));
                }
                else {
                    div.append(text(" (" + (size / (1 << 20)).toFixed(2) + "Mb)"));
                }
            }
            else {
                div.append(text(result["message"]).addClass("error"));
            }
            $("#results").append(div);
            $("#id").val("").focus();
        },
        error: function(xhr, textStatus, errorThrown) {
            let div = $("<div class='result'></div>");
            div.append(text(result["id"] + " &rarr; "));
            div.append(text(errorThrown).addClass("error"));
            $("#results").append(div);
            $("#id").val("").focus();
        }
    });
    return false;
}

$(document).ready(function() {
    $("#submit").click(submit);
    $("#id").focus();
});
