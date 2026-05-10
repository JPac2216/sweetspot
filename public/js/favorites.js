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
                ? '/date/' + dateId + '/unfavorite'
                : '/date/' + dateId + '/favorite',
            dataType: 'json'
        };

        $.ajax(requestConfig).then(function (responseMessage) {
            console.log(responseMessage);
            btn.toggleClass('active');
            form.attr('action', isFavorited
                ? '/date/' + dateId + '/favorite'
                : '/date/' + dateId + '/unfavorite'
            );
        }).catch(function (xhr) {
            console.log('Favorite toggle failed:', xhr.status, xhr.statusText, xhr.responseText);
            alert('Could not save favorite. ' + (xhr.status === 403 ? 'Please sign in first.' : 'Please try again.'));
        });
    });

})(window.jQuery);
