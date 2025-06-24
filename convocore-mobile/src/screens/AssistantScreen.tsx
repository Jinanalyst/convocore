import React, { useState } from "react";
import { View, Text, TextInput, Button, StyleSheet, ScrollView } from "react-native";
import Voice from "react-native-voice";
import { handleUserInput } from "../services/executor";
import { transcribeAudio } from "../services/ai";

export default function AssistantScreen() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<string[]>([]);
  const [recording, setRecording] = useState(false);

  const onSend = async () => {
    const text = input.trim();
    if (!text) return;
    setMessages((m: string[]) => ["You: " + text, ...m]);
    setInput("");
    try {
      const reply = await handleUserInput(text);
      setMessages((m: string[]) => ["AI: " + reply, ...m]);
    } catch (err) {
      setMessages((m: string[]) => ["Error: " + (err as Error).message, ...m]);
    }
  };

  const startVoice = async () => {
    Voice.onSpeechResults = async (e: any) => {
      if (e.value && e.value.length > 0) {
        const text = e.value[0];
        setRecording(false);
        setMessages((m: string[]) => ["You (voice): " + text, ...m]);
        try {
          const reply = await handleUserInput(text);
          setMessages((m: string[]) => ["AI: " + reply, ...m]);
        } catch (err) {
          setMessages((m: string[]) => ["Error: " + (err as Error).message, ...m]);
        }
      }
    };
    Voice.start("en-US");
    setRecording(true);
  };

  return (
    <View style={styles.container}>
      <ScrollView style={{ flex: 1 }} inverted>
        {messages.map((m: string, idx: number) => (
          <Text key={idx} style={styles.message}>{m}</Text>
        ))}
      </ScrollView>

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Ask me anything"
          value={input}
          onChangeText={setInput}
        />
        <Button title="Send" onPress={onSend} />
        <Button title={recording ? "Stop" : "Voice"} onPress={startVoice} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  inputRow: { flexDirection: "row", alignItems: "center" },
  input: { flex: 1, borderColor: "#ccc", borderWidth: 1, marginRight: 8, padding: 8 },
  message: { marginVertical: 4 },
}); 