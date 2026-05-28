import os, csv, time, json, logging
from datetime import datetime
from pathlib import Path
from dotenv import load_dotenv
from azure.servicebus import ServiceBusClient, ServiceBusMessage
from azure.data.tables import TableServiceClient
from azure.maps.search import MapsSearchClient
from azure.maps.route import MapsRouteClient
from azure.core.credentials import AzureKeyCredential
from azure.servicebus.exceptions import ServiceBusError
from azure.maps.route.models import RouteMatrixQuery, GeoJsonMultiPoint

# logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).parent
READY_FILE = BASE_DIR / "agent_ready.txt"
STOP_FILE  = BASE_DIR / "agent_stop.txt"

# config
env_path = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=env_path)

print("ENV FILE EXISTS:", env_path.exists())
print("ENV PATH:", env_path)
print("SB:", os.getenv("SERVICE_BUS_CONNECTION_STRING"))

SB_CONN_STR    = os.getenv("SERVICE_BUS_CONNECTION_STRING")
SB_QUEUE       = os.getenv("SERVICE_BUS_QUEUE")
STORAGE_CONN   = os.getenv("AZURE_STORAGE_CONNECTION_STRING")
TABLE_NAME     = os.getenv("AZURE_TABLE_NAME")
MAPS_KEY       = os.getenv("AZURE_MAPS_KEY")
SPEED_FACTOR   = 60

if not SB_CONN_STR:
    raise RuntimeError("SERVICE_BUS_CONNECTION_STRING missing")

if not MAPS_KEY:
    raise RuntimeError("AZURE_MAPS_KEY missing")

with open("agent_ready.txt", "w") as f:
    f.write("READY")

def geocode(address, search_client):
    address = address.replace("Post Office,", "").strip()

    if "UK" not in address and "United Kingdom" not in address:
        address += ", UK"

    res = search_client.search_address(query=address)
    if not res.results:
        raise RuntimeError(f"Geocode failed for '{address}'")
    pos = res.results[0].position
    # pos.latitude / pos.longitude properties
    coords = [pos.lon, pos.lat]

    print(f"Geocoded '{address}' -> {coords}")

    return coords

def get_eta(origin_coord, dest_coord, route_client):

    query = RouteMatrixQuery(
        origins=GeoJsonMultiPoint(coordinates=[origin_coord]),
        destinations=GeoJsonMultiPoint(coordinates=[dest_coord])
    )

    res = route_client.get_route_matrix(query=query)

    matrix_cell = res.matrix[0][0]

    if matrix_cell.status_code != 200:
        raise RuntimeError(
            f"Route error: {matrix_cell.response}"
        )

    return matrix_cell.response.summary.travel_time_in_seconds

def load_factories():
    factories = []

    with open("factories.csv", newline='', encoding='utf-8') as csvfile:
        reader = csv.DictReader(csvfile)

        for row in reader:
            if row["Active"].lower() == "true":

                factories.append({
                    "FactoryID": row["FactoryID"],
                    "FactoryName": row["FactoryName"],
                    "FactoryAddress": row["FactoryAddress"],
                    "Latitude": float(row["Latitude"]),
                    "Longitude": float(row["Longitude"])
                })

    print(factories)
    
    return factories

def find_closest_factory(origin_coord, factories, route_client):

    closest_factory = None
    shortest_eta = None

    for factory in factories:

        factory_coord = [
            factory["Longitude"],
            factory["Latitude"]
        ]

        print("Origin:", origin_coord)
        print("Factory:", factory["FactoryName"])
        print("Destination:", factory_coord)

        eta = get_eta(origin_coord, factory_coord, route_client)

        print(f"Factory {factory['FactoryName']} ETA: {eta}s")

        if shortest_eta is None or eta < shortest_eta:
            shortest_eta = eta
            closest_factory = factory

    return closest_factory, shortest_eta

def process_message(msg_body, search_client, route_client, table_client):
    req = json.loads(msg_body)

    # 1) Geocode customer pickup address
    origin = geocode(req["PickupAddress"], search_client)

    # 2) Load factories
    factories = load_factories()

    # 3) Find closest factory
    closest_factory, eta_out = find_closest_factory(
        origin,
        factories,
        route_client
    )

    destination = [
        closest_factory["Longitude"],
        closest_factory["Latitude"]
    ]

    print(f"Assigned factory: {closest_factory['FactoryName']}")

    # 2) outbound
    eta_out = get_eta(origin, destination, route_client)
    print(f"[{datetime.utcnow()}] Outbound ETA {eta_out}s → {eta_out/SPEED_FACTOR:.2f}s")
    time.sleep(eta_out/SPEED_FACTOR)

    req["FactoryID"] = closest_factory["FactoryID"]
    req["FactoryName"] = closest_factory["FactoryName"]
    req["FactoryAddress"] = closest_factory["FactoryAddress"]
    req["Status"] = "InProgress"

    table_client.upsert_entity(req)

    # 4) return
    eta_back = get_eta(destination, origin, route_client)
    print(f"[{datetime.utcnow()}] Return ETA {eta_back}s → {eta_back/SPEED_FACTOR:.2f}s")
    time.sleep(eta_back/SPEED_FACTOR)

    # 5) finalize
    req["Status"]      = "Completed"
    req["ReturnDate"]  = datetime.utcnow().isoformat()
    req["TotalTime"]   = eta_out + eta_back
    table_client.upsert_entity(req)

def main():
    # clients
    sb_client     = ServiceBusClient.from_connection_string(SB_CONN_STR)
    search_client = MapsSearchClient(credential=AzureKeyCredential(MAPS_KEY))
    route_client  = MapsRouteClient(credential=AzureKeyCredential(MAPS_KEY))
    table_service = TableServiceClient.from_connection_string(STORAGE_CONN)
    table_client  = table_service.get_table_client(TABLE_NAME)

    try:
        with sb_client:
            receiver = sb_client.get_queue_receiver(queue_name=SB_QUEUE, max_wait_time=10)
            with receiver:
                while True:
                    if STOP_FILE.exists():
                        logger.info("Stop signal received. Shutting down.")
                        break

                    try:
                        msgs = receiver.receive_messages(max_message_count=1)
                    except ServiceBusError as e:
                        logger.error("SB receive error, retrying in 5s: %s", e)
                        time.sleep(5)
                        continue

                    if not msgs:
                        time.sleep(5)
                        continue

                    for msg in msgs:
                        try:
                            process_message(str(msg), search_client, route_client, table_client)
                            receiver.complete_message(msg)
                            print(f"[{datetime.utcnow()}] Completed {msg.message_id}")
                        except Exception as ex:
                            logger.error("Processing failed: %s", ex)
                            receiver.abandon_message(msg)
    finally:
        if READY_FILE.exists():
            READY_FILE.unlink()
        if STOP_FILE.exists():
            STOP_FILE.unlink()

if __name__ == "__main__":
    main()
