"use client";

import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, ArrowLeft, Users, Search } from "lucide-react";
import { io } from "socket.io-client";

export default function WhatsAppMessenger({ userId, allUser = [] }) {
  const CURRENT_USER_ID = userId;

  const [socket, setSocket] = useState(null);
  const [users, setUsers] = useState(allUser);
  const [activeReceiver, setActiveReceiver] = useState(null);
  const [messageText, setMessageText] = useState("");
  const [messages, setMessages] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const chatEndRef = useRef(null);
  const [onlineUsersList, setOnlineUsersList] = useState([]);
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  const typingTimeoutRef = useRef(null);

  // Dynamic background color (same as registration page)
  const [bgColor, setBgColor] = useState("#25D366");

  useEffect(() => {
    const colors = ["#25D366", "#128C7E", "#075E54", "#1F2A33"];
    const interval = setInterval(() => {
      setBgColor(colors[Math.floor(Math.random() * colors.length)]);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // update user with send and received message
  const moveUserToTop = (partnerId) => {
    setUsers((prevUsers) => {
      // 1. Find the user who sent or received the message
      const targetUser = prevUsers.find((u) => u._id === partnerId);
      if (!targetUser) return prevUsers;

      // 2. Filter out the other users without target user
      const remainingUsers = prevUsers.filter((u) => u._id !== partnerId);

      // 3. Return a new array with the target user at the top
      return [targetUser, ...remainingUsers];
    });
  };

  // Fetch users & Initialize Socket
  useEffect(() => {
    const newSocket = io(`${process.env.NEXT_PUBLIC_SERVER_URL}`);
    setSocket(newSocket);

    // 3 user online offline status update feature
    // 3.1 register the current user as online when the socket connects
    newSocket.emit("addUserOnline", CURRENT_USER_ID);

    // 3.2 listen for the list of online users from the server
    newSocket.on("getOnlineUsers", (users) => {
      setOnlineUsersList(users);
    });

    return () => newSocket.disconnect();
  }, [CURRENT_USER_ID]);

  // Chat History + Socket Listeners
  useEffect(() => {
    if (!socket || !activeReceiver) return;

    const markMessagesAsSeen = async () => {
      try {
        await fetch("http://localhost:5000/api/messages/mark-as-seen", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            senderId: activeReceiver._id,
            receiverId: CURRENT_USER_ID,
          }),
        });

        // লোকাল স্টেটেও ওই ইউজারের কাউন্ট ০ করে দেওয়া যেন সাথে সাথে লাল ডট উধাও হয়
        setUsers((prevUsers) =>
          prevUsers.map((u) =>
            u._id === activeReceiver._id ? { ...u, unseenCount: 0 } : u,
          ),
        );
      } catch (err) {
        console.error(err);
      }
    };
    markMessagesAsSeen();

    const fetchChatHistory = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_SERVER_URL}/api/messages/${CURRENT_USER_ID}/${activeReceiver._id}`,
        );
        const data = await res.json();
        setMessages(data || []);
      } catch (err) {
        console.error(err);
      }
    };

    fetchChatHistory();

    socket.emit("joinRoom", {
      senderId: CURRENT_USER_ID,
      receiverId: activeReceiver._id,
    });

    socket.on("receiveMessage", (newMessage) => {
      if (newMessage) {
        // যদি চ্যাট বক্স ওপেন থাকে, তবে মেসেজ লিস্টে দেখাও
        if (
          activeReceiver?._id === newMessage.sender ||
          activeReceiver?._id === newMessage.receiver
        ) {
          setMessages((prev) => [...prev, newMessage]);
        }

        // লাইভ আনসিন কাউন্ট বাড়ানোর লজিক 🔔
        const partnerId =
          newMessage.sender === CURRENT_USER_ID
            ? newMessage.receiver
            : newMessage.sender;

        setUsers((prevUsers) =>
          prevUsers.map((u) => {
            if (u._id === partnerId) {
              // যদি মেসেজটি অন্য কেউ দেয় এবং তার চ্যাট উইন্ডো ওপেন না থাকে, তবে কাউন্ট ১ বাড়াও
              const shouldIncrement =
                newMessage.sender !== CURRENT_USER_ID &&
                activeReceiver?._id !== partnerId;
              return {
                ...u,
                unseenCount: shouldIncrement ? (u.unseenCount || 0) + 1 : 0,
              };
            }
            return u;
          }),
        );

        moveUserToTop(partnerId);
      }
    });

    // 4 Typing Indicator
    socket.on("partnerTyping", (data) => {
      // নিশ্চিত হওয়া যে টাইপ করা ব্যক্তিটিই আপনার বর্তমান একটিভ চ্যাট পার্টনার
      if (data.senderId === activeReceiver?._id) {
        setIsPartnerTyping(data.isTyping);
      }
    });

    return () => {
      socket.off("receiveMessage");
      socket.off("partnerTyping");
    };
  }, [activeReceiver, socket, CURRENT_USER_ID]);

  // 4.1 Send typing event when user is typing
  const handleInputChange = (e) => {
    setMessageText(e.target.value);

    if (!socket || !activeReceiver) return;

    // create unique roomId
    const roomId = [CURRENT_USER_ID, activeReceiver._id].sort().join("-");

    // send typing event to backend
    socket.emit("typing", { roomId, senderId: CURRENT_USER_ID });

    // if timer is already running, clear it to reset the countdown
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    // after 3 second send 'stopTyping' because your typing is stop
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("stopTyping", { roomId, senderId: CURRENT_USER_ID });
    }, 3000);
  };

  // Auto scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!messageText.trim() || !socket || !activeReceiver) return;

    const messageData = {
      sender: CURRENT_USER_ID,
      receiver: activeReceiver._id,
      text: messageText,
      messageType: "text",
    };

    socket.emit("sendMessage", messageData);
    moveUserToTop(activeReceiver._id);
    setMessageText("");

    // 4.2 Stop typing event when message is sent
    socket.emit("stopTyping", { roomId, senderId: CURRENT_USER_ID });
  };

  const filteredUsers = users.filter((user) =>
    user?.name?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="flex h-screen overflow-hidden bg-[#0A0F14] text-white font-sans">
      {/* Dynamic Background Overlay */}
      <motion.div
        className="absolute inset-0 opacity-10 pointer-events-none"
        animate={{
          background: `linear-gradient(135deg, ${bgColor} 0%, #111B21 100%)`,
        }}
        transition={{ duration: 5, ease: "easeInOut" }}
      />

      {/* Sidebar - Users List */}
      <div className="w-96 border-r border-[#2A3A47] flex flex-col bg-[#1F2A33]">
        {/* Header */}
        <div className="p-4 border-b border-[#2A3A47] flex items-center gap-3">
          <div className="w-10 h-10 bg-[#25D366] rounded-full flex items-center justify-center">
            💬
          </div>
          <h1 className="text-2xl font-light">WhatsApp</h1>
        </div>

        {/* Search */}
        <div className="p-4">
          <div className="relative">
            <Search
              className="absolute left-4 top-3 text-[#8696A0]"
              size={20}
            />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#2A3A47] border border-[#3A4A57] focus:border-[#25D366] pl-11 py-3 rounded-2xl text-sm outline-none"
            />
          </div>
        </div>

        {/* Users List */}
        <div className="flex-1 overflow-y-auto px-2 space-y-1">
          {filteredUsers?.map((user) => {
            const isOnline = onlineUsersList.includes(user._id);
            return (
              <button
                key={user?._id}
                onClick={() => setActiveReceiver(user)}
                className={`w-full flex items-center gap-4 p-3 rounded-2xl transition-all hover:bg-[#2A3A47] ${
                  activeReceiver?._id === user?._id ? "bg-[#2A3A47]" : ""
                }`}
              >
                <div className="relative">
                  <img
                    src={user?.image || "/default-avatar.png"}
                    alt={user?.name}
                    className={`w-14 h-14 rounded-full object-cover ${isOnline && "border-2 border-[#25D366]/30"}`}
                  />
                  {isOnline && (
                    <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-[#1F2A33]"></div>
                  )}
                </div>

                <div className="flex-1 text-left">
                  {/* username */}
                  <p className="font-medium text-lg">{user.name}</p>
                  <p className="text-sm text-[#8696A0] truncate">
                    {/* User unseen message count */}
                    {user.unseenCount > 0 ? (
                      <p className=" text-white font-bold ml-auto ">
                        {user.unseenCount} unseen message
                      </p>
                    ) : (
                      <p className="text-sm mt-1  text-[#8696A0] truncate">
                        Tap to start chatting
                      </p>
                    )}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {activeReceiver ? (
          <>
            {/* Chat Header */}
            <div className="h-16 bg-[#1F2A33] border-b border-[#2A3A47] flex items-center px-6">
              <button
                onClick={() => setActiveReceiver(null)}
                className="mr-4 lg:hidden text-[#8696A0]"
              >
                <ArrowLeft size={24} />
              </button>

              <div className="flex items-center gap-4">
                <img
                  src={activeReceiver.image || "/default-avatar.png"}
                  alt={activeReceiver.name}
                  className="w-11 h-11 rounded-full object-cover"
                />
                <div>
                  <h2 className="font-semibold text-xl">
                    {activeReceiver.name}
                  </h2>

                  {/* Typing Indicator */}
                  {isPartnerTyping ? (
                    <p className="text-sm text-[#25D366]">Typing...</p>
                  ) : onlineUsersList.includes(activeReceiver._id) ? (
                    <p className="text-sm font-bold text-[#25D366]">online</p>
                  ) : (
                    <p className="text-sm font-bold text-[#d32525]">offline</p>
                  )}
                  <div ref={chatEndRef} />
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#0F1A21]">
              {messages?.map((msg, index) => {
                const isMe = msg.sender === CURRENT_USER_ID;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[70%] px-5 py-3 rounded-3xl ${
                        isMe
                          ? "bg-[#25D366] text-black rounded-br-none"
                          : "bg-[#2A3A47] text-white rounded-bl-none"
                      }`}
                    >
                      <p className="text-[17px] leading-relaxed">{msg.text}</p>
                      <p className="text-xs mt-1 opacity-70 text-left ">
                        {new Date(
                          msg.createdAt || Date.now(),
                        ).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
              <div ref={chatEndRef} />
            </div>

            {/* Message Input */}
            <form
              onSubmit={handleSendMessage}
              className="p-5 bg-[#1F2A33] border-t border-[#2A3A47]"
            >
              <div className="flex gap-3">
                <input
                  type="text"
                  value={messageText}
                  onChange={(e) => {
                    setMessageText(e.target.value);
                    handleInputChange(e);
                  }}
                  placeholder={`Message ${activeReceiver.name}...`}
                  className="flex-1 bg-[#2A3A47] border border-[#3A4A57] focus:border-[#25D366] rounded-3xl px-6 py-4 outline-none text-lg"
                />
                <button
                  type="submit"
                  disabled={!messageText.trim()}
                  className="bg-[#25D366] hover:bg-[#20C258] disabled:bg-[#3A4A57] w-14 h-14 rounded-3xl flex items-center justify-center transition-all active:scale-95"
                >
                  <Send size={24} className="text-black" />
                </button>
              </div>
            </form>
          </>
        ) : (
          /* Empty State */
          <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
            <div className="text-8xl mb-8 opacity-40">💬</div>
            <h2 className="text-4xl font-light text-white mb-4">
              Welcome to WhatsApp
            </h2>
            <p className="text-[#8696A0] text-xl max-w-md">
              Select a user from the sidebar to start a secure conversation
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
