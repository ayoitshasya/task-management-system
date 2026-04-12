// reportController.js - Generates PDF report of tasks within a date range
const PDFDocument = require('pdfkit');
const db = require('../config/db');

// GET /api/reports?from=YYYY-MM-DD&to=YYYY-MM-DD
// Returns a downloadable PDF file with task summary
const generateReport = async (req, res) => {
  const { from, to } = req.query;

  if (!from || !to) {
    return res.status(400).json({ message: 'Please provide "from" and "to" date query params' });
  }

  try {
    // Fetch tasks within the date range, with assignee and creator names
    const [tasks] = await db.query(
      `SELECT t.*, u1.name AS assigned_to_name, u2.name AS created_by_name
       FROM tasks t
       LEFT JOIN users u1 ON t.assigned_to = u1.id
       LEFT JOIN users u2 ON t.created_by = u2.id
       WHERE t.due_date BETWEEN ? AND ?
       ORDER BY t.due_date ASC`,
      [from, to]
    );

    // Set headers so browser knows this is a downloadable PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="task-report-${from}-to-${to}.pdf"`);

    // Create PDF document and pipe it directly to the response
    const doc = new PDFDocument({ margin: 40 });
    doc.pipe(res);

    // --- PDF Content ---

    // Title
    doc.fontSize(20).font('Helvetica-Bold').text('Task Management System', { align: 'center' });
    doc.fontSize(14).font('Helvetica').text('Task Report', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(11).text(`Period: ${from} to ${to}`, { align: 'center' });
    doc.moveDown(0.5);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, { align: 'center' });
    doc.moveDown(1);

    // Summary counts
    const total = tasks.length;
    const pending = tasks.filter(t => t.status === 'Pending').length;
    const inProgress = tasks.filter(t => t.status === 'In Progress').length;
    const completed = tasks.filter(t => t.status === 'Completed').length;

    doc.fontSize(13).font('Helvetica-Bold').text('Summary');
    doc.moveDown(0.3);
    doc.fontSize(11).font('Helvetica');
    doc.text(`Total Tasks: ${total}`);
    doc.text(`Pending: ${pending}`);
    doc.text(`In Progress: ${inProgress}`);
    doc.text(`Completed: ${completed}`);
    doc.moveDown(1);

    // Table header line
    doc.fontSize(13).font('Helvetica-Bold').text('Task Details');
    doc.moveDown(0.5);

    if (tasks.length === 0) {
      doc.fontSize(11).font('Helvetica').text('No tasks found in this date range.');
    } else {
      // Draw a simple table manually using PDFKit
      const colWidths = [180, 65, 80, 80, 120];
      const headers = ['Title', 'Priority', 'Status', 'Due Date', 'Assigned To'];
      const startX = 40;
      let y = doc.y;

      // Draw header row
      doc.fontSize(10).font('Helvetica-Bold');
      headers.forEach((header, i) => {
        const x = startX + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
        doc.text(header, x, y, { width: colWidths[i] - 5 });
      });

      doc.moveDown(0.3);
      // Draw a line under header
      doc.moveTo(startX, doc.y).lineTo(545, doc.y).stroke();
      doc.moveDown(0.3);

      // Draw each task row
      doc.fontSize(9).font('Helvetica');
      tasks.forEach((task) => {
        y = doc.y;

        // Start a new page if we're near the bottom
        if (y > 700) {
          doc.addPage();
          y = 40;
        }

        const row = [
          task.title,
          task.priority,
          task.status,
          task.due_date ? new Date(task.due_date).toLocaleDateString() : '-',
          task.assigned_to_name || 'Unassigned'
        ];

        row.forEach((cell, i) => {
          const x = startX + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
          doc.text(String(cell), x, y, { width: colWidths[i] - 5 });
        });

        doc.moveDown(0.6);
      });
    }

    doc.end();
  } catch (err) {
    console.error('Report generation error:', err);
    res.status(500).json({ message: 'Server error generating report' });
  }
};

module.exports = { generateReport };
