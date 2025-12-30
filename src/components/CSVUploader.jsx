import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function CSVUploader({ entityName, entitySchema, onComplete }) {
  const [isOpen, setIsOpen] = useState(false);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [extractedData, setExtractedData] = useState(null);
  const [error, setError] = useState(null);
  const [importResult, setImportResult] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.name.endsWith('.csv')) {
      setFile(selectedFile);
      setError(null);
      setExtractedData(null);
      setImportResult(null);
    } else {
      setError('Please select a CSV file');
    }
  };

  const handleUploadAndExtract = async () => {
    if (!file) return;

    try {
      setUploading(true);
      setError(null);

      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      setUploading(false);
      setExtracting(true);

      const result = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url,
        json_schema: entitySchema
      });

      setExtracting(false);

      if (result.status === 'error') {
        setError(result.details || 'Failed to extract data from CSV');
      } else {
        const data = Array.isArray(result.output) ? result.output : [result.output];
        setExtractedData(data);
      }
    } catch (err) {
      setError(err.message || 'Failed to process file');
      setUploading(false);
      setExtracting(false);
    }
  };

  const handleImport = async () => {
    if (!extractedData || extractedData.length === 0) return;

    try {
      setImporting(true);
      setError(null);

      await base44.entities[entityName].bulkCreate(extractedData);

      setImporting(false);
      setImportResult({
        success: true,
        count: extractedData.length
      });

      setTimeout(() => {
        if (onComplete) onComplete();
        handleClose();
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to import data');
      setImporting(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setFile(null);
    setExtractedData(null);
    setError(null);
    setImportResult(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) handleClose();
      else setIsOpen(true);
    }}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="w-4 h-4 mr-2" />
          Import CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Import {entityName} from CSV</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!extractedData && !importResult && (
            <div className="space-y-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-lg p-8 text-center">
                    <FileSpreadsheet className="w-12 h-12 text-slate-400 mb-3" />
                    <p className="text-sm text-slate-600 mb-4">
                      Upload a CSV file to import {entityName} records
                    </p>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleFileChange}
                      className="hidden"
                      id="csv-upload"
                    />
                    <label htmlFor="csv-upload">
                      <Button type="button" asChild>
                        <span>Choose CSV File</span>
                      </Button>
                    </label>
                    {file && (
                      <p className="text-sm text-slate-600 mt-3">
                        Selected: <span className="font-medium">{file.name}</span>
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {file && !extractedData && (
                <div className="flex justify-end">
                  <Button
                    onClick={handleUploadAndExtract}
                    disabled={uploading || extracting}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {uploading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {extracting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {uploading ? 'Uploading...' : extracting ? 'Processing...' : 'Process File'}
                  </Button>
                </div>
              )}
            </div>
          )}

          {extractedData && !importResult && (
            <div className="space-y-4">
              <Card>
                <CardHeader className="border-b">
                  <CardTitle className="text-lg flex items-center justify-between">
                    <span>Preview Data ({extractedData.length} records)</span>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700">
                      Ready to Import
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[400px]">
                    <div className="p-4 space-y-3">
                      {extractedData.map((record, idx) => (
                        <Card key={idx} className="border">
                          <CardContent className="p-3">
                            <div className="flex items-start gap-3">
                              <Badge variant="outline" className="shrink-0">#{idx + 1}</Badge>
                              <div className="flex-1 grid grid-cols-2 gap-2 text-sm">
                                {Object.entries(record).map(([key, value]) => (
                                  <div key={key}>
                                    <span className="font-medium text-slate-600">{key}:</span>{' '}
                                    <span className="text-slate-900">
                                      {Array.isArray(value) ? `[${value.length} items]` : String(value)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={importing}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {importing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {importing ? 'Importing...' : `Import ${extractedData.length} Records`}
                </Button>
              </div>
            </div>
          )}

          {importResult?.success && (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center justify-center text-center py-8">
                  <CheckCircle2 className="w-16 h-16 text-green-600 mb-4" />
                  <h3 className="text-lg font-semibold text-green-900 mb-2">
                    Import Successful!
                  </h3>
                  <p className="text-green-700">
                    Successfully imported {importResult.count} records
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {error && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-red-900">Error</p>
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}