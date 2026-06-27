import { useState, useRef, useCallback } from 'react';
import { Upload, X, FileSpreadsheet, CheckCircle, AlertCircle, Download, FileX, Loader2 } from 'lucide-react';
import API from '../services/api';
import Modal from './Modal';

export default function BulkUploadModal({ isOpen, onClose, onSuccess }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [duplicateAction, setDuplicateAction] = useState('update'); // 'skip' | 'update' | 'replace'
  const fileInputRef = useRef(null);

  const REQUIRED_HEADERS = ['name', 'price', 'stock'];
  const OPTIONAL_HEADERS = ['description', 'cost', 'category', 'barcode', 'sku', 'minstock'];
  const ALL_HEADERS = [...REQUIRED_HEADERS, ...OPTIONAL_HEADERS];

  const parseCSV = useCallback((text) => {
    const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
    if (lines.length < 2) throw new Error('CSV file is empty or missing headers');

    // Parse CSV handling quoted values
    const parseLine = (line) => {
      const result = [];
      let current = '';
      let inQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          if (inQuotes && line[i + 1] === '"') {
            current += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    };

    const headers = parseLine(lines[0]).map(h => h.toLowerCase().trim());
    const missingHeaders = REQUIRED_HEADERS.filter(h => !headers.includes(h));

    if (missingHeaders.length > 0) {
      throw new Error(`Missing required columns: ${missingHeaders.join(', ')}`);
    }

    const products = [];
    for (let i = 1; i < lines.length; i++) {
      const values = parseLine(lines[i]);
      if (values.length < REQUIRED_HEADERS.length) continue; // Skip empty rows

      const row = {};
      headers.forEach((header, index) => {
        if (ALL_HEADERS.includes(header)) {
          row[header] = values[index] || '';
        }
      });
      products.push(row);
    }

    return { headers, products };
  }, []);

  const parseExcel = useCallback(async (arrayBuffer) => {
    // Dynamically import xlsx only when needed
    const XLSX = await import('xlsx');
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

    if (jsonData.length < 2) throw new Error('Excel file is empty or missing headers');

    const headers = jsonData[0].map(h => String(h).toLowerCase().trim());
    const missingHeaders = REQUIRED_HEADERS.filter(h => !headers.includes(h));

    if (missingHeaders.length > 0) {
      throw new Error(`Missing required columns: ${missingHeaders.join(', ')}`);
    }

    const products = [];
    for (let i = 1; i < jsonData.length; i++) {
      const row = jsonData[i];
      if (!row || row.length === 0) continue;

      const product = {};
      headers.forEach((header, index) => {
        if (ALL_HEADERS.includes(header)) {
          product[header] = row[index] !== undefined ? String(row[index]).trim() : '';
        }
      });
      products.push(product);
    }

    return { headers, products };
  }, []);

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    const isCSV = selectedFile.name.endsWith('.csv');
    const isExcel = selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.xls');

    if (!isCSV && !isExcel) {
      setError('Please upload a CSV (.csv) or Excel (.xlsx) file');
      return;
    }

    setFile(selectedFile);
    setError('');
    setResults(null);

    try {
      let parsed;
      if (isCSV) {
        const text = await selectedFile.text();
        parsed = parseCSV(text);
      } else {
        const arrayBuffer = await selectedFile.arrayBuffer();
        parsed = await parseExcel(arrayBuffer);
      }

      setPreview(parsed.products.slice(0, 5));

      if (parsed.products.length === 0) {
        setError('No valid product rows found in file');
      }
    } catch (err) {
      setError(err.message);
      setPreview([]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setProgress(0);
    setError('');

    try {
      let products;
      const isCSV = file.name.endsWith('.csv');

      if (isCSV) {
        const text = await file.text();
        const parsed = parseCSV(text);
        products = parsed.products;
      } else {
        const arrayBuffer = await file.arrayBuffer();
        const parsed = await parseExcel(arrayBuffer);
        products = parsed.products;
      }

      // Upload in batches of 50 for progress tracking
      const BATCH_SIZE = 50;
      const allResults = { success: [], failed: [] };

      for (let i = 0; i < products.length; i += BATCH_SIZE) {
        const batch = products.slice(i, i + BATCH_SIZE);

        const res = await API.post('/products/bulk-upload', { 
          products: batch,
          duplicateAction 
        });

        allResults.success.push(...res.data.results.success);
        allResults.failed.push(...res.data.results.failed);

        setProgress(Math.min(((i + batch.length) / products.length) * 100, 100));
      }

      setResults(allResults);
      onSuccess?.();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Upload failed');
    } finally {
      setUploading(false);
      setProgress(100);
    }
  };

  const downloadTemplate = () => {
    const headers = 'name,description,price,cost,stock,category,barcode,sku,minStock\n';
    const examples = [
      'Bottle Water,500ml bottled water,2.00,1.00,50,Beverages,123456789,BW001,10\n',
      'Bread,Fresh wheat bread,8.00,5.00,30,Bakery,987654321,BR001,5\n',
      'Coca Cola,330ml can,5.00,3.50,100,Beverages,111222333,CC001,20\n',
      'Cooking Oil (1L),Vegetable oil,18.00,15.00,25,Groceries,444555666,CO001,10\n'
    ].join('');

    const blob = new Blob([headers + examples], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'wag-pos-products-template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const reset = () => {
    setFile(null);
    setPreview([]);
    setResults(null);
    setError('');
    setProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <Modal isOpen={isOpen} onClose={() => { reset(); onClose(); }} title="Bulk Product Upload" maxWidth="3xl">
      <div className="space-y-6">
        {/* Template Download */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
          <FileSpreadsheet className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="font-medium text-blue-800">Download Template</p>
            <p className="text-sm text-blue-600 mt-1">
              Use our CSV template to ensure correct formatting. Supports both CSV and Excel files.
            </p>
            <button
              onClick={downloadTemplate}
              className="mt-2 text-sm font-semibold text-blue-700 hover:text-blue-800 flex items-center gap-1"
            >
              <Download className="w-4 h-4" />
              Download CSV Template
            </button>
          </div>
        </div>

        {/* Duplicate Handling */}
        {!results && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="font-medium text-amber-800 mb-2">Duplicate Product Handling</p>
            <p className="text-sm text-amber-600 mb-3">
              What should happen when a product with the same name already exists?
            </p>
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'skip', label: 'Skip', desc: 'Keep existing, ignore new' },
                { value: 'update', label: 'Update', desc: 'Update price & add stock' },
                { value: 'replace', label: 'Replace', desc: 'Overwrite completely' }
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setDuplicateAction(option.value)}
                  className={`flex-1 min-w-[100px] p-3 rounded-lg border-2 text-left transition-all ${
                    duplicateAction === option.value
                      ? 'border-amber-500 bg-amber-100'
                      : 'border-amber-200 hover:border-amber-300 bg-white'
                  }`}
                >
                  <p className={`font-semibold text-sm ${duplicateAction === option.value ? 'text-amber-800' : 'text-amber-700'}`}>
                    {option.label}
                  </p>
                  <p className="text-xs text-amber-600 mt-0.5">{option.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* File Upload */}
        {!results && (
          <>
            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                file ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:border-blue-400 bg-gray-50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileChange}
                className="hidden"
              />
              <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
              <p className="text-sm text-gray-600 mb-2">
                {file ? file.name : 'Drag & drop your file here, or click to browse'}
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-sm font-semibold text-blue-600 hover:text-blue-700"
              >
                {file ? 'Change File' : 'Select File'}
              </button>
              <p className="text-xs text-gray-400 mt-2">
                Supports: .csv, .xlsx | Required: name, price, stock | Optional: description, cost, category, barcode, sku, minStock
              </p>
            </div>

            {/* Preview */}
            {preview.length > 0 && (
              <div className="bg-gray-50 rounded-xl p-4 overflow-x-auto">
                <p className="text-sm font-semibold text-gray-700 mb-3">
                  Preview (first {preview.length} of {file ? 'many' : '0'} rows)
                </p>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      {Object.keys(preview[0]).map(key => (
                        <th key={key} className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">{key}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((row, i) => (
                      <tr key={i} className="border-b border-gray-100">
                        {Object.values(row).map((val, j) => (
                          <td key={j} className="py-2 px-3 text-gray-700">{val}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Progress Bar */}
            {uploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Uploading...</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            <button
              onClick={handleUpload}
              disabled={!file || uploading || preview.length === 0}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Uploading... {Math.round(progress)}%
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  Upload Products
                </>
              )}
            </button>
          </>
        )}

        {/* Results */}
        {results && (
          <div className="space-y-4">
            <div className={`border rounded-xl p-4 flex items-start gap-3 ${
              results.failed.length === 0 
                ? 'bg-green-50 border-green-200' 
                : 'bg-amber-50 border-amber-200'
            }`}>
              {results.failed.length === 0 ? (
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
              )}
              <div>
                <p className={`font-semibold ${results.failed.length === 0 ? 'text-green-800' : 'text-amber-800'}`}>
                  Upload Complete: {results.success.length} succeeded
                  {results.failed.length > 0 && `, ${results.failed.length} failed`}
                </p>
                {results.success.length > 0 && (
                  <p className="text-sm text-gray-600 mt-1">
                    {results.success.filter(r => r.action === 'created').length} created, {' '}
                    {results.success.filter(r => r.action === 'updated').length} updated, {' '}
                    {results.success.filter(r => r.action === 'skipped').length} skipped
                  </p>
                )}
              </div>
            </div>

            {results.failed.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="font-semibold text-red-800 mb-2">Failed Items:</p>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {results.failed.map((item, i) => (
                    <div key={i} className="text-sm text-red-700 py-1 px-2 bg-red-100/50 rounded">
                      Row {item.row}: <strong>{item.name}</strong> — {item.error}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => { reset(); }}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors"
              >
                Upload Another File
              </button>
              <button
                onClick={() => { reset(); onClose(); }}
                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}