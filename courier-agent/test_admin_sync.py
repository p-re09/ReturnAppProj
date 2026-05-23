import os
from azure.servicebus import ServiceBusClient

conn_str  = os.environ["SERVICE_BUS_CONNECTION_STRING"]
queue     = os.environ["SERVICE_BUS_QUEUE"]

print(conn_str)
print(queue)

client = ServiceBusClient.from_connection_string(conn_str)
with client:
    receiver = client.get_queue_receiver(queue_name=queue, max_wait_time=5)
    with receiver:
        for msg in receiver:
            print("Received:", str(msg))
            receiver.complete_message(msg)
            break  # only process one message
