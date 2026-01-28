/**
 * Export utility functions for downloading data as CSV, JSON, and PDF
 */

/**
 * Export data as CSV file
 */
export const exportToCSV = (data: any[], filename: string): void => {
  if (!data || data.length === 0) {
    throw new Error('No data to export');
  }

  // Get headers from first object
  const headers = Object.keys(data[0]);
  
  // Create CSV content
  const csvContent = [
    // Headers
    headers.map(h => `"${h}"`).join(','),
    // Data rows
    ...data.map(row =>
      headers.map(header => {
        const value = row[header];
        // Handle null/undefined
        if (value === null || value === undefined) return '""';
        // Handle objects/arrays - stringify them
        if (typeof value === 'object') {
          return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
        }
        // Escape quotes in strings
        return `"${String(value).replace(/"/g, '""')}"`;
      }).join(',')
    ),
  ].join('\n');

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Export data as JSON file
 */
export const exportToJSON = (data: any, filename: string): void => {
  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.json`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Export data as PDF (using HTML print method)
 * For a more advanced PDF, consider using jsPDF or pdfmake
 */
export const exportToPDF = (content: string, filename: string, title?: string): void => {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>${title || filename}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 20px;
            line-height: 1.6;
          }
          h1 {
            color: #2563eb;
            border-bottom: 2px solid #2563eb;
            padding-bottom: 10px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
          }
          th {
            background-color: #2563eb;
            color: white;
          }
          tr:nth-child(even) {
            background-color: #f2f2f2;
          }
          .footer {
            margin-top: 30px;
            text-align: center;
            color: #666;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        ${title ? `<h1>${title}</h1>` : ''}
        ${content}
        <div class="footer">
          Generated on ${new Date().toLocaleString()}
        </div>
      </body>
    </html>
  `;

  // Create downloadable HTML file (can be opened and printed as PDF)
  const blob = new Blob([htmlContent], { type: 'text/html' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.html`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Also open in new window for immediate viewing/printing
  const printWindow = window.open();
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    // Trigger print dialog after a short delay
    setTimeout(() => {
      printWindow.print();
    }, 250);
  }
  
  URL.revokeObjectURL(url);
};

/**
 * Convert array of objects to HTML table
 */
export const arrayToHTMLTable = (data: any[], headers?: string[]): string => {
  if (!data || data.length === 0) {
    return '<p>No data available</p>';
  }

  const keys = headers || Object.keys(data[0]);
  
  const tableRows = data.map(row => {
    const cells = keys.map(key => {
      const value = row[key];
      let displayValue = '';
      if (value === null || value === undefined) {
        displayValue = '-';
      } else if (typeof value === 'object') {
        displayValue = JSON.stringify(value);
      } else {
        displayValue = String(value);
      }
      return `<td>${displayValue}</td>`;
    }).join('');
    return `<tr>${cells}</tr>`;
  });

  const headerRow = `<tr>${keys.map(key => `<th>${key}</th>`).join('')}</tr>`;
  
  return `<table>${headerRow}${tableRows.join('')}</table>`;
};

/**
 * Export audit logs with formatting
 */
export const exportAuditLogs = (logs: any[], format: 'csv' | 'json' | 'pdf' = 'csv'): void => {
  if (!logs || logs.length === 0) {
    throw new Error('No audit logs to export');
  }

  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `audit-logs-${timestamp}`;

  // Format logs for export
  const formattedLogs = logs.map(log => ({
    'Timestamp': new Date(log.timestamp).toLocaleString(),
    'User': log.userName,
    'Email': log.userEmail,
    'Action': log.action,
    'Resource Type': log.resourceType,
    'Resource Name': log.resourceName || '-',
    'IP Address': log.ipAddress,
    'Status': log.status,
    'Details': log.details ? JSON.stringify(log.details) : '-',
  }));

  switch (format) {
    case 'csv':
      exportToCSV(formattedLogs, filename);
      break;
    case 'json':
      exportToJSON(formattedLogs, filename);
      break;
    case 'pdf':
      const tableHTML = arrayToHTMLTable(formattedLogs);
      exportToPDF(tableHTML, filename, 'Audit Logs Report');
      break;
  }
};

/**
 * Export report data
 */
export const exportReport = (report: any, format: 'pdf' | 'csv' | 'json'): void => {
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `${report.title || 'report'}-${timestamp}`.replace(/[^a-z0-9]/gi, '-').toLowerCase();

  switch (format) {
    case 'csv':
      // Convert report data to array format
      const csvData = Object.entries(report.data || {}).map(([key, value]) => ({
        Metric: key,
        Value: typeof value === 'object' ? JSON.stringify(value) : String(value),
      }));
      exportToCSV(csvData, filename);
      break;
    case 'json':
      exportToJSON(report, filename);
      break;
    case 'pdf':
      // Create formatted PDF content
      let pdfContent = `
        <h2>${report.title}</h2>
        <p><strong>Description:</strong> ${report.description || 'N/A'}</p>
        <p><strong>Generated:</strong> ${new Date(report.generatedAt).toLocaleString()}</p>
        <p><strong>Date Range:</strong> ${new Date(report.dateRange.start).toLocaleDateString()} - ${new Date(report.dateRange.end).toLocaleDateString()}</p>
      `;
      
      // Add data as table if it's an object
      if (report.data && typeof report.data === 'object') {
        const dataTable = arrayToHTMLTable(
          Object.entries(report.data).map(([key, value]) => ({
            Metric: key,
            Value: typeof value === 'object' ? JSON.stringify(value) : String(value),
          }))
        );
        pdfContent += dataTable;
      }
      
      exportToPDF(pdfContent, filename, report.title);
      break;
  }
};

/**
 * Export instruction as PDF
 */
export const exportInstructionPDF = (instruction: any): void => {
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `instruction-${instruction.id || 'unknown'}-${timestamp}`;

  let content = `
    <h2>${instruction.title || 'Care Instruction'}</h2>
    <p><strong>Patient:</strong> ${instruction.patientName || 'N/A'}</p>
    <p><strong>Provider:</strong> ${instruction.providerName || 'N/A'}</p>
    <p><strong>Type:</strong> ${instruction.type || 'N/A'}</p>
    <p><strong>Status:</strong> ${instruction.status || 'N/A'}</p>
    <p><strong>Priority:</strong> ${instruction.priority || 'N/A'}</p>
    <p><strong>Assigned Date:</strong> ${instruction.assignedDate ? new Date(instruction.assignedDate).toLocaleString() : 'N/A'}</p>
    <hr>
    <h3>Instructions</h3>
    <p>${instruction.content || 'No content available'}</p>
  `;

  // Add medication details if available
  if (instruction.medicationDetails) {
    content += `
      <h3>Medication Details</h3>
      <ul>
        <li><strong>Name:</strong> ${instruction.medicationDetails.name || 'N/A'}</li>
        <li><strong>Dosage:</strong> ${instruction.medicationDetails.dosage || 'N/A'} ${instruction.medicationDetails.unit || ''}</li>
        <li><strong>Frequency:</strong> ${instruction.medicationDetails.frequency || 'N/A'}</li>
        <li><strong>Duration:</strong> ${instruction.medicationDetails.duration || 'N/A'}</li>
        ${instruction.medicationDetails.specialInstructions ? `<li><strong>Special Instructions:</strong> ${instruction.medicationDetails.specialInstructions}</li>` : ''}
      </ul>
    `;
  }

  // Add lifestyle details if available
  if (instruction.lifestyleDetails) {
    content += `
      <h3>Lifestyle Details</h3>
      <p><strong>Category:</strong> ${instruction.lifestyleDetails.category || 'N/A'}</p>
      <p><strong>Instructions:</strong> ${instruction.lifestyleDetails.instructions || 'N/A'}</p>
      <p><strong>Goals:</strong> ${instruction.lifestyleDetails.goals || 'N/A'}</p>
    `;
  }

  exportToPDF(content, filename, instruction.title || 'Care Instruction');
};

/**
 * Export compliance report
 */
export const exportComplianceReport = (
  data: any,
  format: 'pdf' | 'csv',
  reportType: string = 'Compliance Report'
): void => {
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `${reportType.toLowerCase().replace(/\s+/g, '-')}-${timestamp}`;

  if (format === 'csv') {
    // Convert to array format for CSV
    const csvData = Array.isArray(data) ? data : [data];
    exportToCSV(csvData, filename);
  } else {
    // PDF format
    const tableHTML = arrayToHTMLTable(Array.isArray(data) ? data : [data]);
    exportToPDF(tableHTML, filename, reportType);
  }
};
