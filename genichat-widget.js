(function () {

    const config = window.genichatConfig || {
        widgetTitle: "GeniChat",
        themeColor: "#1E3A8A",
        adminStatus: "offline",
        adminNumber: "",
        whatsappB2B: "https://wa.me/919079133544?text=Hello%20I%20want%20B2B%20Sales%20Inquiry",
    whatsappSupport: "https://wa.me/917073073735?text=Hello%20I%20need%20Support"
    };

    async function getAdminStatus() {
        return fetch("/wp-json/genichat/v1/status")
            .then(res => res.json())
            .then(data => data.status)
            .catch(() => "offline");
    }

    // ------------------------------
    // CHAT BUTTON
    // ------------------------------
    const chatButton = document.createElement("div");
    chatButton.id = "GeniChatButton";
    chatButton.style = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: ${config.themeColor};
        color: Blue;
        padding: 15px 18px;
        border-radius: 50%;
        cursor: pointer;
        box-shadow: 0 4px 10px rgba(0,0,0,0.3);
        z-index: 999999;
        font-size: 20px;
    `;
    chatButton.innerHTML = "💬";
    document.body.appendChild(chatButton);

    // ------------------------------
    // CHAT BOX
    // ------------------------------
    const chatBox = document.createElement("div");
    chatBox.id = "GeniChatBox";
    chatBox.style = `
        position: fixed;
        bottom: 90px;
        right: 20px;
        width: 330px;
        height: 520px;
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

        <div style="padding:10px;">
            <div id="gcSuggestions" style="display:flex; gap:5px; flex-wrap:wrap;"></div>
        </div>

        <div style="padding:10px; display:flex; gap:5px;">
            <input id="gcInput" type="text" placeholder="Type message..."
                style="flex:1;padding:8px;border:1px solid #ccc;border-radius:5px;" />
            <button id="gcSend" 
                style="padding:8px 12px;background:${config.themeColor};
                color:white;border:none;border-radius:5px;">Send</button>
        </div>
    `;
    document.body.appendChild(chatBox);

    // ------------------------------
    // CHAT BUTTON TOGGLE
    // ------------------------------
    chatButton.onclick = () => {
        chatBox.style.display = chatBox.style.display === "none" ? "flex" : "none";
    };

    document.getElementById("gcSend").onclick = sendMsg;
    document.getElementById("gcInput").addEventListener("keypress", (e) => {
        if (e.key === "Enter") sendMsg();
    });

    // ------------------------------
    // DEFAULT SUGGESTIONS
    // ------------------------------
    const suggestions = [
        "Hello",
        "Price",
        "Help",
        "Track Device",
        "E-Lock",
        "Order",
        "How to Install a GPS Device",
        "How to Device activate",
    ];

    const suggContainer = document.getElementById("gcSuggestions");
    suggestions.forEach(sugg => {
        const btn = document.createElement("button");
        btn.innerText = sugg;
        btn.style = `
            padding:5px 10px;
            background:#0000ff;
            border:1px solid #ccc;
            border-radius:5px;
            cursor:pointer;
            font-size:13px;
        `;
        btn.onclick = () => {
            document.getElementById("gcInput").value = sugg;
            sendMsg();
            // optional: remove suggestions after click
            // suggContainer.innerHTML = "";
        };
        suggContainer.appendChild(btn);
    });

    // ------------------------------
    // SEND MESSAGE FUNCTION
    // ------------------------------
    async function sendMsg() {
        const input = document.getElementById("gcInput");
        const msg = input.value.trim();
        if (!msg) return;

        addMsg("user", msg);
        input.value = "";

        // 🔥 ALWAYS SEND TO WHATSAPP
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

    // ------------------------------
    // WHATSAPP FORWARD
    // ------------------------------
    function sendToWhatsApp(message) {
        fetch("/wp-json/genichat/v1/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: message })
        })
        .then(r => r.json())
        .then(res => {
            if (res.success && res.online && res.whatsapp_url) {
                window.open(res.whatsapp_url, "_blank");
            }
            console.log("WhatsApp:", res);
        })
        .catch(err => console.error("WA Error:", err));
    }

    // ------------------------------
    // ADD MESSAGE TO CHAT BOX
    // ------------------------------
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
            msg.innerHTML = text;
        } else {
            msg.innerText = text;
        }
        box.appendChild(msg);
        box.scrollTop = box.scrollHeight;
    }

    // ------------------------------
    // BOT REPLY FUNCTION
    // ------------------------------
    function getReply(msg) {
        msg = msg.toLowerCase();

        if (msg.includes("hello") || msg.includes("hi") || msg.includes("hey"))
            return "Hello! How can I help you today?";

        if (msg.includes("price"))
            return "Our pricing is flexible. What do you want to know?";

        if (msg.includes("help"))
            return "Sure! Tell me what issue you're facing,";

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

        if (msg.includes("install") || msg.includes("installation") || msg.includes("setup") || msg.includes("fitting"))
            return "Wired GPS Tracker Installation:<br>" +
                "1) Hide device under dashboard/seat.<br>" +
                "2) RED → +12V, BLACK → ground, YELLOW → ignition.<br>" +
                "3) Insert SIM with data.<br>" +
                "4) Power on vehicle.<br>" +
                "5) Add IMEI in FeTaca Track App.<br>" +
                "Full guide video: <a href=\"https://youtu.be/fXp1De_ZU1A?si=9aIcOR81i4CMKVx3\" target=\"_blank\" rel=\"noopener noreferrer\">Watch here</a>";
       if (
    msg.includes("activate") ||
    msg.includes("activation") ||
    msg.includes("device activate") ||
    msg.includes("start device") ||
    msg.toLowerCase().includes("turn on device") ||
    msg.includes("Active")
) {
    return "🔗 <b>Support Page:</b> <a href='https://fetaca.com/support/' target='_blank'>https://fetaca.com/support/</a><br><br>" +

        "📋 <b>Device Activation – Easy Step-by-Step Guide</b><br><br>" +

        "1️⃣ <b>Enter Personal Details</b><br>" +
        "• Name – Full name<br>" +
        "• Email ID – Active email<br>" +
        "• Phone Number – Mobile number<br><br>" +

        "2️⃣ <b>Provide Address Details</b><br>" +
        "• Address – City & State<br>" +
        "• Pin Code – Area pin code<br><br>" +

        "3️⃣ <b>Aadhaar Details (KYC)</b><br>" +
        "• Aadhaar Number – 12 digits<br>" +
        "• Upload Aadhaar image<br><br>" +

        "4️⃣ <b>Device Information</b><br>" +
        "• IMEI Number – 8 or 15 digits<br>" +
        "(Available on device / warranty card)<br><br>" +

        "5️⃣ <b>SIM Card Details</b><br>" +
        "• SIM Number – 13 or 20 digits<br>" +
        "• Upload SIM card image<br><br>" +

        "6️⃣ <b>Order & Warranty</b><br>" +
        "• Order ID (Amazon / Flipkart / Website)<br>" +
        "• Upload warranty card image<br><br>" +

        "7️⃣ <b>Additional Message (Optional)</b><br>" +
        "• Add comments if any<br><br>" +

        "8️⃣ <b>Submit the Form</b><br>" +
        "• Review details & click Submit<br><br>" +

        "✅ Our team will verify your details and contact you within <b>24 hours</b>.<br><br>" +

        "🔗 <b>For full support, visit:</b> <a href='https://fetaca.com/support/' target='_blank'>https://fetaca.com/support/</a>";
}
      
        return "Thank you! A support person will get back to you soon.";
    }

})();





















