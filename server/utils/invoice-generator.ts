import type { Invoice, UserPurchase, TestSeries, User } from "@shared/schema";

export interface InvoiceData {
  invoice: Invoice;
  purchase: UserPurchase;
  testSeries: TestSeries;
  user: User;
}

export function generateInvoiceHTML(data: InvoiceData): string {
  const { invoice, purchase, testSeries, user } = data;
  
  const gstRate = 18;
  const subtotal = parseFloat(invoice.subtotal);
  const gstAmount = parseFloat(invoice.gstAmount);
  const total = parseFloat(invoice.totalAmount);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; }
    .header { text-align: center; margin-bottom: 30px; }
    .company-name { font-size: 24px; font-weight: bold; color: #4F46E5; }
    .invoice-title { font-size: 20px; margin-top: 10px; }
    .invoice-details { margin: 20px 0; }
    .section { margin: 20px 0; }
    .section-title { font-weight: bold; margin-bottom: 10px; border-bottom: 2px solid #4F46E5; padding-bottom: 5px; }
    table { width: 100%; border-collapse: collapse; margin: 10px 0; }
    th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background-color: #f5f5f5; font-weight: bold; }
    .total-row { font-weight: bold; background-color: #f9f9f9; }
    .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; }
    .info-row { display: flex; justify-content: space-between; margin: 5px 0; }
  </style>
</head>
<body>
  <div class="header">
    <div class="company-name">GATE And Tech</div>
    <div class="invoice-title">TAX INVOICE</div>
  </div>

  <div class="invoice-details">
    <div class="info-row">
      <span><strong>Invoice Number:</strong> ${invoice.invoiceNumber}</span>
      <span><strong>Date:</strong> ${new Date(invoice.createdAt).toLocaleDateString('en-IN')}</span>
    </div>
    ${invoice.gstNumber ? `<div class="info-row"><span><strong>GSTIN:</strong> ${invoice.gstNumber}</span></div>` : ''}
  </div>

  <div class="section">
    <div class="section-title">Bill To</div>
    <div><strong>${user.name}</strong></div>
    <div>${user.email}</div>
  </div>

  <div class="section">
    <div class="section-title">Items</div>
    <table>
      <thead>
        <tr>
          <th>Description</th>
          <th>Validity</th>
          <th style="text-align: right;">Amount (₹)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>${testSeries.title}</td>
          <td>${testSeries.validityDays} days</td>
          <td style="text-align: right;">${subtotal.toFixed(2)}</td>
        </tr>
        <tr>
          <td colspan="2" style="text-align: right;"><strong>Subtotal:</strong></td>
          <td style="text-align: right;">₹${subtotal.toFixed(2)}</td>
        </tr>
        <tr>
          <td colspan="2" style="text-align: right;"><strong>GST (${gstRate}%):</strong></td>
          <td style="text-align: right;">₹${gstAmount.toFixed(2)}</td>
        </tr>
        <tr class="total-row">
          <td colspan="2" style="text-align: right;"><strong>Total Amount:</strong></td>
          <td style="text-align: right;"><strong>₹${total.toFixed(2)}</strong></td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="footer">
    <p>Thank you for your purchase!</p>
    <p>This is a computer-generated invoice and does not require a signature.</p>
    <p>For any queries, please contact support@gateandtech.com</p>
  </div>
</body>
</html>
  `;
}

export function calculateInvoiceAmounts(price: number, discountAmount: number = 0): {
  subtotal: string;
  gstAmount: string;
  totalAmount: string;
} {
  const GST_RATE = 0.18;
  
  const subtotal = price - discountAmount;
  const gstAmount = subtotal * GST_RATE;
  const totalAmount = subtotal + gstAmount;

  return {
    subtotal: subtotal.toFixed(2),
    gstAmount: gstAmount.toFixed(2),
    totalAmount: totalAmount.toFixed(2),
  };
}
