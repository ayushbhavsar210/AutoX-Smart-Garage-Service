import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { MantineReactTable, useMantineReactTable } from 'mantine-react-table';
import { Button, Menu } from '@mantine/core';
import { IconDownload } from '@tabler/icons-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import './Reports.css';
import { analyticsApi } from '../../utils/apiService';

function Reports() {
  const [reportType, setReportType] = useState('bookings');
  const [filters, setFilters] = useState({
    search: '',
    fromDate: '',
    toDate: '',
    status: '',
  });
  const [appliedFilters, setAppliedFilters] = useState({
    search: '',
    fromDate: '',
    toDate: '',
    status: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [reportTitle, setReportTitle] = useState('Report');
  const [columnsMeta, setColumnsMeta] = useState([]);
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState({
    totalRecords: 0,
    totalAmount: 0,
    generatedAt: '',
    fromDate: null,
    toDate: null,
  });
  const [statuses, setStatuses] = useState([]);
  const [pageSize, setPageSize] = useState(10);

  const reportTypeOptions = [
    { value: 'bookings', label: 'Bookings' },
    { value: 'users', label: 'Users' },
    { value: 'payments', label: 'Payments' },
    { value: 'billing', label: 'Billing' },
    { value: 'contacts', label: 'Contacts' },
  ];

  const formatDate = (value) => {
    if (!value) return 'N/A';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? 'N/A' : date.toLocaleString('en-IN');
  };

  const formatAmount = (value) => {
    const num = Number(value || 0);
    return `Rs ${num.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
  };

  const fetchReportData = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams();
      params.set('reportType', reportType);
      params.set('limit', '5000');
      if (appliedFilters.search) params.set('search', appliedFilters.search);
      if (appliedFilters.fromDate) params.set('fromDate', appliedFilters.fromDate);
      if (appliedFilters.toDate) params.set('toDate', appliedFilters.toDate);
      if (appliedFilters.status) params.set('status', appliedFilters.status);

      const res = await analyticsApi.reportData(params.toString());
      const payload = res?.data || res || {};
      const rows = Array.isArray(payload.records) ? payload.records : [];

      setReportTitle(payload.title || 'Report');
      setColumnsMeta(Array.isArray(payload.columns) ? payload.columns : []);
      setRecords(rows);
      setSummary(payload.summary || {
        totalRecords: rows.length,
        totalAmount: 0,
        generatedAt: new Date().toISOString(),
      });
      setStatuses(Array.isArray(payload.statuses) ? payload.statuses : []);
    } catch (err) {
      setError(err?.message || 'Failed to load report data');
      setRecords([]);
      setColumnsMeta([]);
      setSummary({ totalRecords: 0, totalAmount: 0, generatedAt: new Date().toISOString() });
      setStatuses([]);
    } finally {
      setLoading(false);
    }
  }, [reportType, appliedFilters]);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  useEffect(() => {
    setFilters((prev) => ({ ...prev, status: '' }));
    setAppliedFilters((prev) => ({ ...prev, status: '' }));
  }, [reportType]);

  const columns = useMemo(() => {
    return columnsMeta.map((col) => ({
      accessorKey: col.key,
      header: col.header,
      enableSorting: true,
      Cell: ({ cell }) => {
        const value = cell.getValue();
        if (col.key === 'date') return formatDate(value);
        if (col.key === 'amount') return formatAmount(value);
        return value || 'N/A';
      },
    }));
  }, [columnsMeta]);

  const table = useMantineReactTable({
    columns,
    data: records,
    enableSorting: true,
    enablePagination: true,
    enableColumnFilters: false,
    enableGlobalFilter: false,
    paginationDisplayMode: 'pages',
    initialState: {
      pagination: { pageIndex: 0, pageSize },
      density: 'md',
      sorting: [{ id: 'date', desc: true }],
    },
    state: {
      isLoading: loading,
      showAlertBanner: !!error,
    },
  });

  useEffect(() => {
    table.setPageSize(pageSize);
  }, [pageSize, table]);

  const handleApplyFilters = () => {
    setAppliedFilters({ ...filters });
  };

  const handleExportPdf = () => {
    const visibleRows = table.getFilteredRowModel().rows;
    const headerRow = columnsMeta.map((col) => col.header);
    const bodyRows = visibleRows.map((row) => {
      const original = row.original;
      return columnsMeta.map((col) => {
        const value = original[col.key];
        if (col.key === 'date') return formatDate(value);
        if (col.key === 'amount') return formatAmount(value);
        return value || 'N/A';
      });
    });

    const doc = new jsPDF('landscape');
    doc.setFontSize(16);
    doc.text(reportTitle, 14, 16);

    doc.setFontSize(10);
    const selectedRange = `${appliedFilters.fromDate || 'Any'} to ${appliedFilters.toDate || 'Any'}`;
    doc.text(`Date Range: ${selectedRange}`, 14, 24);
    doc.text(`Generated At: ${new Date().toLocaleString('en-IN')}`, 14, 30);
    doc.text(`Total Records: ${visibleRows.length}`, 14, 36);

    if (summary.totalAmount > 0) {
      doc.text(`Total Amount: ${formatAmount(summary.totalAmount)}`, 14, 42);
    }

    autoTable(doc, {
      startY: summary.totalAmount > 0 ? 48 : 42,
      head: [headerRow],
      body: bodyRows,
      styles: { fontSize: 9, cellPadding: 2 },
      headStyles: { fillColor: [220, 38, 38] },
      theme: 'striped',
    });

    doc.save(`${reportType}-report-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <div className="reports-container">
      <div className="reports-header">
        <h1>System Reports Data Grid</h1>
        <p>Filter, sort, paginate, and export the exact data shown below.</p>
      </div>

      <div className="reports-toolbar">
        <div className="reports-filter-grid">
          <div className="field-group">
            <label>Report Type</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
            >
              {reportTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="field-group">
            <label>Global Search</label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
              placeholder="Search by name, email, ID, vehicle..."
            />
          </div>

          <div className="field-group">
            <label>From Date</label>
            <input
              type="date"
              className="report-date-input"
              value={filters.fromDate}
              onChange={(e) => setFilters((prev) => ({ ...prev, fromDate: e.target.value }))}
            />
          </div>

          <div className="field-group">
            <label>To Date</label>
            <input
              type="date"
              className="report-date-input"
              value={filters.toDate}
              onChange={(e) => setFilters((prev) => ({ ...prev, toDate: e.target.value }))}
            />
          </div>

          <div className="field-group">
            <label>Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
              disabled={statuses.length === 0}
            >
              <option value="">All Statuses</option>
              {statuses.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </div>

          <div className="field-group">
            <label>Page Size</label>
            <select
              value={String(pageSize)}
              onChange={(e) => setPageSize(Number(e.target.value))}
            >
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
            </select>
          </div>
        </div>

        <div className="reports-actions">
          <Button
            className="apply-filter-btn"
            onClick={handleApplyFilters}
            loading={loading}
          >
            Apply Filter
          </Button>

          <Menu shadow="md" width={200}>
            <Menu.Target>
              <Button
                leftSection={<IconDownload size={16} />}
                variant="filled"
                color="red"
                className="download-pdf-btn"
                disabled={records.length === 0}
              >
                Download PDF
              </Button>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item onClick={handleExportPdf}>Export Filtered Data</Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </div>
      </div>

      <div className="reports-summary-strip">
        <div className="summary-pill">
          <span>Total Records</span>
          <strong>{summary.totalRecords || 0}</strong>
        </div>
        <div className="summary-pill">
          <span>Total Amount</span>
          <strong>{formatAmount(summary.totalAmount || 0)}</strong>
        </div>
        <div className="summary-pill">
          <span>Date Range</span>
          <strong>{`${appliedFilters.fromDate || 'Any'} to ${appliedFilters.toDate || 'Any'}`}</strong>
        </div>
      </div>

      <div className="reports-grid-wrapper">
        {error ? (
          <div className="reports-error">{error}</div>
        ) : (
          <>
            <div className="report-title-row">
              <h2>{reportTitle}</h2>
              <p>Generated: {formatDate(summary.generatedAt)}</p>
            </div>
            <MantineReactTable table={table} />
          </>
        )}
      </div>
    </div>
  );
}

export default Reports;
