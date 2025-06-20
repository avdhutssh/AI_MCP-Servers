import asyncio 
import os
from dotenv import load_dotenv  # Load environment variables from .env file
from langchain_mcp_adapters.tools import load_mcp_tools  # Key adapter: converts MCP tools into LangChain-compatible tools
from langchain_openai import ChatOpenAI  # OpenAI's GPT models integration for LangChain
from langgraph.prebuilt import create_react_agent  # Creates ReAct (Reasoning + Acting) agent that can use tools and reason step-by-step
from mcp import ClientSession, StdioServerParameters  # MCP core: ClientSession manages server connections, StdioServerParameters configures stdio-based servers
from mcp.client.stdio import stdio_client  # Client for communicating with MCP servers via stdin/stdout
from langchain_core.messages import HumanMessage

load_dotenv()
print(os.getenv("OPENAI_API_KEY"))
print(os.getenv("LANGCHAIN_API_KEY"))

llm = ChatOpenAI()

stdio_server_params = StdioServerParameters(
    command="python",
    args=["servers/math_server.py"],
)

async def main():
    # Step 1: Connect to MCP server using stdio_client
    async with stdio_client(stdio_server_params) as (read, write):
        # Step 2: Create a ClientSession to manage the connection
        async with ClientSession(read_stream=read, write_stream=write) as session:
            # Step 3: Initialize the session with the MCP server
            await session.initialize()
            print("session initialized")
            
            # Step 4: Load MCP tools and convert them to LangChain tools
            tools = await load_mcp_tools(session)
            print(tools)
            
            agent = create_react_agent(llm,tools)

            result = await agent.ainvoke({"messages": [HumanMessage(content="What is 54 + 2 * 3?")]})
            print(result["messages"][-1].content)

if __name__ == "__main__":
    asyncio.run(main())
