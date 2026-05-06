document.querySelectorAll('.tag-option').forEach(el => {
    el.addEventListener('click', () => el.classList.toggle('selected'));
});
