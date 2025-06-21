import asyncio
import os
from dotenv import load_dotenv
from langchain_mcp_adapters.tools import load_mcp_tools
from langchain_google_genai import ChatGoogleGenerativeAI
from langgraph.prebuilt import create_react_agent


load_dotenv()

llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash")


async def main():
    client = MultiServerMCPClient(
        {
            "math": {
                "command": "python",
                "args": ["servers/math_server.py"],
            },
            "weather": {
                "url": "http://localhost:8000/sse",
                "transport": "sse",
            },
        }
    )


if __name__ == "__main__":
    asyncio.run(main())
