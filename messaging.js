const createSocketConnection = async () =>{
    console.log(getToken());
    let token = await getToken("229b02aabece4e42203ed0bb3df1b5916edc44bf82b530887bdeb8");
    const params = {token};
    socket = new Phoenix.Socket("wss://api.sariska.io/api/v1/messaging/websocket", {params});
    socket.onOpen( () => console.log("connection open!") )
    socket.onError( () => console.log("there was an error with the connection!") )
    socket.onClose( () => console.log("the connection dropped") )


    socket.connect()  
    }

const joinChatRoom = () =>{
  roomName = document.getElementById("roomNameInput").value;
  channel = Phoenix.socket.channel(`chat:${roomName}`);

  channel.on("new_message", (message) =>{
    console.log(message);
    const messageBubble = document.createElement('div');
      messageBubble.classList.add('message-bubble');
      messageBubble.innerHTML = `
        <div class="message-info">
          <span class="message-sender">Participant: ${message.name}</span>
        </div>
        <div class="message-content">${message.content}</div>
      `;

        messageDisplay.appendChild(messageBubble);

        messageDisplay.scrollTop = messageDisplay.scrollHeight;
  });
  
  channel.join()
                .receive("ok", () => console.log("Channel Joined"))
                .receive("error", () => console.log("Failed to join"))
                .receive("timeout", () => console.log("Networking issue. Still waiting..."));
}

const leaveChatRoom = () => {
  channel.leave();
};

const sendMessage = () => {
  const message = messageInput.value;
  if (message.trim() !== '') {
      channel.push("new_message", {
          content: message
      })
      .receive("ok", () => console.log("Message sent"))
      .receive("error", () => console.log("Failed to send message"));
       console.log(message);
      messageInput.value = '';
  }
};

const toggleTextArea = () => {
    if (messageContainer.style.display === 'none') {
      messageContainer.style.display = 'inline';
    } else {
      messageContainer.style.display = 'none';
    }
  };