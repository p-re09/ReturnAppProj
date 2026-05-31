using System;
using Azure;                   // for ETag
using Azure.Data.Tables;       // for ITableEntit

namespace ReturnAppProj.Models
{
    /// <summary>
    /// Represents a return request entity for Azure Table Storage.
    /// </summary>
    /*public record ReturnRequest(
        string PartitionKey,     // <-- Added
        string RowKey,
        string ReturnReason,
        string OrderId,
        string ProductId,
        string PickupAddress,
        string Email,
        string PhoneNumber,
        string ReturnID,
        string Status,
        DateTime ReturnDate DateTimeOffset 
    );*/
    public class ReturnRequest : ITableEntity
    {
        public string PartitionKey { get; set; }
        public string RowKey       { get; set; }
        public DateTimeOffset? Timestamp { get; set; }
        public ETag ETag           { get; set; }

        public string ReturnReason   { get; set; }
        public string OrderId        { get; set; }
        public string ProductId      { get; set; }
        public string PickupAddress  { get; set; }
        public string Email          { get; set; }
        public string PhoneNumber    { get; set; }
        public string ReturnID       { get; set; }
        public string Status         { get; set; }
        public string AI_Decision         { get; set; }
        public double AI_Confidence         { get; set; }
        public string AI_Reason         { get; set; }
        public DateTimeOffset ReturnDate   { get; set; }

        public ReturnRequest() { }
        public ReturnRequest(string partitionKey, string rowKey)
        {
            PartitionKey = partitionKey;
            RowKey = rowKey;
        }
    }
    /*var entity = new TableEntity(request.PartitionKey, request.RowKey)
    {
    ["ReturnReason"]  = request.ReturnReason,
    ["OrderId"]       = request.OrderId,
    ["ProductId"]     = request.ProductId,
    ["PickupAddress"] = request.PickupAddress,
    ["Email"]         = request.Email,
    ["PhoneNumber"]   = request.PhoneNumber,
    ["ReturnID"]      = request.ReturnID,
    ["Status"]       = request.Status,
    ["ReturnDate"]    = request.ReturnDate
    };
    await _tableClient.UpsertEntityAsync(entity, TableUpdateMode.Merge);*/
}
