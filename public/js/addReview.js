const reviewForm = document.getElementById('review-form');
const errorDiv = document.getElementById('error');

function showError(msg){
  errorDiv.textContent = msg;
  errorDiv.hidden = false;
}

function clearError(){
  errorDiv.hidden = true;
  errorDiv.textContent = '';
}

if(reviewForm){
  reviewForm.addEventListener('submit', (event) => {
    event.preventDefault();
    clearError();

    let review = document.getElementById('review').value.trim();
    let rating = parseInt(document.getElementById('rating').value);

    if(!review){
      return showError('Review is required.');
    }
    if(Number.isNaN(rating) || !Number.isFinite(rating) || !Number.isInteger(rating) || rating < 1 || rating > 5) {
      return showError('Rating must be a valid number between 1 and 5.');
    }

    reviewForm.submit();
  });
}