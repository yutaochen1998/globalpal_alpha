$(document).ready(function() {
    const port = 3000;
    const connection = new WebSocket('ws://localhost:' + port + '/websocket_whisper_like');
    const whisper_button = document.querySelector('#whisper_button');
    const like_button = document.querySelector('#like_button');
    const input = document.querySelector('#whisper_message');

    whisper_button.onclick = function () {
        if (input.value.length === 0) {
            $('<div style="color: red">Message could not be empty!</div>').insertAfter('#whisper_message').delay(3000).fadeOut();
        } else {
            connection.send(JSON.stringify({whisper: true, message: input.value}));
            input.value = '';
        }
        return false;
    };

    like_button.onclick = function () {
        connection.send(JSON.stringify({like: true}));
        return false;
    };

    connection.onmessage = (event) => {
        console.log('Message received: ', JSON.parse(event.data));
        if (JSON.parse(event.data).like) {
            like_button.value = JSON.parse(event.data).like_icon;
        }
        alert(JSON.parse(event.data).message);
    };
});