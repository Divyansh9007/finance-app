import React, { useState } from "react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { Upload, Camera, FileText, Loader, CheckCircle } from "lucide-react";
import { useData } from "../contexts/DataContext";
import toast from "react-hot-toast";

interface ExtractedData {
  vendor?: string;
  amount?: number;
  date?: string;
  category?: string;
}

interface TransactionFormData {
  accountId: string;
  type: "expense";
  amount: number;
  category: string;
  description: string;
  date: string;
  notes?: string;
}

const UploadBillPage: React.FC = () => {
  const { accounts, addTransaction } = useData();
  const [uploading, setUploading] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(
    null
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<TransactionFormData>();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const extractDataFromReceipt = async (file: File): Promise<ExtractedData> => {
    // Simulate AI extraction process
    // In a real implementation, you would:
    // 1. Convert image to base64
    // 2. Send to Gemini API
    // 3. Parse the response

    // For demo purposes, we'll simulate the extraction
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Mock extracted data
    const mockData: ExtractedData = {
      vendor: "Sample Store",
      amount: Math.floor(Math.random() * 1000) + 100,
      date: new Date().toISOString().split("T")[0],
      category: "Shopping",
    };

    return mockData;
  };

  const handleExtractData = async () => {
    if (!selectedFile) {
      toast.error("Please select a file first");
      return;
    }

    setUploading(true);
    try {
      const data = await extractDataFromReceipt(selectedFile);
      setExtractedData(data);

      // Pre-fill the form with extracted data
      if (data.amount) setValue("amount", data.amount);
      if (data.date) setValue("date", data.date);
      if (data.category) setValue("category", data.category);
      if (data.vendor) setValue("description", data.vendor);

      toast.success("Receipt data extracted successfully!");
    } catch (error) {
      toast.error("Failed to extract data from receipt");
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (data: TransactionFormData) => {
    try {
      await addTransaction({
        ...data,
        type: "expense",
        amount: Number(data.amount),
        date: new Date(data.date),
      });

      // Reset form and states
      reset();
      setSelectedFile(null);
      setPreview(null);
      setExtractedData(null);

      toast.success("Transaction added successfully!");
    } catch (error) {
      // Error handled by context
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Upload Bill</h1>
        <p className="text-gray-600">
          Upload a receipt or bill image and let AI extract the transaction
          details automatically
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upload Section */}
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-6 rounded-2xl shadow-sm border"
          >
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Step 1: Upload Receipt
            </h2>

            <label className="relative block border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer">
              {preview ? (
                <div className="space-y-4">
                  <img
                    src={preview}
                    alt="Receipt preview"
                    className="max-w-full h-48 object-contain mx-auto rounded-lg"
                  />
                  <p className="text-sm text-gray-600">{selectedFile?.name}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                    <Upload size={32} className="text-gray-400" />
                  </div>
                  <div>
                    <p className="text-gray-600 mb-2">
                      Drag and drop your receipt, or click to browse
                    </p>
                    <p className="text-sm text-gray-500">
                      Supports JPG, PNG, PDF files up to 10MB
                    </p>
                  </div>
                </div>
              )}

              <input
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileSelect}
                className="absolute inset-0 w-full h-full opacity-0"
              />
            </label>

            {selectedFile && (
              <div className="mt-4 flex justify-center">
                <button
                  onClick={handleExtractData}
                  disabled={uploading}
                  className="bg-black text-white px-6 py-3 rounded-lg font-bold hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {uploading ? (
                    <>
                      <Loader size={20} className="mr-2 animate-spin" />
                      Extracting Data...
                    </>
                  ) : (
                    <>
                      <Camera size={20} className="mr-2" />
                      Extract Data with AI
                    </>
                  )}
                </button>
              </div>
            )}
          </motion.div>

          {/* Extracted Data Preview */}
          {extractedData && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-green-50 border border-green-200 p-6 rounded-2xl"
            >
              <div className="flex items-center mb-4">
                <CheckCircle size={20} className="text-green-600 mr-2" />
                <h3 className="text-lg font-bold text-green-800">
                  Data Extracted Successfully!
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-green-700 font-medium">Vendor:</p>
                  <p className="text-green-800">
                    {extractedData.vendor || "Not detected"}
                  </p>
                </div>
                <div>
                  <p className="text-green-700 font-medium">Amount:</p>
                  <p className="text-green-800">
                    ₹{extractedData.amount || "Not detected"}
                  </p>
                </div>
                <div>
                  <p className="text-green-700 font-medium">Date:</p>
                  <p className="text-green-800">
                    {extractedData.date || "Not detected"}
                  </p>
                </div>
                <div>
                  <p className="text-green-700 font-medium">Category:</p>
                  <p className="text-green-800">
                    {extractedData.category || "Not detected"}
                  </p>
                </div>
              </div>

              <p className="text-sm text-green-700 mt-4">
                Review and edit the transaction details on the right, then save.
              </p>
            </motion.div>
          )}
        </div>

        {/* Form Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-6 rounded-2xl shadow-sm border"
        >
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            Step 2: Review & Save Transaction
          </h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Account
              </label>
              <select
                {...register("accountId", { required: "Account is required" })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Account</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name} - ₹{account.balance.toLocaleString()}
                  </option>
                ))}
              </select>
              {errors.accountId && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.accountId.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount (₹)
              </label>
              <input
                {...register("amount", {
                  required: "Amount is required",
                  min: { value: 0.01, message: "Amount must be positive" },
                })}
                type="number"
                step="0.01"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
              />
              {errors.amount && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.amount.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                {...register("category", { required: "Category is required" })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Category</option>
                <option value="Food & Dining">Food & Dining</option>
                <option value="Transportation">Transportation</option>
                <option value="Shopping">Shopping</option>
                <option value="Entertainment">Entertainment</option>
                <option value="Bills & Utilities">Bills & Utilities</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Education">Education</option>
                <option value="Travel">Travel</option>
                <option value="Others">Others</option>
              </select>
              {errors.category && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.category.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <input
                {...register("description", {
                  required: "Description is required",
                })}
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter description"
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.description.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date
              </label>
              <input
                {...register("date", { required: "Date is required" })}
                type="date"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                defaultValue={new Date().toISOString().split("T")[0]}
              />
              {errors.date && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.date.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes (Optional)
              </label>
              <textarea
                {...register("notes")}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Add any additional notes..."
              />
            </div>

            <button
              type="submit"
              className="w-full bg-black text-white py-3 rounded-lg font-bold hover:bg-gray-800 transition-colors flex items-center justify-center"
            >
              <FileText size={20} className="mr-2" />
              Save Transaction
            </button>
          </form>
        </motion.div>
      </div>

      {/* Instructions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-8 bg-blue-50 border border-blue-200 p-6 rounded-2xl"
      >
        <h3 className="text-lg font-bold text-blue-800 mb-4">How it works:</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-blue-700">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
              1
            </div>
            <div>
              <p className="font-medium">Upload Receipt</p>
              <p>Take a photo or upload an image of your bill/receipt</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
              2
            </div>
            <div>
              <p className="font-medium">AI Extraction</p>
              <p>
                Our AI automatically extracts vendor, amount, date, and category
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
              3
            </div>
            <div>
              <p className="font-medium">Review & Save</p>
              <p>
                Review the details, make any edits, and save to your
                transactions
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default UploadBillPage;
