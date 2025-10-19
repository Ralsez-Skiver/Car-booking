import requests

url = "http://localhost:8080/ors/v2/matrix/driving-car"

data = {
    "locations": [
        [8.681495, 49.41461],
        [8.687872, 49.420718],
        [8.693956, 49.415776],
        [8.687372, 49.425318],
        [8.699756, 49.414776],
        [8.687772, 49.423318],
        [8.690756, 49.415776]
    ],
    "metrics": ["distance", "duration"],
    "units": "min"
}

response = requests.post(url, json=data)
print(response.json())
