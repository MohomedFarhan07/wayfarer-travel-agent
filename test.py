import asyncio
from mcp_client_test import tavily_mcp_search
from mcp_client import initialize_aviation_tools

if __name__ == "__main__":
    query = 'Latest news about AI layoffs'
    asyncio.run(initialize_aviation_tools())

