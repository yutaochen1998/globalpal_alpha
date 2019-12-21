$(document).ready(function() {
    const port = 3000;
    const connection = new WebSocket('ws://localhost:' + port + '/websocket_whisper_like');
    const whisper_button = $('#whisper_button');
    const like_button = $('#like_button');
    const input = $('#whisper_message');

    whisper_button.click(function () {
        if (input.val().length === 0) {
            input.notify("Message could not be empty!", {className: 'info', position: 'top'});
        } else {
            connection.send(JSON.stringify({whisper: true, message: input.val()}));
            input.val('');
        }
    });

    like_button.click(function () {
        connection.send(JSON.stringify({like: true}));
    });

    connection.onmessage = (event) => {

        const data_parsed = JSON.parse(event.data);

        if (data_parsed.whisper) {
            whisper_button.notify(data_parsed.message, {className: 'success', position: 'top'});
        }
        if (data_parsed.like) {
            like_button.val(data_parsed.like_icon);
            like_button.notify(data_parsed.message, {className: 'success', position: 'top'});
        }
    };
});