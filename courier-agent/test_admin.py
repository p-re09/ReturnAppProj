import os
import asyncio
from azure.servicebus.management import ServiceBusAdministrationClient
from azure.servicebus.exceptions import ServiceBusAuthenticationError

def main():
    conn_str  = os.environ["SERVICE_BUS_CONNECTION_STRING"]
    queue_name     = os.environ["SERVICE_BUS_QUEUE"]
    admin_client = ServiceBusAdministrationClient.from_connection_string(conn_str)

    try:
        with admin_client:
            props = admin_client.get_queue_runtime_properties(queue_name)
            print(f"✅ Auth succeeded! Queue '{queue_name}' has {props.active_message_count} active messages.")
    except ServiceBusAuthenticationError as auth_err:
        print("❌ Authentication failed:", auth_err)

if __name__ == "__main__":
    # set these env vars before you run:
    #   SERVICE_BUS_CONNECTION_STRING and SERVICE_BUS_QUEUE
    main()
