newSocket.on("receiveMessage", (newMessage) => {
  if (newMessage) {
    // যদি চ্যাট বক্স ওপেন থাকে, তবে মেসেজ লিস্টে দেখাও
    if (activeReceiver?._id === newMessage.sender || activeReceiver?._id === newMessage.receiver) {
      setMessages((prev) => [...prev, newMessage]);
    }

    // লাইভ আনসিন কাউন্ট বাড়ানোর লজিক 🔔
    const partnerId = newMessage.sender === CURRENT_USER_ID ? newMessage.receiver : newMessage.sender;
    
    setUsers(prevUsers => 
      prevUsers.map(u => {
        if (u._id === partnerId) {
          // যদি মেসেজটি অন্য কেউ দেয় এবং তার চ্যাট উইন্ডো ওপেন না থাকে, তবে কাউন্ট ১ বাড়াও
          const shouldIncrement = newMessage.sender !== CURRENT_USER_ID && activeReceiver?._id !== partnerId;
          return {
            ...u,
            unseenCount: shouldIncrement ? (u.unseenCount || 0) + 1 : 0
          };
        }
        return u;
      })
    );

    moveUserToTop(partnerId);
  }
});