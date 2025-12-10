(function () {

    const config = window.genichatConfig || {
        widgetTitle: "GeniChat",
        themeColor: "#1E3A8A",
        adminStatus: "offline",
        adminNumber: ""
    };

    async function getAdminStatus() {
        return fetch("/wp-json/genichat/v1/status")
            .then(res => res.json())
            .then(data => data.status)
            .catch(() => "offline");
    }

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

    chatButton.onclick = () => {
        chatBox.style.display = chatBox.style.display === "none" ? "flex" : "none";
    };

    document.getElementById("gcSend").onclick = sendMsg;
    document.getElementById("gcInput").addEventListener("keypress", (e) => {
        if (e.key === "Enter") sendMsg();
    });

    /* ------------------------------------------------------
       FIXED FUNCTION → Always Send WhatsApp Message
    ------------------------------------------------------ */
    async function sendMsg() {
        const input = document.getElementById("gcInput");
        const msg = input.value.trim();
        if (!msg) return;

        addMsg("user", msg);
        input.value = "";

        // 🔥 ALWAYS SEND TO WHATSAPP (Online or Offline)
        sendToWhatsApp(msg);

        const status = await getAdminStatus();

        if (status === "online") {
            addMsg("bot", "Admin is online and will reply shortly 😊");
            return;
        }

        setTimeout(() => {
            addMsg("bot", getReply(msg));
        }, 500);
    }

    /* ------------------------------------------
       WhatsApp Forward API
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
        .then(res => {
            // If admin online → open WhatsApp
            if (res.success && res.online && res.whatsapp_url) {
                window.open(res.whatsapp_url, "_blank");
            }
            console.log("WhatsApp:", res);
        })
        .catch(err => console.error("WA Error:", err));
    }

    function addMsg(sender, text) {
        const box = document.getElementById("gcMessages");
        const msg = document.createElement("div");
        msg.style = `
            background:${sender === "user" ? "#DBEAFE" : "#F3F4F6"};
            padding:8px; margin:6px 0; border-radius:5px;
            text-align:${sender === "user" ? "right" : "left"};
            word-wrap: break-word;
            white-space: pre-wrap;
        `;

        if (sender === "bot") {
            // Render HTML (for clickable links, line breaks)
            msg.innerHTML = text;
        } else {
            // Plain text for user messages
            msg.innerText = text;
        }
        box.appendChild(msg);
        box.scrollTop = box.scrollHeight;
    }

    function getReply(msg) {
        msg = msg.toLowerCase();

        if (msg.includes("hello") || msg.includes("hi"))
            return "Hello! How can I help you today?";

        if (msg.includes("price"))
            return "Our pricing is flexible. What do you want to know?";

        if (msg.includes("help"))
            return "Sure! Tell me what issue you're facing.";

        if (msg.includes("track") || msg.includes("tracking"))
            return "You can track your device using the FeTaca Track App. Do you need the app link or help logging in?";

        if (msg.includes("elog") || msg.includes("e-lock") || msg.includes("elock"))
            return "FeTaca E-Lock is a waterproof GPS smart lock with real-time tracking, tamper alerts, and remote unlocking. Would you like features, price, or installation details?";

        if (msg.includes("vehicle") || msg.includes("car") || msg.includes("bike"))
            return "We have multiple GPS trackers for cars, bikes, and trucks. Tell me your vehicle type and I’ll suggest the best option.";

        if (msg.includes("app") || msg.includes("login") || msg.includes("account"))
            return "For app support, tell me your issue — login problem, password reset, or device not showing?";

        if (msg.includes("order") || msg.includes("buy") || msg.includes("purchase"))
            return "Great! Tell me which product you want to order, and I’ll share the purchase link.";

        if (msg.includes("contact") || msg.includes("number") || msg.includes("call"))
            return "You can contact our support team anytime. Would you like the phone number or WhatsApp link?";

        if (msg.includes("install") || msg.includes("installation"))
            return "Wired GPS Tracker Installation:<br>" +
                "1) Hide device under dashboard/seat.<br>" +
                "2) RED → +12V, BLACK → ground, YELLOW → ignition.<br>" +
                "3) Insert SIM with data.<br>" +
                "4) Power on vehicle.<br>" +
                "5) Add IMEI in FeTaca Track App.<br>" +
                "Full guide video: <a href=\"https://youtu.be/fXp1De_ZU1A?si=9aIcOR81i4CMKVx3\" target=\"_blank\" rel=\"noopener noreferrer\">Watch here</a>";

        return "Thank you! A support person will get back to you soon.";
    }

})();
