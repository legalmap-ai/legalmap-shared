// errors.utils.ts

interface ErrorTranslation {
  name: string;
  message: string;
  translatedMessage: string;
}

// Tableau de mappage des erreurs à leurs messages traduits
const errorTranslations: ErrorTranslation[] = [
  {
    name: 'NotAuthorizedException',
    message: 'Unauthenticated access is not supported for this identity pool.',
    translatedMessage: "L'accès non authentifié n'est pas autorisé",
  },
];

// Fonction pour obtenir le message d'erreur traduit
export function translateError(error: { name: string; message: string }): string {
  const translation = errorTranslations.find(
    (err) => err.name === error.name && error.message.includes(err.message)
  );

  if (translation) {
    return translation.translatedMessage;
  }

  // Si l'erreur n'est pas dans la liste, renvoyer un message générique ou l'original
  return "Une erreur inattendue s'est produite."; // ou error.message si vous voulez renvoyer l'original
}
