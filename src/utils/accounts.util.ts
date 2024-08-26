const isValidPassword = (password: string) => {
  const passwordValue = password;

  const hasUppercase = /[A-Z]/.test(passwordValue) as boolean;
  const hasLowercase = /[a-z]/.test(passwordValue) as boolean;
  const hasMinLength = (passwordValue.length >= 8) as boolean;
  const hasNumeric = /[0-9]/.test(passwordValue) as boolean;

  let returnMessage = '';

  if (!hasUppercase) {
    returnMessage = 'Le mot de passe doit contenir au moins une majuscule.';
  } else if (!hasLowercase) {
    returnMessage = 'Le mot de passe doit contenir au moins une minuscule.';
  } else if (!hasMinLength) {
    returnMessage = 'Le mot de passe doit contenir au moins 8 caractères.';
  } else if (!hasNumeric) {
    returnMessage = 'Le mot de passe doit contenir au moins un chiffre.';
  } else {
    returnMessage = '';
  }

  return returnMessage;
};

export { isValidPassword };
