/**
 * Informacion del contacto del canal.
 * Un telefono puede relacionarse con 0, 1 o N terceros; el tercero
 * seleccionado se registra en la sesion, no aqui como verdad permanente.
 */
export interface Contact {
  contactId: string;
  channel: 'WHATSAPP';
  phone: string;
  displayName?: string;
  providerProfileName?: string;
  preferredLanguage?: string;
  createdAt: string;
  lastSeenAt: string;
}
