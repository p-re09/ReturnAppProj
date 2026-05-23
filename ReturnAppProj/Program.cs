using Microsoft.Extensions.Hosting;
using Microsoft.Azure.Functions.Worker.Configuration;

var host = new HostBuilder()
    .ConfigureFunctionsWorkerDefaults()  // wires up your HTTP, Timer, Storage, etc.
    .Build();

host.Run();

