(function () {

    // Get config from WordPress
    const config = window.genichatConfig || {
        widgetTitle: "GeniChat",
        themeColor: "#1E3A8A",
        adminStatus: "offline",
        adminNumber: ""
    };

    /* ------------------------------------------
       Function: Get Admin Status from WordPress
    ------------------------------------------ */
    async function getAdminStatus() {
        return fetch("/wp-json/genichat/v1/status")
            .then(res => res.json())
            .then(data => data.status)
            .catch(() => "offline");
    }

    /* --- Floating Chat Button --- */
    const chatButton = document.createElement("div");
    chatButton.id = "GeniChatButton";
    chatButton.style = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: ${config.themeColor};
        color: white;
        padding: 15px 18px;
        border-radius: 50%;
        cursor: pointer;
        box-shadow: 0 4px 10px rgba(0,0,0,0.3);
        z-index: 999999;
        font-size: 20px;
    `;
    chatButton.innerHTML = "💬";
    document.body.appendChild(chatButton);

    /* --- Chat Box UI --- */
    const chatBox = document.createElement("div");
    chatBox.id = "GeniChatBox";
    chatBox.style = `
        position: fixed;
        bottom: 90px;
        right: 20px;
        width: 330px;
        height: 420px;
        background: white;
        border-radius: 10px;
        box-shadow: 0 5px 20px rgba(0,0,0,0.3);
        display: none;
        flex-direction: column;
        z-index: 999999;
        overflow: hidden;
    `;
    chatBox.innerHTML = `
        <div style="background:${config.themeColor};color:white;padding:12px;font-size:18px;" id="gcHeader">
            ${config.widgetTitle}
        </div>

        <div id="gcMessages" style="flex:1; padding:10px; overflow-y:auto; font-size:14px;"></div>

        <div style="padding:10px; display:flex; gap:5px;">
            <input id="gcInput" type="text" placeholder="Type message..."
                style="flex:1;padding:8px;border:1px solid #ccc;border-radius:5px;" />

            <button id="gcSend" 
                style="padding:8px 12px;background:${config.themeColor};
                color:white;border:none;border-radius:5px;">Send</button>
        </div>
    `;
    document.body.appendChild(chatBox);

    /* --- Open/Close Button --- */
    chatButton.onclick = () => {
        chatBox.style.display = chatBox.style.display === "none" ? "flex" : "none";
    };

    document.getElementById("gcSend").onclick = sendMsg;
    document.getElementById("gcInput").addEventListener("keypress", (e) => {
        if (e.key === "Enter") sendMsg();
    });

    /* ------------------------------------------
       Message Handler With WhatsApp Sending
    ------------------------------------------ */
    async function sendMsg() {
        const input = document.getElementById("gcInput");
        const msg = input.value.trim();
        if (!msg) return;

        addMsg("user", msg);
        input.value = "";

        // 🔥 CHECK ADMIN STATUS
        const status = await getAdminStatus();

        if (status === "online") {
            addMsg("bot", "Admin is online and will reply shortly 😊");

            // SEND MESSAGE TO WORDPRESS → WhatsApp
            sendToWhatsApp(msg);

            return;
        }

        // 🟡 Admin Offline → Auto Bot Reply
        setTimeout(() => {
            addMsg("bot", getReply(msg));
        }, 500);
    }

    /* ------------------------------------------
       NEW FUNCTION → Send Chat to WhatsApp
    ------------------------------------------ */
    function sendToWhatsApp(message) {
        fetch("/wp-json/genichat/v1/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                message: message
            })
        })
        .then(r => r.json())
        .then(res => console.log("WhatsApp:", res))
        .catch(err => console.error("WA Error:", err));
    }

    /* --- Add message in window --- */
    function addMsg(sender, text) {
        const box = document.getElementById("gcMessages");
        const msg = document.createElement("div");
        msg.style = `
            background:${sender === "user" ? "#DBEAFE" : "#F3F4F6"};
            padding:8px; margin:6px 0; border-radius:5px;
            text-align:${sender === "user" ? "right" : "left"};
        `;
        msg.innerText = text;
        box.appendChild(msg);
        box.scrollTop = box.scrollHeight;
    }

    /* --- Auto Bot Replies --- */
    function getReply(msg) {
        msg = msg.toLowerCase();
        if (msg.includes("hello") || msg.includes("hi"))
            return "Hello! How can I help you today?";
        if (msg.includes("price"))
            return "Our pricing is flexible. What do you want to know?";
        if (msg.includes("help"))
            return "Sure! Tell me what issue you’re facing.";
        return "Thank you! A support person will get back to you soon.";
    }

})();
