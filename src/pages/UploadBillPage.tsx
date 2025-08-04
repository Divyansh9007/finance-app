import React, { useState } from "react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import {
  Upload,
  Camera,
  FileText,
  Loader,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { useData } from "../contexts/DataContext";
import toast from "react-hot-toast";
import { extractReceiptData, ExtractedReceiptData } from "../utils/gemini";

interface ExtractedData {
  merchantName?: string;
  amount?: number;
  date?: string;
  category?: string;
  description?: string;
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

const UploadBillPage = () => {
  const { accounts, addTransaction } = useData();
  const [uploading, setUploading] = useState(false);
  const [extractedData, setExtractedData] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [extractionError, setExtractionError] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm();

  const handleFileSelect = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
      if (!validTypes.includes(file.type)) {
        toast.error("Please upload a valid image file (JPG, PNG, WEBP)");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size must be less than 10MB");
        return;
      }
      setSelectedFile(file);
      setExtractedData(null);
      setExtractionError(null);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const scanReceiptWithGemini = async (file) => {
    try {
      const data = await extractReceiptData(file);
      return {
        merchantName: data.vendor || undefined,
        amount: data.amount || undefined,
        date: data.date || undefined,
        category: data.category || undefined,
        description: data.items?.join(", ") || data.vendor || undefined,
      };
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Failed to scan receipt"
      );
    }
  };

  const handleExtractData = async () => {
    if (!selectedFile) {
      toast.error("Please select a file first");
      return;
    }
    setUploading(true);
    setExtractionError(null);
    try {
      const data = await scanReceiptWithGemini(selectedFile);
      if (!data || Object.keys(data).length === 0) {
        throw new Error(
          "This doesn't appear to be a valid receipt. Please try uploading a clearer image."
        );
      }
      setExtractedData(data);
      if (data.amount && data.amount > 0) {
        setValue("amount", data.amount);
      }
      if (data.date) {
        const dateObj = new Date(data.date);
        if (!isNaN(dateObj.getTime())) {
          setValue("date", dateObj.toISOString().split("T")[0]);
        }
      }
      if (data.category) {
        const categoryMapping = {
          groceries: "Food & Dining",
          food: "Food & Dining",
          transportation: "Transportation",
          shopping: "Shopping",
          entertainment: "Entertainment",
          utilities: "Bills & Utilities",
          bills: "Bills & Utilities",
          healthcare: "Healthcare",
          education: "Education",
          travel: "Travel",
          "other-expense": "Others",
          housing: "Bills & Utilities",
          insurance: "Bills & Utilities",
          gifts: "Shopping",
          personal: "Others",
        };
        const mappedCategory =
          categoryMapping[data.category.toLowerCase()] || data.category;
        setValue("category", mappedCategory);
      }
      if (data.description || data.merchantName) {
        const description = data.description || data.merchantName || "";
        setValue("description", description);
      }
      toast.success("Receipt data extracted successfully!");
    } catch (error) {
      console.error("Receipt scanning error:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to extract data from receipt";
      setExtractionError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      await addTransaction({
        ...data,
        type: "expense",
        amount: Number(data.amount),
        date: new Date(data.date),
      });
      reset();
      setSelectedFile(null);
      setPreview(null);
      setExtractedData(null);
      setExtractionError(null);
      toast.success("Transaction added successfully!");
    } catch (error) {
      // Error handled by context
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setPreview(null);
    setExtractedData(null);
    setExtractionError(null);
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
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      clearFile();
                    }}
                    className="text-sm text-red-600 hover:text-red-700"
                  >
                    Remove file
                  </button>
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
                      Supports JPG, PNG, WEBP files up to 10MB
                    </p>
                  </div>
                </div>
              )}

              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
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

          {extractionError && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 border border-red-200 p-6 rounded-2xl"
            >
              <div className="flex items-center mb-2">
                <AlertCircle size={20} className="text-red-600 mr-2" />
                <h3 className="text-lg font-bold text-red-800">
                  Extraction Failed
                </h3>
              </div>
              <p className="text-red-700 text-sm mb-4">{extractionError}</p>
              <div className="text-sm text-red-600">
                <p className="font-medium mb-2">Tips for better results:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Ensure the receipt is clearly visible and well-lit</li>
                  <li>Make sure all text is readable</li>
                  <li>Avoid blurry or tilted images</li>
                  <li>Try uploading a higher quality image</li>
                </ul>
              </div>
            </motion.div>
          )}

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

              <div className="grid grid-cols-1 gap-4 text-sm">
                {extractedData.merchantName && (
                  <div>
                    <p className="text-green-700 font-medium">Merchant:</p>
                    <p className="text-green-800">
                      {extractedData.merchantName}
                    </p>
                  </div>
                )}
                {extractedData.amount && (
                  <div>
                    <p className="text-green-700 font-medium">Amount:</p>
                    <p className="text-green-800">
                      ₹{extractedData.amount.toLocaleString()}
                    </p>
                  </div>
                )}
                {extractedData.date && (
                  <div>
                    <p className="text-green-700 font-medium">Date:</p>
                    <p className="text-green-800">
                      {new Date(extractedData.date).toLocaleDateString()}
                    </p>
                  </div>
                )}
                {extractedData.category && (
                  <div>
                    <p className="text-green-700 font-medium">Category:</p>
                    <p className="text-green-800">{extractedData.category}</p>
                  </div>
                )}
                {extractedData.description && (
                  <div>
                    <p className="text-green-700 font-medium">Description:</p>
                    <p className="text-green-800">
                      {extractedData.description}
                    </p>
                  </div>
                )}
              </div>

              <p className="text-sm text-green-700 mt-4">
                Review and edit the transaction details on the right, then save.
              </p>
            </motion.div>
          )}
        </div>

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

        <div className="mt-4 p-4 bg-blue-100 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Pro tip:</strong> For best results, ensure your receipt is
            well-lit, clearly visible, and the text is readable. The AI works
            best with high-quality, unblurred images.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default UploadBillPage;
