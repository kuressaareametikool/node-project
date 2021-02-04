const submit = document.getElementById("register-button");
const regex = '/^[a-zA-Z]*$/g';
let isSuccess = true;

submit.addEventListener("click", validate);

function validate(e) {
    e.preventDefault();

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    const passwordAgain = document.getElementById("password-again").value;

    if (!username || username === '' || username.length < 6) {
        isSuccess = false;
        const nameError = document.getElementById("username-error");
        nameError.innerHTML = `
        <p>Username must be at least 6 characters!</p>
    `
    }

    if (password.length < 6 || !password) {
        isSuccess = false;
        const passwordError = document.getElementById("password-error");
        passwordError.innerHTML = `
        <p>Password must be at least 6 characters!</p>
    `
    }

    if (password !== passwordAgain) {
        isSuccess = false;
        const passwordAgainError = document.getElementById("password-again-error");
        passwordAgainError.innerHTML = `
        <p>Password must be the same!</p>
    `
    }
}
