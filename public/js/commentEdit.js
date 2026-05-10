function toggleEditForm(btn) {
    const form = btn.nextElementSibling;
    if (!form || !form.classList.contains('edit-form')) return;
    if (form.hasAttribute('hidden')) {
        form.removeAttribute('hidden');
    } else {
        form.setAttribute('hidden', '');
    }
}
