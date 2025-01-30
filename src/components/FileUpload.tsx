'use client';
import { useState } from "react";
import { Upload, Download, FileText } from "lucide-react";
import * as XLSX from "xlsx";

const FileUpload = () => {
  const [file, setFile] = useState<File | null>(null);
  const [data, setData] = useState<any[]>([]);
  const [fullData, setFullData] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [downloadFormat, setDownloadFormat] = useState<"xlsx" | "csv">("xlsx");

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    event.stopPropagation(); // Prevent event bubbling
    const selectedFile = event.target.files?.[0];
    setError("");

    if (selectedFile) {
      if (!selectedFile.name.match(/\.(xlsx|csv)$/)) {
        setError("Please select an Excel (.xlsx) or CSV (.csv) file");
        setFile(null);
        return;
      }

      setFile(selectedFile);
      readExcel(selectedFile);
    }
  };

  const readExcel = (file: File) => {
    const reader = new FileReader();
    reader.readAsArrayBuffer(file);
    reader.onload = (e) => {
      try {
        if (!e.target?.result) return;

        const bufferArray = e.target.result;
        const workbook = XLSX.read(bufferArray, { type: "buffer" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        // Get all columns first (header row)
        const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1:A1');
        const allColumns: string[] = [];
        
        // Extract headers from the first row
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const cell = sheet[XLSX.utils.encode_cell({ r: range.s.r, c: C })];
          allColumns.push(cell?.v || XLSX.utils.encode_col(C));
        }
        
        // Parse all data
        const parsedData = XLSX.utils.sheet_to_json(sheet);
        
        setFullData(parsedData);
        setData(parsedData.slice(0, 5));
        setColumns(allColumns);
        setSelectedColumns([]);
        
      } catch (err) {
        setError("Error reading file. Please make sure it's a valid Excel/CSV file.");
        console.error("Error reading file:", err);
      }
    };

    reader.onerror = () => {
      setError("Error reading file. Please try again.");
    };
  };

  const handleColumnSelection = (column: string) => {
    setSelectedColumns((prev) =>
      prev.includes(column) ? prev.filter((c) => c !== column) : [...prev, column]
    );
  };

  const handleDownload = () => {
    if (selectedColumns.length === 0) {
      setError("Please select at least one column to download");
      return;
    }

    try {
      // Filter data to include only selected columns
      const filteredData = fullData.map(row => {
        const newRow: Record<string, any> = {};
        selectedColumns.forEach(col => {
          newRow[col] = row[col];
        });
        return newRow;
      });

      // Create a new workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(filteredData);
      XLSX.utils.book_append_sheet(workbook, worksheet, "Filtered Data");

      // Generate base filename
      const baseFilename = file ? 
        `filtered_${file.name.replace(/\.[^/.]+$/, "")}` : 
        "filtered_data";

      if (downloadFormat === "csv") {
        // For CSV, convert to CSV string and create blob
        const csvContent = XLSX.utils.sheet_to_csv(worksheet);
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${baseFilename}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        // For XLSX, use writeFile
        XLSX.writeFile(workbook, `${baseFilename}.xlsx`);
      }

      setError(""); // Clear any existing errors
    } catch (err) {
      setError("Error generating download file. Please try again.");
      console.error("Error generating download:", err);
    }
  };

  const handleUploadClick = (event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent event bubbling
    const fileInput = document.getElementById("fileInput");
    if (fileInput) {
      fileInput.click();
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 space-y-8">
      {/* Main Container with subtle shadow */}
      <div className="bg-white rounded-xl shadow-sm p-8">
        {/* Title Section */}
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">Excel Column Extractor</h2>
          <p className="text-gray-600">Upload your Excel file and select the columns you want to extract</p>
        </div>

        {/* File Upload Section */}
        <div
          className={`
            border-2 border-dashed rounded-xl p-10
            ${!file ? 'border-blue-200 hover:border-blue-400 bg-blue-50/50' : 'border-green-200 bg-green-50/50'}
            transition-all duration-300 cursor-pointer relative
          `}
          onClick={handleUploadClick}
        >
          <input 
            id="fileInput" 
            type="file" 
            accept=".xlsx,.csv" 
            onChange={handleFileChange} 
            onClick={e => e.stopPropagation()}
            className="hidden" 
          />
          
          <div className="flex flex-col items-center gap-4">
            {!file ? (
              <>
                <Upload className="w-16 h-16 text-blue-500" strokeWidth={1.5} />
                <div className="text-center">
                  <p className="text-lg font-medium text-gray-700 mb-1">
                    Drop your file here or click to browse
                  </p>
                  <p className="text-sm text-gray-500">
                    Supports Excel (.xlsx) and CSV (.csv) files
                  </p>
                </div>
              </>
            ) : (
              <>
                <FileText className="w-16 h-16 text-green-500" strokeWidth={1.5} />
                <div className="text-center">
                  <p className="text-lg font-medium text-green-700 mb-1">
                    {file.name}
                  </p>
                  <p className="text-sm text-green-600">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-2">
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Column Selection and Download Options */}
        {columns.length > 0 && (
          <div className="mt-8 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
              <h3 className="text-xl font-semibold text-gray-800">Select Columns</h3>
              <div className="flex items-center gap-3">
                <select
                  value={downloadFormat}
                  onChange={(e) => setDownloadFormat(e.target.value as "xlsx" | "csv")}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-sm bg-black hover:border-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="xlsx">Excel (.xlsx)</option>
                  <option value="csv">CSV (.csv)</option>
                </select>
                <button
                  onClick={handleDownload}
                  disabled={selectedColumns.length === 0}
                  className="flex items-center gap-2 px-5 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-200 disabled:cursor-not-allowed"
                >
                  <Download size={18} />
                  <span>Download</span>
                </button>
              </div>
            </div>

            {/* Column Selection Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 text-black">
              {columns.map((col) => (
                <label 
                  key={col} 
                  className={`
                    flex items-center gap-3 p-3 rounded-lg cursor-pointer
                    ${selectedColumns.includes(col) ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50 border border-gray-200'}
                    hover:bg-blue-50/50 transition-colors
                  `}
                >
                  <input
                    type="checkbox"
                    checked={selectedColumns.includes(col)}
                    onChange={() => handleColumnSelection(col)}
                    className="w-4 h-4 text-blue-500 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-sm truncate font-medium" title={col}>{col}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Data Preview */}
        {data.length > 0 && selectedColumns.length > 0 && (
          <div className="mt-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Data Preview</h3>
            <div className="overflow-x-auto border border-gray-200 rounded-xl shadow-sm">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr className="bg-gray-50">
                    {selectedColumns.map((col) => (
                      <th key={col} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.map((row, index) => (
                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                      {selectedColumns.map((col) => (
                        <td key={col} className="px-6 py-3 text-sm text-gray-700 whitespace-nowrap">
                          {row[col]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUpload;