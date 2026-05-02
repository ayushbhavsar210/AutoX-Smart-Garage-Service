import React from 'react';
import { MantineReactTable, useMantineReactTable } from 'mantine-react-table';
import { Button, Box } from '@mantine/core';
import { IconDownload } from '@tabler/icons-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const CommonTable = ({ columns, data, fileName = 'export-data', showSelection = true }) => {
  
  const handleExportRows = (rows) => {
    const doc = new jsPDF();
    
    // Dynamically get headers and data based on the columns passed as props
    const tableHeaders = columns.map((c) => c.header);
    const tableData = rows.map((row) => 
      columns.map((col) => row.original[col.accessorKey])
    );

    autoTable(doc, {
      head: [tableHeaders],
      body: tableData,
    });

    doc.save(`${fileName}.pdf`);
  };

  const table = useMantineReactTable({
    columns,
    data,
    enableRowSelection: showSelection,
    paginationDisplayMode: 'pages',
    initialState: { pagination: { pageSize: 10, pageIndex: 0 }, density: 'md' },
    
    renderTopToolbarCustomActions: ({ table }) => (
      <Box style={{ display: 'flex', gap: '12px', padding: '4px' }}>
        <Button
          variant="light"
          leftSection={<IconDownload size={16} />}
          onClick={() => handleExportRows(table.getRowModel().rows)}
        >
          Export Current Page
        </Button>
        {showSelection && (
          <Button
            variant="outline"
            disabled={!table.getIsSomeRowsSelected() && !table.getIsAllRowsSelected()}
            onClick={() => handleExportRows(table.getSelectedRowModel().rows)}
          >
            Export Selected
          </Button>
        )}
      </Box>
    ),
  });

  return <MantineReactTable table={table} />;
};
 
export default CommonTable;
