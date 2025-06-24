import { Linking, Alert } from "react-native";
import { AssistantCommand } from "../utils/intent-parser";
import { findContactByName } from "./contacts";
import { getTodayEvents } from "./calendar";
import { getCurrentLocation } from "./location";
import { chatCompletion, speak } from "./ai";
import { parseCommand } from "../utils/intent-parser";

function safe<T>(prom: Promise<T>, fallbackMsg: string): Promise<T | string> {
  return prom.catch(() => fallbackMsg);
}

export async function executeCommand(cmd: AssistantCommand): Promise<string> {
  switch (cmd.action) {
    case "call": {
      const contact = await safe(
        findContactByName(cmd.contactName),
        "Contacts permission missing. Calling feature disabled."
      );
      if (typeof contact === "string") return contact;
      if (contact && contact.phoneNumbers.length > 0) {
        const number = contact.phoneNumbers[0].number;
        Linking.openURL(`tel:${number}`);
        return `Calling ${contact.displayName}`;
      }
      return `I couldn't find ${cmd.contactName} in your contacts.`;
    }
    case "calendar_today": {
      const res = await safe(getTodayEvents(), "Calendar permission missing. Unable to access events.");
      if (typeof res === "string") return res;
      const events = res;
      if (events.length === 0) return "You have no events today.";
      const summary = events.map(e => `${e.title} at ${new Date(e.startDate).toLocaleTimeString()}`).join(". ");
      return `Here is your schedule for today: ${summary}`;
    }
    case "where_am_i": {
      const res = await safe(getCurrentLocation(), "Location permission missing.");
      if (typeof res === "string") return res;
      const loc = res;
      // For brevity we don't reverse geocode; just state coords
      return `You are at latitude ${loc.latitude.toFixed(3)}, longitude ${loc.longitude.toFixed(3)}.`;
    }
    default:
      return "I couldn't understand that command.";
  }
}

export async function handleUserInput(text: string): Promise<string> {
  const command = parseCommand(text);
  let reply: string;
  if (command.action !== "none") {
    reply = await executeCommand(command);
  } else {
    reply = await chatCompletion([
      { role: "system", content: "You are a helpful mobile assistant." },
      { role: "user", content: text },
    ]);
  }
  speak(reply);
  return reply;
} 