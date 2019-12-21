$(document).ready(function() {
    const port = 3000;
    const connection = new WebSocket('ws://localhost:' + port + '/websocket_chat_lobby');
    const chat_window = document.querySelector('#chat_window');
    const chat_button = document.querySelector('#chat_button');
    const input = document.querySelector('#chat_message');
    const clear_button = document.querySelector('#clear_button');

    chat_button.onclick = function () {
        if (input.value.length === 0) {
            $('<div style="color: red">Message could not be empty!</div>').insertAfter('#chat_message').delay(3000).fadeOut();
        } else {
            connection.send(input.value);
            input.value = '';
        }
        return false;
    };

    clear_button.onclick = function () {
        chat_window.textContent = '*Welcome to the chat lobby!*';
        return false;
    };

    connection.onmessage = (event) => {
        chat_window.prepend(
            document.createTextNode('🔻' +
                JSON.parse(event.data).time_stamp +
                ' > ' +
                JSON.parse(event.data).userID + '🔻'),
            document.createElement('BR'),
            document.createTextNode(JSON.parse(event.data).message),
            document.createElement('BR')
        );
    };
});