function trimInputs() {
  var usernameInput = document.getElementById("username");
  var passwordInput = document.getElementById("password");

  // Trim leading and trailing whitespace from the input values
  usernameInput.value = usernameInput.value.trim();
  passwordInput.value = passwordInput.value.trim();
}

// Example client-side JavaScript code
