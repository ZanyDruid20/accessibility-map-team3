from fastapi import FastAPI
from pydantic import BaseModel
import uvicorn
# Made a model for the class
class LocationData(BaseModel):
    # latitude value is float
    latitude: float
    longitude: float

app = FastAPI()

@app.get("/")
def read_root():
    return{"message": "Realtime Location"}

@app.post("/update-location/")
async def update_user_location(location: LocationData):
    print(f"Recieved Location: lat = {location.latitude}, lon = {location.longitude}")
    return {"status": "success", "received_latitude": location.latitude, "received_longitude": location.longitude}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
