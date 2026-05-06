function getCards() {
    return [...document.querySelectorAll('#spotList .event-step')];
}

function renderList(steps) {
    const list = document.getElementById('spotList');
    list.innerHTML = '';
    steps.forEach((step, i) => {
        const inputs = step.querySelectorAll('[name]');
        inputs.forEach(el => {
            el.name = el.name.replace(/events\[\d+\]/, `events[${i}]`);
        });
        step.querySelector('.order-input').value = i;
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

document.addEventListener('DOMContentLoaded', function () {
    const steps = getCards();
    if (steps.length > 0) renderList(steps);
});
