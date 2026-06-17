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
      const doc = new PDFDocument({ margin: 50 });
      const filename = `invoice_${order.orderNumber}.pdf`;
      const invoicesDir = path.join(__dirname, '..', '..', 'public', 'invoices');
      
      // Ensure local directories exist
      if (!fs.existsSync(invoicesDir)) {
        fs.mkdirSync(invoicesDir, { recursive: true });
      }
      
      const filePath = path.join(invoicesDir, filename);
      const stream = fs.createWriteStream(filePath);
      
      doc.pipe(stream);
      
      // Brand Name Banner
      doc.fillColor('#1F3D2B').font('Helvetica-Bold').fontSize(26).text('VESTRA', 50, 50);
      doc.fillColor('#14110F').font('Helvetica').fontSize(10).text('Premium Apparel Label', 50, 80);
      
      // Document Metadata
      doc.fillColor('#14110F').font('Helvetica-Bold').fontSize(18).text('INVOICE', 350, 50, { align: 'right' });
      doc.font('Helvetica').fontSize(10)
         .text(`Invoice No: INV-${order.orderNumber}`, 350, 75, { align: 'right' })
         .text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, 350, 90, { align: 'right' })
         .text(`Payment: ${order.payment.method} (${order.payment.status})`, 350, 105, { align: 'right' });
      
      doc.moveDown(4);
      
      // Bill/Ship to details
      const startY = doc.y;
      doc.font('Helvetica-Bold').fontSize(11).text('DELIVER TO:', 50, startY);
      doc.font('Helvetica').fontSize(10)
         .text(order.shippingAddress.fullName, 50, startY + 15)
         .text(order.shippingAddress.addressLine1, 50, startY + 30)
         .text(order.shippingAddress.addressLine2 || '', 50, startY + 45)
         .text(`${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.pincode}`, 50, startY + 60)
         .text(order.shippingAddress.country, 50, startY + 75)
         .text(`Phone: ${order.shippingAddress.phone}`, 50, startY + 90);
         
      doc.moveDown(6);
      
      let itemY = doc.y + 10;
      // Drawing line divider
      doc.lineCap('butt').moveTo(50, itemY).lineTo(550, itemY).strokeColor('#E4E1D8').lineWidth(1).stroke();
      
      itemY += 10;
      doc.font('Helvetica-Bold').fontSize(9).fillColor('#14110F')
         .text('Description', 50, itemY)
         .text('Color', 220, itemY)
         .text('Size', 280, itemY)
         .text('Price', 340, itemY)
         .text('Qty', 400, itemY)
         .text('Amount', 460, itemY, { align: 'right', width: 90 });
         
      itemY += 15;
      doc.moveTo(50, itemY).lineTo(550, itemY).strokeColor('#E4E1D8').stroke();
      
      // Loop over items
      doc.font('Helvetica').fontSize(9);
      order.items.forEach(item => {
        itemY += 15;
        doc.text(item.name, 50, itemY)
           .text(item.color, 220, itemY)
           .text(item.size, 280, itemY)
           .text(`₹${item.price.toFixed(2)}`, 340, itemY)
           .text(item.quantity.toString(), 400, itemY)
           .text(`₹${(item.price * item.quantity).toFixed(2)}`, 460, itemY, { align: 'right', width: 90 });
      });
      
      itemY += 25;
      doc.moveTo(50, itemY).lineTo(550, itemY).strokeColor('#E4E1D8').stroke();
      
      // Totals Panel
      itemY += 15;
      doc.font('Helvetica').text('Subtotal:', 340, itemY).text(`₹${order.pricing.subtotal.toFixed(2)}`, 460, itemY, { align: 'right', width: 90 });
      itemY += 15;
      doc.text('Discount:', 340, itemY).text(`-₹${order.pricing.discount.toFixed(2)}`, 460, itemY, { align: 'right', width: 90 });
      itemY += 15;
      doc.text('Shipping:', 340, itemY).text(`₹${order.pricing.shipping.toFixed(2)}`, 460, itemY, { align: 'right', width: 90 });
      itemY += 15;
      doc.text(`GST (${order.pricing.tax > 0 ? '12%' : '0%'}):`, 340, itemY).text(`₹${order.pricing.tax.toFixed(2)}`, 460, itemY, { align: 'right', width: 90 });
      
      itemY += 20;
      doc.moveTo(340, itemY).lineTo(550, itemY).strokeColor('#1F3D2B').lineWidth(1.5).stroke();
      
      itemY += 10;
      doc.font('Helvetica-Bold').fontSize(11).fillColor('#1F3D2B')
         .text('Total:', 340, itemY)
         .text(`₹${order.pricing.total.toFixed(2)}`, 460, itemY, { align: 'right', width: 90 });
      
      // Bottom branding
      doc.font('Helvetica-Oblique').fontSize(8).fillColor('#B08968')
         .text('This is a computer-generated invoice. Thank you for choosing VESTRA.', 50, doc.page.height - 60, { align: 'center' });
      
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
