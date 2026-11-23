from tools.tavily_tool import tavily_search
from tools.flight_tool import search_flights
from rich import print
from backend import run_travel_agent



# res = tavily_search("Best hotels in India")

# res = search_flights("Plan a 7 days Japan trip from Bangladesh")

res = run_travel_agent("Plan a complete 7 days India trip from Bangladesh including flights, hotels, and sightseeing under 2 lakhs.")

print(res)