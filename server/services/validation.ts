export function validateUserInformation(email: string, password: string) {

  const emailValid = email && email.includes('@') && email.length >= 5;
  const passwordValid = password.length >= 8 && /\d/.test(password) && /\w/.test(password);;

  return emailValid && passwordValid;
}