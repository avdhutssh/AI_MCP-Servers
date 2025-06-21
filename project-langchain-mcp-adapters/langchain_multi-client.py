import asyncio

from dotenv import load_dotenv
from langchain_mcp_adapters.client import MultiServerMCPClient
from langchain_google_genai import ChatGoogleGenerativeAI
from langgraph.prebuilt import create_react_agent
from langchain_core.messages import HumanMessage

load_dotenv()

llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash")


async def main():
    client = MultiServerMCPClient(
        {
            "math": {
                "command": "python",
                "args": ["servers/math_server.py"],
                "transport": "stdio"
            },
            "weather": {
                "url": "http://localhost:8000/sse",
                "transport": "sse",
            },
        }
    )
    
    tools = await client.get_tools()
    agent = create_react_agent(llm, tools)
    
    # result = await agent.ainvoke({
    #     "messages": [HumanMessage(content="What is 54 + 2 * 3?")]
    # })
    result = await agent.ainvoke(
        {"messages": "What is the weather in San Francisco?"}
    )
    print(result["messages"][-1].content)


if __name__ == "__main__":
    asyncio.run(main())
