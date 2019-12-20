$(document).ready(function() {
    const port = 3000;
    const connection = new WebSocket('ws://localhost:' + port + '/websocket_service');

    connection.onopen = () => {
        console.log('Websocket client connected');
        connection.send("Hello world from client!");
    };

    connection.onclose = () => {
        console.error('Websocket client disconnected');
    };

    connection.onerror = (error) => {
        console.error('Websocket client connection error', error);
    };

    connection.onmessage = (event) => {
        console.log('Message received: ', event.data);
    };

    document.querySelector("#test").addEventListener('click', function() {
        window.open('/chat_lobby', '_blank');
    });
});
