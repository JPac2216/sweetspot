(function ($) {


    $(document).on('submit', '[id^="favorite-form-"]', function (event) {
        event.preventDefault();

        let form = $(this);
        let btn = form.find('.favorite-btn');
        let isFavorited = btn.hasClass('active');
        let dateId = form.attr('id').replace('favorite-form-', '');

        let requestConfig = {
            method: 'POST',
            url: isFavorited
                ? '/user/date/' + dateId + '/unfavorite'
                : '/user/date/' + dateId + '/favorite'
        };

        $.ajax(requestConfig).then(function (responseMessage) {
            console.log(responseMessage);
            btn.toggleClass('active');
            form.attr('action', isFavorited
                ? '/user/date/' + dateId + '/favorite'
                : '/user/date/' + dateId + '/unfavorite'
            );
        });
    });

})(window.jQuery);
