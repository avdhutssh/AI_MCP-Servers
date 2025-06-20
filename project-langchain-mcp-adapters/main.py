import asyncio 
import os
from dotenv import load_dotenv  # Load environment variables from .env file
from langchain_mcp_adapters.tools import load_mcp_tools  # Key adapter: converts MCP tools into LangChain-compatible tools
from langchain_google_genai import ChatGoogleGenerativeAI  # Google Gemini integration for LangChain
from langgraph.prebuilt import create_react_agent  # Creates ReAct (Reasoning + Acting) agent that can use tools and reason step-by-step
from mcp import ClientSession, StdioServerParameters  # MCP core: ClientSession manages server connections, StdioServerParameters configures stdio-based servers
from mcp.client.stdio import stdio_client  # Client for communicating with MCP servers via stdin/stdout
from langchain_core.messages import HumanMessage

load_dotenv()

# Try these Gemini 2.5 models (in order of preference):
llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash")

stdio_server_params = StdioServerParameters(
    command="python",
    args=["servers/math_server.py"],
)

async def main():
    async with stdio_client(stdio_server_params) as (read, write):
        async with ClientSession(read_stream=read, write_stream=write) as session:
            await session.initialize()
            print("session initialized")
            
            tools = await load_mcp_tools(session)
            print("Processing request of type ListToolsRequest")
            
            agent = create_react_agent(llm, tools)
            
            result = await agent.ainvoke({"messages": [HumanMessage(content="What is 54 + 2 * 3?")]})
            print("Processing request of type CallToolRequest")
            print(result["messages"][-1].content)

if __name__ == "__main__":
    asyncio.run(main())
