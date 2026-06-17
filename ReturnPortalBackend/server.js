const express = require("express");
const cors = require("cors");
const ExcelJS = require("exceljs");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

const filePath = path.join(__dirname, "..", "return_orders.xlsx");

function generateReturnID() {
  return "R" + Date.now();
}

app.post("/submit-return", async (req, res) => {
  try {
    const {
        email,
        phoneNumber,
        customerID,
        orderID,
        productID,
        returnReason,
        pickupAddress,
    } = req.body;

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);

    const worksheet = workbook.getWorksheet("Sheet1");

    const returnID = generateReturnID();
    const returnDate = new Date().toISOString();
    const status = "Pending";

    const nextRow = worksheet.lastRow.number + 1;

    worksheet.getCell(`A${nextRow}`).value = returnID;
    worksheet.getCell(`B${nextRow}`).value = customerID || "";
    worksheet.getCell(`C${nextRow}`).value = orderID || "";
    worksheet.getCell(`D${nextRow}`).value = productID || "";
    worksheet.getCell(`E${nextRow}`).value = returnReason || "";
    worksheet.getCell(`F${nextRow}`).value = returnDate;
    worksheet.getCell(`G${nextRow}`).value = pickupAddress || "";
    worksheet.getCell(`H${nextRow}`).value = email || "";
    worksheet.getCell(`I${nextRow}`).value = phoneNumber || "";
    worksheet.getCell(`J${nextRow}`).value = status;

    console.log("Writing to row:", nextRow);

    await workbook.xlsx.writeFile(filePath);
    console.log("Saved successfully");

    res.status(200).json({
      success: true,
      returnID,
      message: "Row added to Excel file successfully."
    });
  } catch (error) {
    console.error("Error writing to Excel:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

app.listen(3001, () => {
  console.log("Return API running on port 3001");
});