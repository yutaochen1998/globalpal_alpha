$(document).ready(function() {
    const port_ws = 9000;
    const ws = new WebSocket('ws://localhost:' + port_ws);
    ws.onopen = function (event) {
        ws.send("Hello world from client");
        console.log(event.data);
    };
    ws.onmessage = function (event) {
        console.log(event.data);
    };
});
