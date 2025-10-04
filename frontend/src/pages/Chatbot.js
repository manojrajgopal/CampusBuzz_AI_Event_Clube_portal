import React, { useState } from "react";
import API from "../api";

export default function Chatbot() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  const userId = localStorage.getItem("token") || "guest"; // student id if logged in

  async function sendMessage() {
    if (!input.trim()) return;

    const newMessage = { sender: "user", text: input };
    setMessages([...messages, newMessage]);
    setInput("");

    try {
      console.log("Sending question to backend:", input);
      console.log("User ID:", userId);
      const res = await API.post("/chatbot/ask", {
        question: input,
        user_id: userId,
      });
      console.log(res);
      
      console.log("Received response from backend:", res.data);
      const botMessage = { sender: "bot", text: res.data.answer };
      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      setMessages((prev) => [...prev, { sender: "bot", text: "❌ Error fetching response" }]);
    }
  }

  return (
    <div style={{ border: "1px solid #ccc", padding: "10px", width: "400px" }}>
      <h3>AI Chatbot</h3>
      <div style={{ height: "250px", overflowY: "auto", border: "1px solid #ddd", marginBottom: "10px", padding: "5px" }}>
        {messages.map((m, i) => (
          <div key={i} style={{ textAlign: m.sender === "user" ? "right" : "left" }}>
            <b>{m.sender === "user" ? "You" : "Bot"}:</b> {m.text}
          </div>
        ))}
      </div>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Ask me anything..."
        style={{ width: "75%" }}
      />
      <button onClick={sendMessage} style={{ width: "20%", marginLeft: "5px" }}>Send</button>
    </div>
  );
}

