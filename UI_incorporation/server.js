//♦
const express = require("express");
const cors = require("cors");
const net = require("net");

const app = express();
app.use(cors());
app.use(express.json());// 1. Tell Express where your HTML/CSS files are
app.use(express.static(__dirname));

// 2. Tell Express to send index.html when someone visits the main link
app.get("/", (req, res) => {
    res.sendFile(__dirname + "/index.html");
});

let busy = false;

app.post("/ask", (req, res) => {
	if (busy) {
		return res.status(429).json({ error: "LLM is busy, please wait..." });
	}

	busy = true;

	const prompt = (req.body.prompt || "").trim();
	if (!prompt) {
		return res.status(400).json({ error: "Empty prompt" });
	}

	const client = new net.Socket();
	let fullResponse = "";
	let responded = false;
	let timeoutHandle;

	console.log("Incoming prompt:", prompt);

	// Connect to IPv6 C++ LLM server
	client.connect(8080, "::1", () => {
		console.log("Connected to LLM server (IPv6)");
		client.write(prompt + "\n"); // newline = message boundary for poll server
	});

	client.on("data", (data) => {
        const chunk = data.toString();
        fullResponse += chunk; // Keep building the big message

        const delimiterIndex = fullResponse.indexOf("♦");

        if (delimiterIndex !== -1 && !responded) {
            responded = true;

            // 1. Get everything BEFORE the diamond
            let rawResponse = fullResponse.slice(0, delimiterIndex);

            // 2. Clean up ONLY the system-level junk (Thinking, etc.)
            // We want to KEEP the AI's actual summary lines!
            const finalResponse = rawResponse
                .split("\n")
                .filter(line => 
                    !line.includes("Ask me anything") && 
                    !line.includes("Thinking") && 
                    !line.includes("-->")
                )
                .join("\n") // Put it back together with newlines!
                .trim();

            if (!res.headersSent) {
                res.json({ response: finalResponse });
            }

            clearTimeout(timeoutHandle);
            client.end();
            client.destroy();
            busy = false;
        }
    });

	client.on("error", (err) => {
		console.error("TCP Error:", err.message);

		clearTimeout(timeoutHandle);
		busy = false;

		if (!res.headersSent) {
			res.status(500).json({
				error: "Connection to C++ LLM server failed",
			});
		}
	});

	client.on("close", () => {
		console.log("TCP Connection closed");
		busy = false;
	});

	// 🛡 Smart timeout fallback (LLM safety)
	timeoutHandle = setTimeout(() => {
		if (!responded) {
			console.log("Timeout fallback triggered");

			// Remove delimiter if partially received
			let fallback = fullResponse.replace("♦", "").trim();
			if (!fallback) fallback = "No response from LLM";

			if (!res.headersSent) {
				res.json({ response: fallback });
			}

			client.destroy();
			busy = false;
		}
	}, 60000); // adjust based on your model speed (0s is safe)
});

app.listen(5000, () => {
	console.log("Backend running on port 5000 (IPv6 + Delimiter Mode)");

});
