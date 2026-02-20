// const express = require("express");
// const { exec } = require("child_process");
// const cors = require("cors");
// const { spawn } = require("child_process");
// const net = require("net");

// const app = express();
// app.use(cors());
// app.use(express.json());

// // app.post("/ask", (req, res) => {
// // 	const prompt = req.body.prompt;

// // 	const process = exec("../llm.exe", (error, stdout, stderr) => {
// // 		if (error) {
// // 			return res.status(500).json({ error: "Error running LLM" });
// // 		}
// // 		res.json({ response: stdout });
// // 	});

// // 	process.stdin.write(prompt);
// // 	process.stdin.end();
// // });

// app.post("/ask", (req, res) => {
// 	const prompt = req.body.prompt;
// 	const client = new net.Socket();
// 	let responseData = "";

// client.connect({
//     port: 8080,
//     host: '::' // or '::1' for IPv6 loopback
// }, () => {
//     console.log("Connected to C++ LLM");
//     client.write(prompt + "\n");
// });
// 	client.on("data", (data) => {
// 		responseData += data.toString();
// 	});
// 	client.on("close", () => {
// 		res.json({ response: responseData });
// 	});
// 	client.on("error", (err) => {
// 		console.error("Connection error:", err.message);
// 		res.status(500).json({ error: "Cannot connect to C++ LLM server" });
// 	});

// });

// app.listen(5000, () => {
// 	console.log("Server running on port 5000");
// });

////  new code

// const express = require("express");
// const cors = require("cors");
// const net = require("net");
// const { log } = require("console");

// const app = express();
// app.use(cors());
// app.use(express.json());

// let busy = false;

// app.post("/ask", (req, res) => {
//     if (busy) {
//         return res.status(429).json({ error: "LLM is busy, please wait..." });
//     }

//     busy = true;

//     const prompt = req.body.prompt;
//     const client = new net.Socket();

//     let fullResponse = "";
//     let responded=false;
//     let timeoutHandle;

//     // Connect to IPv6 LLM server
//     client.connect(8080, "::1", () => {
//         console.log("Connected to LLM server");
//         client.write(prompt + "\n"); // IMPORTANT: newline for poll-based server
//     });

//     client.on("data", (data) => {
//         const chunk = data.toString();
//         console.log("RAW CHUNK:", JSON.stringify(chunk));
//         fullResponse += chunk;
//         const delimiterIndex = fullResponse.indexOf("♦");
//         if (delimiterIndex !== -1 && !responded) {
//             responded = true;
//             let rawResponse = fullResponse.slice(0, delimiterIndex);
//             const lines = rawResponse
//                 .split("\n")
//                 .map((line) => line.trim())
//                 .map((line) => {
//                     line.length > 0 &&
//                         !line.includes("Ask me anything") &&
//                         !line.includes("Thinking") &&
//                         !line.includes("-->");
//                 });
//             const finalResponse = lines.length > 0 ? lines[lines.length - 1] : "";
//             console.log("FINAL CLEAN RESPONSE:", finalResponse);
//             res.json({ response: finalResponse });
//             // Immediately disconnect AFTER full response
//             client.end();
//             client.destroy();
//             busy = false;
//         }
//     });

//     // client.on("end", () => {
//     //     console.log("LLM finished sending");

//     //     busy = false;
//     //     clearTimeout(timeoutHandle);

//     //     if (!res.headersSent) {
//     //         res.json({
//     //             response: fullResponse.trim()
//     //         });
//     //     }
//     // });

//     client.on("error", (err) => {
//         console.error("TCP Error:", err.message);
//         busy = false;
//         // clearTimeout(timeoutHandle);

//         if (!res.headersSent) {
//             res.status(500).json({
//                 error: "Connection to LLM server failed"
//             });
//         }
//     });

//     client.on("close",()=>{
//         console.log("TCP connection closed");
//         busy = false;
//     })

//     // 🛡 Smart timeout (longer for LLM generation)
//     setTimeout(() => {
//         console.log("Timeout reached, sending collected response");

//         const fallBack = fullResponse.trim() || 'No response from LLM'

//         client.end(); // graceful close instead of destroy
//         busy = false;

//         if (!res.headersSent) {
//             res.json({
//                 response: fallBack
//             });
//         }
//         client.destroy();
//         busy = false;
//     }, 10000 ); // 30 sec (adjust to your model speed)
// });

// app.listen(5000, () => {
//     console.log("Backend running on port 5000 (LLM streaming safe)");
// });

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