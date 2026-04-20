const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');
const Order = require('../../models/Order');
const Book = require('../../models/Book');
const User = require('../../models/User');
const { protect } = require('../../middlewares/auth.middleware');

// GET /api/receipt/:orderId — generate and stream PDF receipt
router.get('/:orderId', protect, async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.orderId, user: req.user.id, status: 'paid' });
    if (!order) {
      return res.status(404).json({ message: 'Order not found or not paid' });
    }

    const user = await User.findById(req.user.id).select('name email');
    const books = await Book.find({ id: { $in: order.books } });

    const doc = new PDFDocument({ size: 'A4', margin: 50 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=BookHaven_Receipt_${order.receipt}.pdf`);
    doc.pipe(res);

    // Header
    doc.fontSize(24).font('Helvetica-Bold').fillColor('#1a1612').text('BookHaven', { align: 'center' });
    doc.fontSize(10).font('Helvetica').fillColor('#6b6760').text('Your Premium Digital Library', { align: 'center' });
    doc.moveDown(0.5);

    // Divider
    doc.strokeColor('#c9a84c').lineWidth(2).moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(1);

    // Receipt title
    doc.fontSize(18).font('Helvetica-Bold').fillColor('#1a1612').text('Order Receipt', { align: 'center' });
    doc.moveDown(1);

    // Order details
    const detailsY = doc.y;
    doc.fontSize(10).font('Helvetica').fillColor('#6b6760');

    doc.text('Order ID:', 50, detailsY);
    doc.font('Helvetica-Bold').fillColor('#1a1612').text(order.receipt, 160, detailsY);

    doc.font('Helvetica').fillColor('#6b6760').text('Date:', 50, detailsY + 20);
    doc.font('Helvetica-Bold').fillColor('#1a1612').text(
      new Date(order.paidAt || order.createdAt).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'long', year: 'numeric'
      }), 160, detailsY + 20
    );

    doc.font('Helvetica').fillColor('#6b6760').text('Payment ID:', 50, detailsY + 40);
    doc.font('Helvetica-Bold').fillColor('#1a1612').text(order.razorpayPaymentId || 'N/A', 160, detailsY + 40);

    doc.font('Helvetica').fillColor('#6b6760').text('Customer:', 320, detailsY);
    doc.font('Helvetica-Bold').fillColor('#1a1612').text(user.name, 400, detailsY);

    doc.font('Helvetica').fillColor('#6b6760').text('Email:', 320, detailsY + 20);
    doc.font('Helvetica-Bold').fillColor('#1a1612').text(user.email, 400, detailsY + 20);

    doc.moveDown(5);

    // Items table header
    const tableTop = doc.y;
    doc.fontSize(9).font('Helvetica-Bold').fillColor('#c9a84c');
    doc.text('#', 50, tableTop, { width: 30 });
    doc.text('BOOK TITLE', 80, tableTop, { width: 250 });
    doc.text('AUTHOR', 330, tableTop, { width: 130 });
    doc.text('PRICE', 470, tableTop, { width: 75, align: 'right' });

    doc.strokeColor('#e8e4dc').lineWidth(0.5).moveTo(50, tableTop + 15).lineTo(545, tableTop + 15).stroke();

    // Items
    let y = tableTop + 25;
    books.forEach((book, i) => {
      doc.fontSize(10).font('Helvetica').fillColor('#1a1612');
      doc.text(String(i + 1), 50, y, { width: 30 });
      doc.text(book.title, 80, y, { width: 250 });
      doc.fillColor('#6b6760').text(book.author, 330, y, { width: 130 });
      doc.fillColor('#1a1612').font('Helvetica-Bold').text(`₹${book.price}`, 470, y, { width: 75, align: 'right' });
      y += 22;
    });

    // Total
    doc.strokeColor('#c9a84c').lineWidth(1).moveTo(380, y + 5).lineTo(545, y + 5).stroke();
    y += 15;
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#1a1612');
    doc.text('Total:', 380, y);
    doc.text(`₹${(order.amount / 100).toFixed(2)}`, 470, y, { width: 75, align: 'right' });

    // Footer
    doc.moveDown(4);
    doc.fontSize(9).font('Helvetica').fillColor('#6b6760').text(
      'Thank you for your purchase! Your books are now available in your library.',
      50, doc.y, { align: 'center', width: 495 }
    );
    doc.moveDown(0.5);
    doc.fontSize(8).fillColor('#a8a49c').text(
      `Generated on ${new Date().toLocaleString('en-IN')} | BookHaven — Your Premium Digital Library`,
      50, doc.y, { align: 'center', width: 495 }
    );

    doc.end();
  } catch (err) {
    console.error('Receipt generation error:', err);
    return res.status(500).json({ message: 'Could not generate receipt' });
  }
});

module.exports = router;
