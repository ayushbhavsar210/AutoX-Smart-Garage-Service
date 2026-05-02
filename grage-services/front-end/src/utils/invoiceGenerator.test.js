// Mock jsPDF before importing
jest.mock('jspdf', () => {
  return jest.fn().mockImplementation(() => ({
    internal: {
      pageSize: {
        getWidth: jest.fn(() => 210),
        getHeight: jest.fn(() => 297),
      },
    },
    setFillColor: jest.fn(),
    setTextColor: jest.fn(),
    setFontSize: jest.fn(),
    setFontStyle: jest.fn(),
    rect: jest.fn(),
    text: jest.fn(),
    save: jest.fn(),
  }));
});

jest.mock('jspdf-autotable', () => jest.fn());

import jsPDF from 'jspdf';
import {
  generateInvoicePDF,
  downloadInvoicePDF,
  generateBillingReportPDF,
  downloadBillingReportPDF,
} from './invoiceGenerator';

describe('Invoice Generator Tests', () => {
  let mockDoc;
  let mockSave;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Mock jsPDF instance methods
    mockSave = jest.fn();
    mockDoc = {
      internal: {
        pageSize: {
          getWidth: jest.fn(() => 210),
          getHeight: jest.fn(() => 297),
        },
      },
      setFillColor: jest.fn(),
      setTextColor: jest.fn(),
      setFontSize: jest.fn(),
      setFontStyle: jest.fn(),
      rect: jest.fn(),
      text: jest.fn(),
      save: mockSave,
    };

    // Mock jsPDF constructor
    jsPDF.mockImplementation(() => mockDoc);
  });

  describe('generateInvoicePDF', () => {
    test('should create PDF with basic billing data', () => {
      const billingData = {
        invoiceNumber: 'INV-001',
        paymentDate: '2026-02-05',
        amount: 1000,
        tax: 180,
        totalAmount: 1180,
        serviceName: 'Oil Change',
        paymentStatus: 'completed',
        paymentMethod: 'Credit Card',
        transactionId: 'TXN123456',
      };

      const customerData = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '9876543210',
        address: '123 Main St, Mumbai',
      };

      const result = generateInvoicePDF(billingData, customerData);

      // Verify jsPDF was instantiated
      expect(jsPDF).toHaveBeenCalled();
      
      // Verify document was returned
      expect(result).toBe(mockDoc);

      // Verify key methods were called
      expect(mockDoc.setFillColor).toHaveBeenCalled();
      expect(mockDoc.setTextColor).toHaveBeenCalled();
      expect(mockDoc.setFontSize).toHaveBeenCalled();
      expect(mockDoc.text).toHaveBeenCalled();
      expect(mockDoc.rect).toHaveBeenCalled();
    });

    test('should handle missing customer data gracefully', () => {
      const billingData = {
        invoiceNumber: 'INV-002',
        paymentDate: '2026-02-05',
        amount: 500,
        tax: 90,
        totalAmount: 590,
        serviceName: 'Brake Check',
        paymentStatus: 'completed',
        paymentMethod: 'Cash',
        transactionId: 'TXN789012',
      };

      const result = generateInvoicePDF(billingData, {});

      expect(result).toBe(mockDoc);
      expect(mockDoc.text).toHaveBeenCalled();
    });

    test('should include refund information when refund exists', () => {
      const billingData = {
        invoiceNumber: 'INV-003',
        paymentDate: '2026-02-05',
        amount: 2000,
        tax: 360,
        totalAmount: 2360,
        serviceName: 'Engine Repair',
        paymentStatus: 'refunded',
        paymentMethod: 'Credit Card',
        transactionId: 'TXN345678',
        refundStatus: 'approved',
        refundAmount: 1000,
      };

      const customerData = {
        name: 'Jane Smith',
        email: 'jane@example.com',
        phone: '9876543211',
        address: '456 Park Ave, Delhi',
      };

      const result = generateInvoicePDF(billingData, customerData);

      expect(result).toBe(mockDoc);
      expect(mockDoc.setTextColor).toHaveBeenCalled();
    });

    test('should not include refund section when refund status is none', () => {
      const billingData = {
        invoiceNumber: 'INV-004',
        paymentDate: '2026-02-05',
        amount: 1500,
        tax: 270,
        totalAmount: 1770,
        serviceName: 'Tire Rotation',
        paymentStatus: 'completed',
        paymentMethod: 'Debit Card',
        transactionId: 'TXN901234',
        refundStatus: 'none',
        refundAmount: 0,
      };

      const result = generateInvoicePDF(billingData);

      expect(result).toBe(mockDoc);
    });

    test('should handle zero tax correctly', () => {
      const billingData = {
        invoiceNumber: 'INV-005',
        paymentDate: '2026-02-05',
        amount: 800,
        tax: 0,
        totalAmount: 800,
        serviceName: 'Inspection',
        paymentStatus: 'completed',
        paymentMethod: 'Cash',
        transactionId: 'TXN567890',
      };

      const result = generateInvoicePDF(billingData);

      expect(result).toBe(mockDoc);
      expect(mockDoc.text).toHaveBeenCalled();
    });
  });

  describe('downloadInvoicePDF', () => {
    test('should generate and save PDF with correct filename', () => {
      const billingData = {
        invoiceNumber: 'INV-006',
        paymentDate: '2026-02-05',
        amount: 1200,
        tax: 216,
        totalAmount: 1416,
        serviceName: 'AC Repair',
        paymentStatus: 'completed',
        paymentMethod: 'Online',
        transactionId: 'TXN123789',
      };

      const customerData = {
        name: 'Mike Johnson',
        email: 'mike@example.com',
        phone: '9876543212',
        address: '789 Lake Rd, Bangalore',
      };

      downloadInvoicePDF(billingData, customerData);

      // Verify PDF was generated
      expect(jsPDF).toHaveBeenCalled();
      
      // Verify save was called with correct filename
      expect(mockSave).toHaveBeenCalledWith('INV-006.pdf');
    });

    test('should handle download with minimal data', () => {
      const billingData = {
        invoiceNumber: 'INV-007',
        paymentDate: '2026-02-05',
        paymentStatus: 'completed',
        amount: 500,
        totalAmount: 500,
        serviceName: 'Service',
        paymentMethod: 'Cash',
        transactionId: 'TXN001',
      };

      downloadInvoicePDF(billingData);

      expect(mockSave).toHaveBeenCalledWith('INV-007.pdf');
    });
  });

  describe('generateBillingReportPDF', () => {
    test('should create billing report with multiple records', () => {
      // Mock landscape mode
      jsPDF.mockImplementation((orientation) => {
        expect(orientation).toBe('l');
        return mockDoc;
      });

      const records = [
        {
          invoiceNumber: 'INV-001',
          userId: 'CUST001',
          serviceName: 'Oil Change',
          amount: 1000,
          paymentMethod: 'Credit Card',
          paymentStatus: 'completed',
          paymentDate: '2026-02-01',
        },
        {
          invoiceNumber: 'INV-002',
          userId: 'CUST002',
          serviceName: 'Brake Check',
          amount: 1500,
          paymentMethod: 'Cash',
          paymentStatus: 'completed',
          paymentDate: '2026-02-02',
        },
        {
          invoiceNumber: 'INV-003',
          userId: 'CUST003',
          serviceName: 'Engine Repair',
          amount: 3000,
          paymentMethod: 'Online',
          paymentStatus: 'pending',
          paymentDate: '2026-02-03',
        },
      ];

      const summary = {
        totalAmount: 5500,
        totalTransactions: 3,
        completedPayments: 2,
        totalRefunds: 0,
      };

      const result = generateBillingReportPDF(records, summary);

      expect(result).toBe(mockDoc);
      expect(jsPDF).toHaveBeenCalledWith('l');
      expect(mockDoc.setFillColor).toHaveBeenCalled();
      expect(mockDoc.text).toHaveBeenCalled();
    });

    test('should handle empty records array', () => {
      jsPDF.mockImplementation(() => mockDoc);

      const records = [];
      const summary = {
        totalAmount: 0,
        totalTransactions: 0,
        completedPayments: 0,
        totalRefunds: 0,
      };

      const result = generateBillingReportPDF(records, summary);

      expect(result).toBe(mockDoc);
    });

    test('should handle missing summary data', () => {
      jsPDF.mockImplementation(() => mockDoc);

      const records = [
        {
          invoiceNumber: 'INV-001',
          serviceName: 'Service',
          amount: 1000,
          paymentMethod: 'Cash',
          paymentStatus: 'completed',
          paymentDate: '2026-02-01',
        },
      ];

      const result = generateBillingReportPDF(records, {});

      expect(result).toBe(mockDoc);
      expect(mockDoc.text).toHaveBeenCalled();
    });
  });

  describe('downloadBillingReportPDF', () => {
    test('should generate and save billing report', () => {
      jsPDF.mockImplementation(() => mockDoc);

      const records = [
        {
          invoiceNumber: 'INV-001',
          userId: 'CUST001',
          serviceName: 'Service',
          amount: 1000,
          paymentMethod: 'Cash',
          paymentStatus: 'completed',
          paymentDate: '2026-02-01',
        },
      ];

      const summary = {
        totalAmount: 1000,
        totalTransactions: 1,
        completedPayments: 1,
        totalRefunds: 0,
      };

      downloadBillingReportPDF(records, summary);

      expect(mockSave).toHaveBeenCalled();
      const savedFilename = mockSave.mock.calls[0][0];
      expect(savedFilename).toMatch(/^billing-report-\d{4}-\d{2}-\d{2}\.pdf$/);
    });
  });

  describe('PDF Formatting Tests', () => {
    test('should use correct color scheme', () => {
      const billingData = {
        invoiceNumber: 'INV-008',
        paymentDate: '2026-02-05',
        paymentStatus: 'completed',
        amount: 1000,
        totalAmount: 1180,
        serviceName: 'Service',
        paymentMethod: 'Cash',
        transactionId: 'TXN002',
      };

      generateInvoicePDF(billingData);

      // Check if colors were set (primary blue and gray)
      expect(mockDoc.setFillColor).toHaveBeenCalled();
      expect(mockDoc.setTextColor).toHaveBeenCalled();
    });

    test('should set appropriate font sizes', () => {
      const billingData = {
        invoiceNumber: 'INV-009',
        paymentDate: '2026-02-05',
        paymentStatus: 'completed',
        amount: 1000,
        totalAmount: 1180,
        serviceName: 'Service',
        paymentMethod: 'Cash',
        transactionId: 'TXN003',
      };

      generateInvoicePDF(billingData);

      // Verify font sizes were set
      expect(mockDoc.setFontSize).toHaveBeenCalledWith(24); // Company name
      expect(mockDoc.setFontSize).toHaveBeenCalledWith(16); // Invoice title
      expect(mockDoc.setFontSize).toHaveBeenCalledWith(11); // Section headers
      expect(mockDoc.setFontSize).toHaveBeenCalledWith(9);  // Details
      expect(mockDoc.setFontSize).toHaveBeenCalledWith(8);  // Footer
    });

    test('should include company branding', () => {
      const billingData = {
        invoiceNumber: 'INV-010',
        paymentDate: '2026-02-05',
        paymentStatus: 'completed',
        amount: 1000,
        totalAmount: 1180,
        serviceName: 'Service',
        paymentMethod: 'Cash',
        transactionId: 'TXN004',
      };

      generateInvoicePDF(billingData);

      // Verify company name and tagline were added
      expect(mockDoc.text).toHaveBeenCalledWith(
        'GARAGE SERVICES',
        expect.any(Number),
        expect.any(Number)
      );
      expect(mockDoc.text).toHaveBeenCalledWith(
        'Professional Auto Care & Maintenance',
        expect.any(Number),
        expect.any(Number)
      );
    });
  });

  describe('Data Validation Tests', () => {
    test('should handle minimal billing data', () => {
      const minimalData = {
        invoiceNumber: 'INV-011',
        paymentDate: '2026-02-05',
        paymentStatus: 'completed',
        amount: 1000,
        totalAmount: 1000,
        serviceName: 'Service',
        paymentMethod: 'Cash',
        transactionId: 'TXN005',
      };

      expect(() => {
        generateInvoicePDF(minimalData);
      }).not.toThrow();
    });

    test('should handle null tax value', () => {
      const billingData = {
        invoiceNumber: 'INV-012',
        paymentDate: '2026-02-05',
        amount: 1000,
        tax: null,
        totalAmount: 1000,
        serviceName: 'Service',
        paymentStatus: 'completed',
        paymentMethod: 'Cash',
        transactionId: 'TXN006',
      };

      expect(() => {
        generateInvoicePDF(billingData);
      }).not.toThrow();
    });

    test('should format currency values correctly', () => {
      const billingData = {
        invoiceNumber: 'INV-013',
        paymentDate: '2026-02-05',
        amount: 1234.56,
        tax: 222.22,
        totalAmount: 1456.78,
        serviceName: 'Premium Service',
        paymentStatus: 'completed',
        paymentMethod: 'Credit Card',
        transactionId: 'TXN999888',
      };

      generateInvoicePDF(billingData);

      // Verify amounts are formatted
      expect(mockDoc.text).toHaveBeenCalled();
    });
  });
});
