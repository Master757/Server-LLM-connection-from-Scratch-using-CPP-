# Custom C++ / Node.js Local LLM Server

## Authors
* **Kaushik Chakraborty** — TCP server integration with LLM manager, and incorporation with the front and backend servers.
* **Bhabani Sankar** — Frontend UI/UX design and Node.js server incorporation.

## Overview
This project is a custom-built, full-stack Artificial Intelligence chat application. It utilizes a custom C++ TCP server to interface directly with local Large Language Models (LLMs) and a Node.js Express web server to handle the frontend interface. The application is exposed to the internet using ngrok, in a Linux/WSL environment.

## Architecture
* **Backend:** C++ TCP Server utilizing `libcurl` to communicate with the Ollama API.
* **Frontend:** Node.js Express server serving HTML, CSS, and Vanilla JavaScript.
* **AI Engine:** Ollama running local models (e.g., Llama 3.1, Mistral, or custom Modelfiles).
* **Tunneling:** ngrok for secure public access.

## Prerequisites
Ensure the following are installed on your *Linux/WSL* environment:
* `g++` compiler
* `libcurl` development packages
* Node.js and `npm`
* Ollama
* ngrok

## Step 1: Install Dependencies
Open your terminal and run the following commands to install the required system libraries and Node.js packages.

```bash
# Update package lists
sudo apt-get update

# Install C++ curl library
sudo apt-get install libcurl4-openssl-dev

# Navigate to your frontend directory and install Node.js dependencies
npm install
```

Step 2: Configure the AI Brain
This application requires Ollama to be running in the background. Start Ollama and pull your preferred model.

```bash
# Start the Ollama service (if not already running)
ollama serve &

# Pull the base model
ollama pull mistral
```

#note:: If you are using a custom personality, ensure you have built it using ```ollama create your_model_name -f Modelfile```

## Step 3: Compile the C++ Backend
Navigate to the root directory of your C++ project and compile the source code. You must link the curl library using the -lcurl flag.

```bash
g++ main.cpp ServerClass/TCP_server.cpp LLM_Manager/LLM_Manager.cpp -o ai_chat_server -lcurl
```

## Step 4: Run the Full Stack
You will need three separate terminal windows to run the complete application stack.

  --> Terminal 1: Start the C++ TCP Server
  This server manages the raw socket connections and the buffer parsing for the LLM.
  ```bash
  ./ai_chat_server
  ```
  
  -->Terminal 2: Start the Node.js Web Server
  This server hosts the web UI and communicates with the C++ backend.
  ```bash
  node server.js
  ```
  
  -->Terminal 3: Start ngrok
  To expose your local Node.js server to the internet, create a secure tunnel using ngrok. This command tells ngrok to create a tunnel for HTTP traffic on port 5000.
```bash
ngrok http 5000
```

** You can get your authentication Key from the website ```https://ngrok.com/```, and then activate ```ngrok config add-authtoken YOUR_AUTH_TOKEN_HERE```
