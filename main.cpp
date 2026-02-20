// main.cpp
#include <iostream>
#include "ServerClass/TCP_server.h"  
#include "LLM_Manager/LLM_Manager.h" 

int main() {
    // 1. Initialize the Brain with Google's Gemma 2B model
    LLMManager aiBrain("gemma:2b");

    // 2. Initialize the Server object
    TCPServer server(8080);

    std::cout << "\n=== AI TCP SERVER LAUNCHING ===+" << std::endl;
    std::cout << "Model: gemma:2b" << std::endl;
    std::cout << "Connect via: nc -6 ::1 8080 (or telnet localhost 8080)" << std::endl;
    std::cout << "================================\n" << std::endl;

    server.run(aiBrain); 
    
    return 0;
}