import React, { useState } from "react";
import API from "../api";

export default function Chatbot() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  const userId = localStorage.getItem("token") || "guest";

  // Function to format the bot response with non-null data
  const formatBotResponse = (data) => {
    let response = data.message + "\n\n";
    
    // Add events if available
    if (data.events) {
      response += "📅 **Events:**\n";
      Object.values(data.events).forEach(eventArray => {
        eventArray.forEach(event => {
          response += `• ${event.title} - ${new Date(event.date).toLocaleDateString()}\n`;
        });
      });
      response += "\n";
    }
    
    // Add clubs if available
    if (data.clubs) {
      response += "👥 **Clubs:**\n";
      Object.values(data.clubs).forEach(clubArray => {
        clubArray.forEach(club => {
          response += `• ${club.name}`;
          if (club.description) response += ` - ${club.description}`;
          response += "\n";
        });
      });
      response += "\n";
    }
    
    // Add teachers if available
    if (data.teachers) {
      response += "👨‍🏫 **Teachers:**\n";
      Object.values(data.teachers).forEach(teacherArray => {
        teacherArray.forEach(teacher => {
          response += `• ${teacher.name} (${teacher.email})\n`;
        });
      });
      response += "\n";
    }
    
    // Add students if available
    if (data.students) {
      response += "👨‍🎓 **Students:**\n";
      Object.values(data.students).forEach(studentArray => {
        studentArray.forEach(student => {
          response += `• ${student.name} (${student.email})\n`;
        });
      });
    }
    
    return response;
  };

  async function sendMessage() {
    if (!input.trim()) return;

    const newMessage = { sender: "user", text: input };
    setMessages([...messages, newMessage]);
    setInput("");

    try {
      console.log("Sending question to backend:", input);
      console.log("User ID:", userId);
      const res = await API.post("/chatbot/query", {
        question: input,
        user_id: userId,
      });
      
      console.log("Received response from backend:", res.data);
      
      // Format the bot response based on the data structure
      const botResponse = formatBotResponse(res.data);
      const botMessage = { sender: "bot", text: botResponse };
      
      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      console.error("Error fetching response:", err);
      setMessages((prev) => [...prev, { 
        sender: "bot", 
        text: "❌ Error fetching response from the server. Please try again later." 
      }]);
    }
  }

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  };

  return (
    <div style={{ 
      border: "1px solid #ccc", 
      padding: "20px", 
      width: "450px", 
      borderRadius: "10px",
      backgroundColor: "#f9f9f9",
      boxShadow: "0 2px 10px rgba(0,0,0,0.1)"
    }}>
      <h3 style={{ marginTop: 0, color: "#333" }}>AI Chatbot</h3>
      
      {/* Messages container */}
      <div style={{ 
        height: "300px", 
        overflowY: "auto", 
        border: "1px solid #ddd", 
        marginBottom: "15px", 
        padding: "10px",
        backgroundColor: "white",
        borderRadius: "5px"
      }}>
        {messages.length === 0 ? (
          <div style={{ 
            textAlign: "center", 
            color: "#666", 
            fontStyle: "italic",
            marginTop: "50%"
          }}>
            Start a conversation...
          </div>
        ) : (
          messages.map((m, i) => (
            <div 
              key={i} 
              style={{ 
                marginBottom: "10px",
                textAlign: m.sender === "user" ? "right" : "left" 
              }}
            >
              <div style={{ 
                display: "inline-block",
                padding: "8px 12px",
                borderRadius: "15px",
                backgroundColor: m.sender === "user" ? "#007bff" : "#e9ecef",
                color: m.sender === "user" ? "white" : "black",
                maxWidth: "80%",
                wordWrap: "break-word",
                whiteSpace: "pre-wrap"
              }}>
                <b>{m.sender === "user" ? "You" : "Bot"}:</b> {m.text}
              </div>
            </div>
          ))
        )}
      </div>
      
      {/* Input area */}
      <div style={{ display: "flex" }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask me anything about events, clubs, teachers, or students..."
          style={{ 
            width: "75%", 
            padding: "8px",
            border: "1px solid #ddd",
            borderRadius: "5px",
            fontSize: "14px"
          }}
        />
        <button 
          onClick={sendMessage} 
          style={{ 
            width: "25%", 
            marginLeft: "10px", 
            padding: "8px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            fontSize: "14px"
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}