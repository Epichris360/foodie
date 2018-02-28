/* Your custom app logic goes here */

$(function(){ 
    $("#closeAlert").click(function(event){
        event.preventDefault()
        $.get("/remover-alert",
        function(data, status){
            $("#alertMsg").hide()
        });
    })
}) 
 