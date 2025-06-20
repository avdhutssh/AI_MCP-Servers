import asyncio 
import os
from dotenv import load_dotenv  # Load environment variables from .env file
from langchain_mcp_adapters.tools import load_mcp_tools  # Key adapter: converts MCP tools into LangChain-compatible tools
from langchain_openai import ChatOpenAI  # OpenAI's GPT models integration for LangChain
from langgraph.prebuilt import create_react_agent  # Creates ReAct (Reasoning + Acting) agent that can use tools and reason step-by-step
from mcp import ClientSession, StdioServerParameters  # MCP core: ClientSession manages server connections, StdioServerParameters configures stdio-based servers
from mcp.client.stdio import stdio_client  # Client for communicating with MCP servers via stdin/stdout

load_dotenv()
print(os.getenv("OPENAI_API_KEY"))
print(os.getenv("LANGCHAIN_API_KEY"))

stdio_server_params = StdioServerParameters(
    command="python",
    args=["/c/Users/Avdhut/Desktop/Learnings/GithubProjects/MCP-Servers/project-langchain-mcp-adapters/servers/math_server.py"],
)

async def main():
    print("Hello from project-langchain-mcp-adapters!")
    print(os.getenv("OPENAI_API_KEY"))

if __name__ == "__main__":
    asyncio.run(main())
