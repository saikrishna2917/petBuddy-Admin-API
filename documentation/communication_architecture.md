# Real-Time Communication Architecture

This documentation outlines the complete strategy for building a real-time messaging system within PetBuddy, enabling instant communication between users (Pet Owners, Pet Sitters) and Admins within Support Tickets or Bookings.

> [!IMPORTANT]
> To achieve **immediate UI updates from both sides** without forcing the user to refresh the page, we must use **WebSockets** (specifically `socket.io` in a Node.js ecosystem). REST APIs alone are not sufficient because they only allow the client to *pull* data, whereas WebSockets allow the server to *push* data instantly to connected clients.

---

## 1. Database Schema (How to Store Messages)

Instead of cluttering the `supportsModel` with a massive array of messages, it is best practice to create a standalone `messagesModel.js` collection. This allows infinite scaling and easy pagination without hitting MongoDB document size limits.

```javascript
// src/models/messagesModel.js
const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  ticketID: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "supportsModel",
    required: true 
  },
  senderID: { 
    type: mongoose.Schema.Types.ObjectId, 
    required: true 
  },
  senderType: { 
    type: String, 
    enum: ["PET_OWNER", "PET_SITTER", "ADMIN"], 
    required: true 
  },
  content: { 
    type: String, 
    required: true 
  },
  isRead: { 
    type: Boolean, 
    default: false 
  }
}, { timestamps: true });

module.exports = mongoose.model("messagesModel", messageSchema);
```

---

## 2. Backend WebSocket Setup (Node.js & Express)

You will need to install Socket.IO:
`npm install socket.io`

### Initializing the Socket Server
In your main `server.js` or `app.js` file, wrap your Express server with Socket.IO:

```javascript
const http = require('http');
const { Server } = require("socket.io");
const app = require('./app'); // Your express app

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Replace with your frontend URL in production
    methods: ["GET", "POST"]
  }
});

// Socket logic
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  // 1. Join a specific "room" for the ticket
  socket.on("join_ticket", (ticketId) => {
    socket.join(ticketId);
    console.log(`User joined ticket room: ${ticketId}`);
  });

  // 2. Listen for incoming messages
  socket.on("send_message", async (data) => {
    // data = { ticketID, senderID, senderType, content }
    
    // Step A: Save the message to MongoDB
    const newMessage = await messagesModel.create(data);

    // Step B: Broadcast the message to everyone else in the room immediately
    // Using io.to().emit sends it to ALL clients in the room including the sender
    io.to(data.ticketID).emit("receive_message", newMessage);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

---

## 3. Frontend Implementation (React)

You will need the client SDK:
`npm install socket.io-client`

### Integrating inside `TicketDetails.tsx`

When an admin opens the ticket details page, they should automatically connect to the socket and join the "room" specific to that ticket. 

```tsx
import React, { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

// 1. Initialize Socket Connection outside component to prevent reconnects
const socket: Socket = io("http://localhost:5000"); // Replace with your backend URL

const TicketDetails = () => {
  const { ticketId } = useParams();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  useEffect(() => {
    // 2. Fetch historical messages from REST API when page loads
    axiosInstance.get(`/api/messages/${ticketId}`).then(res => {
      setMessages(res.data);
    });

    // 3. Join the real-time room for this specific ticket
    socket.emit("join_ticket", ticketId);

    // 4. Listen for incoming live messages
    socket.on("receive_message", (message) => {
      // Append the new message to the existing state instantly
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    // Cleanup when leaving the page
    return () => {
      socket.off("receive_message");
    };
  }, [ticketId]);

  // 5. Sending a message
  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const messageData = {
      ticketID: ticketId,
      senderID: currentAdminId, // Get from your auth context
      senderType: "ADMIN",
      content: newMessage
    };

    // Emit to backend. The backend will save it and emit 'receive_message' back
    socket.emit("send_message", messageData);
    
    setNewMessage(""); // Clear input
  };

  return (
    // Your UI mapping over the `messages` array goes here
  );
};
```

---

## 4. Key Benefits of this Architecture
1. **Zero Refreshing:** Because of `socket.on("receive_message")`, as soon as a user on the mobile app sends a message, the Admin dashboard immediately renders it by updating the React state.
2. **Room Isolation:** Using `socket.join(ticketId)` ensures that messages broadcasted for Ticket A do not show up on the screen for admins looking at Ticket B.
3. **Database Efficiency:** Storing messages in their own collection makes the database extremely fast. If a ticket has 10,000 messages, it won't crash the server trying to fetch the `supportTicket` document.

> [!TIP]
> If you decide to build this, start by making the standard REST API to post and fetch messages first. Once the database logic works flawlessly, wrap Socket.IO around it to provide the "real-time" instant magic.
