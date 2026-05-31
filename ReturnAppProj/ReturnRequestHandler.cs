using System;
using System.Net;
using System.Threading.Tasks;
using Azure;
using Azure.Data.Tables;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.Extensions.Logging;
using ReturnAppProj.Models;
using Azure.Messaging.ServiceBus;
using System.Text.Json;

namespace ReturnAppProj
{
    public class ReturnRequestHandler
    {
        private readonly string _serviceBusConnectionString;
        private readonly string _queueName;

        private readonly ILogger<ReturnRequestHandler> _logger;
        private readonly TableClient _tableClient;

        public ReturnRequestHandler(ILogger<ReturnRequestHandler> logger)
        {
            _logger = logger;
            // Initialize the TableClient using the connection from environment
            string connString = Environment.GetEnvironmentVariable("AzureWebJobsStorage");
            _tableClient = new TableClient(connString, "ReturnRequests");
            _tableClient.CreateIfNotExists();
            _serviceBusConnectionString = Environment.GetEnvironmentVariable("SERVICE_BUS_CONNECTION_STRING");
            _queueName = Environment.GetEnvironmentVariable("SERVICE_BUS_QUEUE");
        }

        [Function("Health")]
        public async Task<HttpResponseData> Health(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "health")] HttpRequestData req)
        {
            var response = req.CreateResponse(HttpStatusCode.OK);
            await response.WriteStringAsync("OK");
            return response;
        }

        [Function("ReturnRequestHandler")]
        public async Task<HttpResponseData> Run(
            [HttpTrigger(AuthorizationLevel.Function, "get", "post")] HttpRequestData req,
            FunctionContext executionContext)
        {
            var logger = executionContext.GetLogger("ReturnRequestHandler");
            logger.LogInformation("C# HTTP trigger function processed a request.");

            if (req.Method == HttpMethod.Get.Method)
            {
                var response = req.CreateResponse(HttpStatusCode.OK);
                await response.WriteStringAsync("ReturnRequestHandler is up and running.");
                return response;
            }
            else if (req.Method == HttpMethod.Post.Method)
            {
                var data = await req.ReadFromJsonAsync<ReturnRequest>();

                if (data == null)
                {
                    var badResponse = req.CreateResponse(HttpStatusCode.BadRequest);
                    await badResponse.WriteStringAsync("Invalid JSON.");
                    return badResponse;
                }

                // Save request to Azure Table
                await _tableClient.UpsertEntityAsync(data);
                _logger.LogInformation("Saved request to table storage.");

                // Only approved requests go to the courier agent
                if (string.Equals(data.Status, "Approved", StringComparison.OrdinalIgnoreCase))
                {
                    string jsonMessage = JsonSerializer.Serialize(data);

                    await using var client = new ServiceBusClient(_serviceBusConnectionString);
                    ServiceBusSender sender = client.CreateSender(_queueName);

                    await sender.SendMessageAsync(new ServiceBusMessage(jsonMessage));
                    _logger.LogInformation("Message sent to Service Bus queue.");
                }
                else
                {
                    _logger.LogInformation("Request status was {Status}; not sending to Service Bus.", data.Status);
                }

                var response = req.CreateResponse(HttpStatusCode.OK);
                await response.WriteStringAsync("Return request recorded.");
                return response;
            }
            /*else if (data == null)
            {
                var badResponse = req.CreateResponse(HttpStatusCode.BadRequest);
                await badResponse.WriteStringAsync("Invalid JSON.");
                return badResponse;
            }*/
            else 
            {
                var response = req.CreateResponse(HttpStatusCode.MethodNotAllowed);
                await response.WriteStringAsync("Method not allowed.");
                return response;
            }
        }
    }
}
