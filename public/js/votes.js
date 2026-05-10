(function ($) {

    $(document).on('submit', '[id^="upvote-form-"], [id^="downvote-form-"]', function (event) {
        event.preventDefault();

        let form = $(this);

        let requestConfig = {
            method: 'POST',
            url: form.attr('action')
        };

        $.ajax(requestConfig).then(function (responseMessage) {
            let card = form.closest('.date-card, .page');
            card.find('.vote-btn.up').text('▲ ' + responseMessage.upvotes);
            card.find('.vote-btn.down').text('▼ ' + responseMessage.downvotes);
        });
    });

})(window.jQuery);
