// Client-side javascript for form validations
// This will be for forms that involve logging in, signing up, creating a new spot or date, leaving comments or reviews, etc.

import * as helper from '../../helpers.js';

(function () {
    const createUserForm = document.getElementById('signup-form'); // CHANGE THIS LATER TO THE ID IN THE HTML THAT WE USE.
    const updateUserForm = document.getElementById('edituser-form'); // CHANGE THIS LATER TO THE ID IN THE HTML THAT WE USE.
    const submitSpotAppealForm = document.getElementById('appeal-form'); // CHANGE THIS LATER TO THE ID IN THE HTML THAT WE USE.


    if (createUserForm) {
        const firstNameInput = document.getElementById('firstName');
        const lastNameInput = document.getElementById('lastName');
        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');
        const confirmPasswordInput = document.getElementById('confirmPassword');
        const genderInput = document.getElementById('gender');
        const primaryLocationInput = document.getElementById('primaryLocation');
        const secondaryLocationInput = document.getElementById('secondaryLocation');

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
                const confirmPasswordInputValue = confirmPasswordInput.value;
                const genderInputValue = genderInput.value;
                const primaryLocationInputValue = primaryLocationInput.value;
                const secondaryLocationInputValue = secondaryLocationInput.value;

                if (passwordInputValue !== confirmPasswordInputValue) throw "Password and confirmed password must be the same!";

                const validateUser = helper.validateUser(
                    firstNameInputValue,
                    lastNameInputValue,
                    emailInputValue,
                    passwordInputValue,
                    genderInputValue,
                    primaryLocationInputValue,
                    secondaryLocationInputValue
                );

                if (!validateUser) throw "validateUser: Could not validate the parameters.";

                createUserForm.submit();

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
        const firstNameInput = document.getElementById('firstName');
        const lastNameInput = document.getElementById('lastName');
        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');
        const confirmPasswordInput = document.getElementById('confirmPassword');
        const genderInput = document.getElementById('gender');
        const primaryLocationInput = document.getElementById('primaryLocation');
        const secondaryLocationInput = document.getElementById('secondaryLocation');

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
                const confirmPasswordInputValue = confirmPasswordInput.value;
                const genderInputValue = genderInput.value;
                const primaryLocationInputValue = primaryLocationInput.value;
                const secondaryLocationInputValue = secondaryLocationInput.value;

                if (passwordInputValue !== confirmPasswordInputValue) throw "Password and confirmed password must be the same!";

                const validateUser = helper.validateUser( // THIS FUNCTION NEEDS TO BE CREATED IN THE HELPER FILE
                    firstNameInputValue,
                    lastNameInputValue,
                    emailInputValue,
                    passwordInputValue,
                    genderInputValue,
                    primaryLocationInputValue,
                    secondaryLocationInputValue,
                    isUpdating=true // THIS WILL BE A DEFAULT PARAM SET TO FALSE
                    // THE REASON FOR THIS IS TO TELL THE VALIDATOR WHETHER WE
                    // ARE REQUIRING ALL PARAMETERS TO CREATE THE USER OR NOT.
                );

                if (!validateUser) throw "validateUser: Could not validate the parameters.";

                updateUserForm.submit();

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
        const nameInput = document.getElementById('name');
        const descriptionInput = document.getElementById('description');
        const streetInput = document.getElementById('street');
        const boroughInput = document.getElementById('borough');
        const zipInput = document.getElementById('zip');
        
        const errorContainer = document.getElementById('error-container');
        const errorTextElement = errorContainer.getElementsByClassName('text-goes-here')[0];

        const resultsContainer = document.getElementById('results');

        submitSpotAppealForm.addEventListener('submit', (event) => {
            event.preventDefault();

            try {
                errorContainer.classList.add('hidden');

                const nameInputValue = nameInput.value;
                const descriptionInputValue = descriptionInput.value;
                const addressInputValue = {
                    "street": streetInput.value,
                    "borough": boroughInput.value,
                    "zip": zipInput.value
                };

                const validateSpotAppeal = helper.validateSpotFields(
                    nameInputValue,
                    descriptionInputValue,
                    addressInputValue
                );

                if (!validateSpotAppeal) throw "appealSpot: could not validate the appeal inputs.";

                submitSpotAppealForm.submit();

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