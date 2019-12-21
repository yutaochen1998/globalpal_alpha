$(document).ready(function() {
    const port = 3000;
    const connection = new WebSocket('ws://localhost:' + port + '/websocket_chat_lobby');
    const chat_window = $('#chat_window');
    const chat_button = $('#chat_button');
    const input = $('#chat_message');
    const clear_button = $('#clear_button');
    const current_online = $('#current_online');

    chat_button.click(function () {
        if (input.val().length === 0) {
            input.notify("Message could not be empty!", {className: 'info', position: 'top'});
        } else {
            connection.send(JSON.stringify({chat: true, message: input.val()}));
            input.val('');
        }
    });

    clear_button.click(function () {
        chat_window.text('*Welcome to the chat lobby!*');
    });

    connection.onmessage = (event) => {

        const data_parsed = JSON.parse(event.data);

        if (data_parsed.chat) {
            chat_window.prepend('🔻' +
                    data_parsed.time_stamp + ' > ' +
                    data_parsed.userID + '🔻' +
                    '<br>' + data_parsed.message + '<br>');
        }
        if (data_parsed.current_online) {
            current_online.text("Current online: " + data_parsed.number);
        }
    };

    $.periodic({period: 2000, decay: 1.0}, function() {
        connection.send(JSON.stringify({current_online: true}));
    });
});