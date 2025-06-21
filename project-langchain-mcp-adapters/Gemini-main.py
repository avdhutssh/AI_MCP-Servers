import asyncio 
import os
from dotenv import load_dotenv  # Load environment variables from .env file
from langchain_mcp_adapters.tools import load_mcp_tools  # Key adapter: converts MCP tools into LangChain-compatible tools
from langchain_google_genai import ChatGoogleGenerativeAI  # Google Gemini integration for LangChain
from langgraph.prebuilt import create_react_agent  # Creates ReAct (Reasoning + Acting) agent that can use tools and reason step-by-step
from mcp import ClientSession, StdioServerParameters  # MCP core: ClientSession manages server connections, StdioServerParameters configures stdio-based servers
from mcp.client.stdio import stdio_client  # Client for communicating with MCP servers via stdin/stdout
from langchain_core.messages import HumanMessage

# Load environment variables from .env file (API keys)
load_dotenv()

# Create Gemini LLM instance - this is the "brain" that will use the tools
llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash")

# Configure MCP server parameters - tells client how to start the math server
stdio_server_params = StdioServerParameters(
    command="python",  # Use Python to run the server
    args=["servers/math_server.py"],  # Path to our math server script
)

async def main():
    # Step 1: Connect to MCP server using stdio_client
    # This starts the math_server.py as a subprocess and creates communication pipes
    async with stdio_client(stdio_server_params) as (read, write):
        
        # Step 2: Create a ClientSession to manage the MCP protocol
        # Raw read/write streams need to be wrapped in MCP protocol handling
        async with ClientSession(read_stream=read, write_stream=write) as session:
            
            # Step 3: Initialize the MCP session with handshake
            # This performs the MCP protocol handshake and exchanges capabilities
            await session.initialize()
            print("session initialized")
            
            # Step 4: Discover and load MCP tools from the server
            # This calls the server's list_tools() function and converts them to LangChain format
            tools = await load_mcp_tools(session)
            print("Processing request of type ListToolsRequest")
            
            # Step 5: Create ReAct agent with LLM and tools
            # The agent can now reason about problems and decide when to use tools
            agent = create_react_agent(llm, tools)
            
            # Step 6: Invoke the agent with a math question
            # The agent will use reasoning to break down the problem and use tools as needed
            result = await agent.ainvoke({"messages": [HumanMessage(content="What is 54 + 2 * 3?")]})
            print("Processing request of type CallToolRequest")
            print(result["messages"][-1].content)

if __name__ == "__main__":
    # Run the async main function
    asyncio.run(main())
