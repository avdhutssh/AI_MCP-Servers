#!/usr/bin/env python3
"""
A simple math MCP server that provides basic mathematical operations.
"""

import asyncio
from mcp.server import Server
from mcp.types import Tool, TextContent
from pydantic import BaseModel
import json

# Create the server instance
server = Server("math-server")

class AddInput(BaseModel):
    a: float
    b: float

class MultiplyInput(BaseModel):
    a: float
    b: float

class AddArgumentsInput(BaseModel):
    numbers: list[float]

class MultiplyArgumentsInput(BaseModel):
    numbers: list[float]

@server.list_tools()
async def list_tools() -> list[Tool]:
    """List available math tools."""
    return [
        Tool(
            name="add",
            description="Add two numbers",
            inputSchema={
                "type": "object",
                "properties": {
                    "a": {"type": "number", "description": "First number"},
                    "b": {"type": "number", "description": "Second number"}
                },
                "required": ["a", "b"]
            }
        ),
        Tool(
            name="multiply",
            description="Multiply two numbers",
            inputSchema={
                "type": "object",
                "properties": {
                    "a": {"type": "number", "description": "First number"},
                    "b": {"type": "number", "description": "Second number"}
                },
                "required": ["a", "b"]
            }
        ),
        Tool(
            name="addArguments",
            description="Add multiple numbers",
            inputSchema={
                "type": "object",
                "properties": {
                    "numbers": {
                        "type": "array",
                        "items": {"type": "number"},
                        "description": "List of numbers to add"
                    }
                },
                "required": ["numbers"]
            }
        ),
        Tool(
            name="multiplyArguments",
            description="Multiply multiple numbers",
            inputSchema={
                "type": "object",
                "properties": {
                    "numbers": {
                        "type": "array",
                        "items": {"type": "number"},
                        "description": "List of numbers to multiply"
                    }
                },
                "required": ["numbers"]
            }
        )
    ]

@server.call_tool()
async def call_tool(name: str, arguments: dict) -> list[TextContent]:
    """Handle tool calls."""
    try:
        if name == "add":
            data = AddInput(**arguments)
            result = data.a + data.b
            return [TextContent(type="text", text=f"{data.a} + {data.b} = {result}")]
        
        elif name == "multiply":
            data = MultiplyInput(**arguments)
            result = data.a * data.b
            return [TextContent(type="text", text=f"{data.a} * {data.b} = {result}")]
        
        elif name == "addArguments":
            data = AddArgumentsInput(**arguments)
            result = sum(data.numbers)
            numbers_str = " + ".join(str(n) for n in data.numbers)
            return [TextContent(type="text", text=f"{numbers_str} = {result}")]
        
        elif name == "multiplyArguments":
            data = MultiplyArgumentsInput(**arguments)
            result = 1
            for num in data.numbers:
                result *= num
            numbers_str = " * ".join(str(n) for n in data.numbers)
            return [TextContent(type="text", text=f"{numbers_str} = {result}")]
        
        else:
            raise ValueError(f"Unknown tool: {name}")
    
    except Exception as e:
        return [TextContent(type="text", text=f"Error: {str(e)}")]

async def main():
    """Run the server."""
    from mcp.server.stdio import stdio_server
    
    async with stdio_server() as (read_stream, write_stream):
        await server.run(
            read_stream,
            write_stream,
            server.create_initialization_options()
        )

if __name__ == "__main__":
    asyncio.run(main())