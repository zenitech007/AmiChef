import React, { useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

const ImageUploadModal = ({ isOpen, onClose, onAddItems }) => {
    const [file, setFile] = useState(null);
    const [processedItems, setProcessedItems] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [editIndex, setEditIndex] = useState(null);

    if (!isOpen) return null;

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile && selectedFile.type.startsWith('image/')) {
            setFile(selectedFile);
        } else {
            toast.error("Please upload a valid image file.");
            setFile(null);
        }
    };

    const processImage = async () => {
        if (!file) return;
        setIsLoading(true);
        setProcessedItems([]);

        try {
            const formData = new FormData();
            formData.append('image', file);

            const response = await fetch('/api/process-image', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error("Failed to process image.");
            }

            const data = await response.json();
            if (data?.items?.length > 0) {
                setProcessedItems(data.items);
                toast.success("Image processed!");
            } else {
                toast.error("No items detected.");
            }
        } catch (err) {
            console.error("Error processing image:", err);
            toast.error("Failed to process image.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleAdd = () => {
        onAddItems(processedItems);
        onClose();
        setFile(null);
        setProcessedItems([]);
    };

    const handleEditChange = (index, field, value) => {
        const updatedItems = [...processedItems];
        updatedItems[index][field] = value;
        setProcessedItems(updatedItems);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-xl w-full p-6 relative">
                <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-gray-700">
                    <FaTimes />
                </button>
                <h3 className="text-xl font-bold mb-4">Upload Grocery List Image</h3>
                <div className="space-y-4">
                    <input
                        type="file"
                        onChange={handleFileChange}
                        accept="image/*"
                        className="w-full p-2 border rounded-md"
                    />
                    <button
                        onClick={processImage}
                        disabled={!file || isLoading}
                        className="w-full bg-blue-500 text-white font-bold py-2 px-4 rounded-full hover:bg-blue-600 disabled:opacity-50"
                    >
                        {isLoading ? 'Processing...' : 'Scan Image'}
                    </button>

                    {processedItems.length > 0 && (
                        <div className="mt-4 border-t pt-4">
                            <h4 className="font-semibold mb-2">Items Found:</h4>
                            <ul className="space-y-2 max-h-40 overflow-y-auto pr-2">
                                {processedItems.map((item, index) => (
                                    <li
                                        key={index}
                                        className="flex items-center justify-between bg-gray-50 p-2 rounded"
                                    >
                                        {editIndex === index ? (
                                            <div className="flex flex-col gap-1 w-full">
                                                <input
                                                    className="border rounded p-1 text-sm"
                                                    value={item.name}
                                                    onChange={(e) =>
                                                        handleEditChange(index, 'name', e.target.value)
                                                    }
                                                    placeholder="Item Name"
                                                />
                                                <input
                                                    className="border rounded p-1 text-sm"
                                                    value={item.quantity}
                                                    onChange={(e) =>
                                                        handleEditChange(index, 'quantity', e.target.value)
                                                    }
                                                    placeholder="Quantity"
                                                />
                                                <input
                                                    className="border rounded p-1 text-sm"
                                                    value={item.category}
                                                    onChange={(e) =>
                                                        handleEditChange(index, 'category', e.target.value)
                                                    }
                                                    placeholder="Category"
                                                />
                                                <div className="flex gap-2 mt-1">
                                                    <button
                                                        onClick={() => setEditIndex(null)}
                                                        className="text-sm bg-green-600 text-white px-3 py-1 rounded"
                                                    >
                                                        Save
                                                    </button>
                                                    <button
                                                        onClick={() => setEditIndex(null)}
                                                        className="text-sm text-gray-600 px-2 py-1 hover:underline"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <span>
                                                    {item.name} ({item.quantity})
                                                </span>
                                                <button
                                                    onClick={() => setEditIndex(index)}
                                                    className="text-sm text-blue-600 hover:underline"
                                                >
                                                    Edit
                                                </button>
                                            </>
                                        )}
                                    </li>
                                ))}
                            </ul>
                            <div className="flex justify-between mt-4">
                                <button
                                    onClick={onClose}
                                    className="bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-full hover:bg-gray-400"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAdd}
                                    disabled={processedItems.length === 0}
                                    className="bg-secondary-green text-white font-bold py-2 px-4 rounded-full hover:opacity-90 disabled:opacity-50"
                                >
                                    Add to List
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ImageUploadModal;
