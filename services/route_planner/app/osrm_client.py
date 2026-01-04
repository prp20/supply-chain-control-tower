import requests

OSRM_BASE_URL = "http://router.project-osrm.org"

def get_route(start_lat, start_lon, end_lat, end_lon):
    url = (
        f"{OSRM_BASE_URL}/route/v1/driving/"
        f"{start_lon},{start_lat};{end_lon},{end_lat}"
        "?overview=full&geometries=geojson"
    )

    response = requests.get(url, timeout=5)
    response.raise_for_status()

    data = response.json()
    route = data["routes"][0]

    return {
        "distance_km": route["distance"] / 1000,
        "duration_minutes": route["duration"] / 60,
        "geometry": route["geometry"]
    }
