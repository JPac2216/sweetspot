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
        }).catch(function (xhr) {
            console.log("Vote failed:", xhr.status, xhr.statusText, xhr.responseText);
            alert(
                'Could not record your vote. ' + (xhr.status === 403 ? 'Please sign in first.' : 'Please try again.'));
        });
    });

})(window.jQuery);
