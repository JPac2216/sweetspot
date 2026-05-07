function toggleFilter(btn) {
    const dropdown = btn.nextElementSibling;
    const isOpen = dropdown.classList.contains('open');
    document.querySelectorAll('.filter-dropdown.open').forEach(d => {
        d.classList.remove('open');
        d.previousElementSibling.classList.remove('active');
    });
    if (!isOpen) {
        dropdown.classList.add('open');
        btn.classList.add('active');
    }
}

document.addEventListener('click', function (e) {
    if (!e.target.closest('.filter-group')) {
        document.querySelectorAll('.filter-dropdown.open').forEach(d => {
            d.classList.remove('open');
            d.previousElementSibling.classList.remove('active');
        });
    }
});
