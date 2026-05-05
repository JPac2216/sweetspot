// Client-side javascript for form validations
// This will be for forms that involve logging in, signing up, creating a new spot or date, leaving comments or reviews, etc.

import * as helper from '../../helpers.js';

(function () {
    const createUserForm = document.getElementById('createUserForm'); // CHANGE THIS LATER TO THE ID IN THE HTML THAT WE USE.
    const updateUserForm = document.getElementById('updateUserForm'); // CHANGE THIS LATER TO THE ID IN THE HTML THAT WE USE.
    const submitSpotAppealForm = document.getElementById('submitSpotAppealForm'); // CHANGE THIS LATER TO THE ID IN THE HTML THAT WE USE.


    if (createUserForm) {
        const firstNameInput = document.getElementById('firstNameInput');
        const lastNameInput = document.getElementById('lastNameInput');
        const emailInput = document.getElementById('emailInput');
        const passwordInput = document.getElementById('passwordInput');
        const genderInput = document.getElementById('genderInput');
        const primaryLocationInput = document.getElementById('primaryLocationInput');
        const secondaryLocationInput = document.getElementById('secondaryLocationInput');

        const errorContainer = document.getElementById('error-container');
        const errorTextElement = errorContainer.getElementsByClassName('text-goes-here')[0];

        const resultsContainer = document.getElementById('results');

        createUserForm.addEventListener('submit', (event) => {
            event.preventDefault();

            try {
                errorContainer.classList.add('hidden');

                const firstNameInputValue = firstNameInput.value;
                const lastNameInputValue = lastNameInput.value;
                const emailInputValue = emailInput.value;
                const passwordInputValue = passwordInput.value;
                const genderInputValue = genderInput.value;
                const primaryLocationInputValue = primaryLocationInput.value;
                const secondaryLocationInputValue = secondaryLocationInput.value;

                const validateCreateUser = helper.validateCreateUser( // THIS FUNCTION NEEDS TO BE CREATED IN THE HELPER FILE
                    firstNameInputValue,
                    lastNameInputValue,
                    emailInputValue,
                    passwordInputValue,
                    genderInputValue,
                    primaryLocationInputValue,
                    secondaryLocationInputValue
                );

                if (!validateCreateUser) throw "validateCreateUser: Could not validate the parameters.";

                const dl = document.createElement('dl');
                dl.innerHTML = ``; // PUT SOMETHING HERE

            } catch (e) {
                const message = typeof e === "string" ? e : e.message;
                errorTextElement.textContent = message;
                errorContainer.classList.remove('hidden');
                myForm.reset();
                return;
            }
        });
    }

    if (updateUserForm) {
        const firstNameInput = document.getElementById('firstNameInput');
        const lastNameInput = document.getElementById('lastNameInput');
        const emailInput = document.getElementById('emailInput');
        const passwordInput = document.getElementById('passwordInput');
        const genderInput = document.getElementById('genderInput');
        const primaryLocationInput = document.getElementById('primaryLocationInput');
        const secondaryLocationInput = document.getElementById('secondaryLocationInput');

        const errorContainer = document.getElementById('error-container');
        const errorTextElement = errorContainer.getElementsByClassName('text-goes-here')[0];

        const resultsContainer = document.getElementById('results');

        updateUserForm.addEventListener('submit', (event) => {
            event.preventDefault();

            try {
                errorContainer.classList.add('hidden');

                const firstNameInputValue = firstNameInput.value;
                const lastNameInputValue = lastNameInput.value;
                const emailInputValue = emailInput.value;
                const passwordInputValue = passwordInput.value;
                const genderInputValue = genderInput.value;
                const primaryLocationInputValue = primaryLocationInput.value;
                const secondaryLocationInputValue = secondaryLocationInput.value;

                const validateCreateUser = helper.validateCreateUser( // THIS FUNCTION NEEDS TO BE CREATED IN THE HELPER FILE
                    firstNameInputValue,
                    lastNameInputValue,
                    emailInputValue,
                    passwordInputValue,
                    genderInputValue,
                    primaryLocationInputValue,
                    secondaryLocationInputValue,
                    updating=true // THIS WILL BE A DEFAULT PARAM SET TO FALSE
                    // THE REASON FOR THIS IS TO TELL THE VALIDATOR WHETHER WE
                    // ARE REQUIRING ALL PARAMETERS TO CREATE THE USER OR NOT.
                );

                if (!validateCreateUser) throw "validateCreateUser: Could not validate the parameters.";

                const dl = document.createElement('dl');
                dl.innerHTML = ``; // PUT SOMETHING HERE

            } catch (e) {
                const message = typeof e === "string" ? e : e.message;
                errorTextElement.textContent = message;
                errorContainer.classList.remove('hidden');
                myForm.reset();
                return;
            }
        });
    }

    if (submitSpotAppealForm) {
        const nameInput = document.getElementById('nameInput');
        const descriptionInput = document.getElementById('descriptionInput');
        const addressInput = document.getElementById('addressInput');
        
        const errorContainer = document.getElementById('error-container');
        const errorTextElement = errorContainer.getElementsByClassName('text-goes-here')[0];

        const resultsContainer = document.getElementById('results');

        submitSpotAppealForm.addEventListener('submit', (event) => {
            event.preventDefault();

            try {
                errorContainer.classList.add('hidden');

                const nameInputValue = nameInput.value;
                const descriptionInputValue = descriptionInput.value;
                const addressInputValue = addressInput.value;

                const validateSpotAppeal = helper.validateSpotFields(
                    nameInputValue,
                    descriptionInputValue,
                    addressInputValue
                );

                if (!validateSpotAppeal) throw "appealSpot: could not validate the appeal inputs.";

                const dl = document.createElement('dl');
                dl.innerHTML = ``; // PUT SOMETHING HERE
            } catch (e) {
                const message = typeof e === "string" ? e : e.message;
                errorTextElement.textContent = message;
                errorContainer.classList.remove('hidden');
                myForm.reset();
                return;
            }
        });
    }
})();