document.querySelectorAll('select[data-current]').forEach(function (sel) {
    if (sel.dataset.current) sel.value = sel.dataset.current;
});
