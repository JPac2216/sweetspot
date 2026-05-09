const appealForm = document.getElementById('appeal-form');
const errorDiv = document.getElementById('error');

const NAME_REGEX = /^[a-zA-Z0-9 ,#]{2,25}$/;
const STREET_REGEX = /^[a-zA-Z0-9 ,#]{2,25}$/;
const BOROUGHS = ["the bronx", "queens", "manhattan", "staten island", "brooklyn"];

function showError(msg){
  errorDiv.textContent = msg;
  errorDiv.hidden = false;
}

function clearError(){
  errorDiv.hidden = true;
  errorDiv.textContent = '';
}

if(appealForm){
  appealForm.addEventListener('submit', (event) => {
    event.preventDefault();
    clearError();

    let name = document.getElementById('name').value.trim();
    let description = document.getElementById('description').value.trim();
    let street = document.getElementById('street').value.trim();
    let borough = document.getElementById('borough').value.trim();
    let zip = parseInt(document.getElementById('zip').value.trim());

    if(!name || !NAME_REGEX.test(name)){
      return showError('Name must be 2-25 characters and contain only letters, numbers, spaces, commas, or #.');
    }
    if(!description){
      return showError('Description is required.');
    }
    if(!street || !STREET_REGEX.test(street)){
      return showError('Street must be 2-25 characters and contain only letters, numbers, spaces, commas, or #.');
    }
    if(!BOROUGHS.includes(borough)){
      return showError('Please select a valid borough.');
    }
    if(Number.isNaN(zip) || !Number.isFinite(zip)){
      return showError('Zip code must be a valid number.');
    }

    appealForm.submit();
  });
}