function getCards() {
    return [...document.querySelectorAll('#editSpotList .event-step')];
}

function renderList(steps) {
    const list = document.getElementById('editSpotList');
    list.innerHTML = '';
    steps.forEach((step, i) => {
        step.querySelector('.spot-id-input').name = `events[${i}][spotId]`;
        step.querySelector('.spot-notes-input').name = `events[${i}][notes]`;
        step.querySelector('.btn-move-left').style.visibility = i === 0 ? 'hidden' : '';
        step.querySelector('.btn-move-right').style.visibility = i === steps.length - 1 ? 'hidden' : '';
        list.appendChild(step);
        if (i < steps.length - 1) {
            const arrow = document.createElement('span');
            arrow.className = 'step-arrow';
            arrow.innerHTML = '&#8594;';
            list.appendChild(arrow);
        }
    });
}

function moveCard(btn, dir) {
    const steps = getCards();
    const step = btn.closest('.event-step');
    const idx = steps.indexOf(step);
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= steps.length) return;
    [steps[idx], steps[newIdx]] = [steps[newIdx], steps[idx]];
    renderList(steps);
}

function removeCard(btn) {
    btn.closest('.event-step').remove();
    renderList(getCards());
}

document.addEventListener('DOMContentLoaded', function () {
    const steps = getCards();
    if (steps.length > 0) renderList(steps);
});
