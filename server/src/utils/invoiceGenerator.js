import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Generates a PDF invoice for an order and saves it locally
 * @param {Object} order - Mongoose Order document
 * @returns {Promise<string>} - Relative URL path of the generated invoice
 */
export const generateInvoice = async (order) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ 
        size: 'LETTER',
        margin: 50 
      });
      const filename = `invoice_${order.orderNumber}.pdf`;
      const invoicesDir = path.join(__dirname, '..', '..', 'public', 'invoices');
      
      // Ensure local directories exist
      if (!fs.existsSync(invoicesDir)) {
        fs.mkdirSync(invoicesDir, { recursive: true });
      }
      
      const filePath = path.join(invoicesDir, filename);
      const stream = fs.createWriteStream(filePath);
      
      doc.pipe(stream);
      
      // 1. Brand Top Accent Bar
      doc.rect(0, 0, 612, 4).fill('#1F3D2B');
      
      // Reset fill for drawing text
      doc.fillColor('#1E293B');
      
      // 2. Header Block
      // Brand Logo (Left)
      doc.font('Helvetica-Bold').fontSize(24).fillColor('#1F3D2B').text('VESTRA', 50, 50);
      doc.font('Helvetica').fontSize(8.5).fillColor('#64748B').text('Premium Apparel Label', 50, 76);
      
      // Document Metadata (Right)
      doc.font('Helvetica-Bold').fontSize(18).fillColor('#1E293B').text('INVOICE', 350, 50, { align: 'right', width: 212 });
      
      const dateStr = new Date(order.createdAt).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      doc.font('Helvetica').fontSize(9).fillColor('#475569')
         .text(`Invoice No: INV-${order.orderNumber}`, 350, 74, { align: 'right', width: 212 })
         .text(`Date: ${dateStr}`, 350, 88, { align: 'right', width: 212 })
         .text(`Payment: ${order.payment.method.toUpperCase()} (${order.payment.status.toUpperCase()})`, 350, 102, { align: 'right', width: 212 });
      
      // 3. Divider
      doc.moveTo(50, 125).lineTo(562, 125).strokeColor('#E2E8F0').lineWidth(0.75).stroke();
      
      // 4. Billing & Order Info (Columns side-by-side)
      const detailsY = 145;
      
      // Left Column: Deliver To
      doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#94A3B8').text('DELIVER TO', 50, detailsY);
      doc.font('Helvetica-Bold').fontSize(10.5).fillColor('#1E293B').text(order.shippingAddress.fullName, 50, detailsY + 15);
      
      let addressLine = order.shippingAddress.addressLine1;
      if (order.shippingAddress.addressLine2) {
        addressLine += `, ${order.shippingAddress.addressLine2}`;
      }
      const addressDetails = `${addressLine}\n${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.pincode}\n${order.shippingAddress.country}\nPhone: ${order.shippingAddress.phone}`;
      doc.font('Helvetica').fontSize(9).fillColor('#475569').text(addressDetails, 50, detailsY + 30, { lineGap: 3.5 });
      
      // Right Column: Order details
      doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#94A3B8').text('ORDER SUMMARY', 350, detailsY);
      doc.font('Helvetica-Bold').fontSize(10.5).fillColor('#1E293B').text(`Order Ref: #${order.orderNumber}`, 350, detailsY + 15);
      
      const orderDetails = `Status: ${order.status.toUpperCase()}\nPayment Method: ${order.payment.method.toUpperCase()}\nPayment Status: ${order.payment.status.toUpperCase()}`;
      doc.font('Helvetica').fontSize(9).fillColor('#475569').text(orderDetails, 350, detailsY + 30, { lineGap: 3.5 });
      
      // 5. Items Table Section
      const tableTop = 265;
      
      // Table Header Row Background
      doc.rect(50, tableTop, 512, 22).fill('#F8FAFC');
      
      // Header Labels
      doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#475569');
      doc.text('Description', 60, tableTop + 7)
         .text('Color', 240, tableTop + 7)
         .text('Size', 300, tableTop + 7)
         .text('Price', 360, tableTop + 7)
         .text('Qty', 420, tableTop + 7)
         .text('Amount', 480, tableTop + 7, { align: 'right', width: 72 });
         
      // Table Rows
      let itemY = tableTop + 22;
      doc.font('Helvetica').fontSize(9);
      
      order.items.forEach((item, index) => {
        // Draw bottom border for previous item / header
        doc.moveTo(50, itemY).lineTo(562, itemY).strokeColor('#F1F5F9').lineWidth(0.5).stroke();
        
        doc.font('Helvetica-Bold').fillColor('#1E293B').text(item.name, 60, itemY + 8);
        doc.font('Helvetica').fillColor('#475569')
           .text(item.color || '-', 240, itemY + 8)
           .text(item.size || '-', 300, itemY + 8)
           .text(`Rs. ${item.price.toFixed(2)}`, 360, itemY + 8)
           .text(item.quantity.toString(), 420, itemY + 8)
           .text(`Rs. ${(item.price * item.quantity).toFixed(2)}`, 480, itemY + 8, { align: 'right', width: 72 });
           
        itemY += 26; // row height
      });
      
      // Table end line
      doc.moveTo(50, itemY).lineTo(562, itemY).strokeColor('#E2E8F0').lineWidth(0.75).stroke();
      
      // 6. Totals Panel
      let totalY = itemY + 15;
      
      const writeTotalRow = (label, value, y, isBold = false, isFinal = false) => {
        if (isBold) {
          doc.font('Helvetica-Bold').fillColor('#1E293B').fontSize(9);
        } else {
          doc.font('Helvetica').fillColor('#475569').fontSize(8.5);
        }
        
        if (isFinal) {
          doc.fillColor('#1F3D2B').fontSize(11);
        }
        
        doc.text(label, 360, y);
        doc.text(value, 480, y, { align: 'right', width: 72 });
      };
      
      writeTotalRow('Subtotal:', `Rs. ${order.pricing.subtotal.toFixed(2)}`, totalY);
      totalY += 16;
      writeTotalRow('Discount:', `-Rs. ${order.pricing.discount.toFixed(2)}`, totalY);
      totalY += 16;
      writeTotalRow('Shipping:', `Rs. ${order.pricing.shipping.toFixed(2)}`, totalY);
      totalY += 16;
      writeTotalRow(`GST (${order.pricing.tax > 0 ? '12%' : '0%'}):`, `Rs. ${order.pricing.tax.toFixed(2)}`, totalY);
      totalY += 20;
      
      // Double line for grand total
      doc.moveTo(360, totalY).lineTo(562, totalY).strokeColor('#1F3D2B').lineWidth(1.25).stroke();
      totalY += 8;
      
      writeTotalRow('Grand Total:', `Rs. ${order.pricing.total.toFixed(2)}`, totalY, true, true);
      
      // 7. Footer / Terms
      const footerY = doc.page.height - 75;
      doc.moveTo(50, footerY - 15).lineTo(562, footerY - 15).strokeColor('#E2E8F0').lineWidth(0.5).stroke();
      doc.font('Helvetica-Oblique').fontSize(8).fillColor('#94A3B8')
         .text('This is a computer-generated invoice. Thank you for shopping with VESTRA.', 50, footerY, { align: 'center', width: 512 });
      
      doc.end();
      
      stream.on('finish', () => {
        resolve(`/invoices/${filename}`);
      });
      
      stream.on('error', (err) => {
        reject(err);
      });
    } catch (error) {
      reject(error);
    }
  });
};
