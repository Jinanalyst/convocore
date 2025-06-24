import Contacts from "react-native-contacts";
import { ensurePermissions } from "./permissions";

export async function getContacts(): Promise<Contacts.Contact[]> {
  const granted = await ensurePermissions(["contacts"]);
  if (!granted) throw new Error("Contacts permission denied");
  return Contacts.getAll();
}

export async function findContactByName(name: string): Promise<Contacts.Contact | undefined> {
  const contacts = await getContacts();
  const lower = name.toLowerCase();
  return contacts.find(c => (c.displayName || "").toLowerCase().includes(lower));
} 