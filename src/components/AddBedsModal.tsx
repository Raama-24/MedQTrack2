import React, { useState } from 'react';
import { collection, doc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

interface AddBedsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const AddBedsModal: React.FC<AddBedsModalProps> = ({ isOpen, onClose }) => {
    const [ward, setWard] = useState('ICU');
    const [numBeds, setNumBeds] = useState<number | ''>(1);
    const [prefix, setPrefix] = useState('ICU');
    const [startNum, setStartNum] = useState<number | ''>(1);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        // Validation
        const parsedNumBeds = Number(numBeds);
        const parsedStartNum = Number(startNum);

        if (!parsedNumBeds || parsedNumBeds <= 0) {
            setError('Number of beds must be greater than 0');
            return;
        }

        if (!prefix.trim()) {
            setError('Prefix cannot be empty');
            return;
        }

        if (!parsedStartNum || parsedStartNum <= 0) {
            setError('Starting number must be positive');
            return;
        }

        setIsSubmitting(true);

        try {
            const batch = writeBatch(db);
            const bedsRef = collection(db, 'beds');

            for (let i = 0; i < parsedNumBeds; i++) {
                // Generate bed ID: e.g., ICU-01
                const currentNum = parsedStartNum + i;
                const bedIdNumber = currentNum.toString().padStart(2, '0');
                const generatedBedId = `${prefix.trim()}-${bedIdNumber}`;

                // Create a new document ref (auto-generates a unique Firestore ID)
                const newBedRef = doc(bedsRef);

                batch.set(newBedRef, {
                    bedId: generatedBedId,
                    ward: ward,
                    status: 'available',
                    patientName: '',
                    lastUpdated: serverTimestamp()
                });
            }

            await batch.commit();

            setSuccess(`Successfully added ${parsedNumBeds} beds!`);

            // Reset form and close after brief delay to show success message
            setTimeout(() => {
                handleClose();
            }, 1500);

        } catch (err: any) {
            console.error("Error adding beds:", err);
            setError('Failed to add beds. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        // Clear form
        setWard('ICU');
        setNumBeds(1);
        setPrefix('ICU');
        setStartNum(1);
        setError('');
        setSuccess('');
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 text-left">
            <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-900">Add Beds in Batch</h2>
                    <button
                        onClick={handleClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-lg hover:bg-gray-50"
                        disabled={isSubmitting}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">

                    {/* Form Level Messages */}
                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-medium border border-red-100 flex items-start gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="bg-green-50 text-green-700 p-3 rounded-lg text-sm font-medium border border-green-200 flex items-start gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {success}
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <label htmlFor="ward" className="block text-sm font-medium text-gray-700">Ward</label>
                        <select
                            id="ward"
                            value={ward}
                            onChange={(e) => {
                                setWard(e.target.value);
                                // Auto-update prefix suggestion based on ward
                                if (e.target.value === 'ICU') setPrefix('ICU');
                                if (e.target.value === 'General') setPrefix('GEN');
                                if (e.target.value === 'Private') setPrefix('PRI');
                                if (e.target.value === 'Emergency') setPrefix('EMG');
                            }}
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
                            disabled={isSubmitting}
                        >
                            <option value="ICU">ICU</option>
                            <option value="General">General</option>
                            <option value="Private">Private</option>
                            <option value="Emergency">Emergency</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label htmlFor="numBeds" className="block text-sm font-medium text-gray-700">Number of Beds</label>
                            <input
                                type="number"
                                id="numBeds"
                                min="1"
                                value={numBeds}
                                onChange={(e) => setNumBeds(e.target.value === '' ? '' : Number(e.target.value))}
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
                                placeholder="e.g. 5"
                                disabled={isSubmitting}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label htmlFor="startNum" className="block text-sm font-medium text-gray-700">Starting Number</label>
                            <input
                                type="number"
                                id="startNum"
                                min="1"
                                value={startNum}
                                onChange={(e) => setStartNum(e.target.value === '' ? '' : Number(e.target.value))}
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
                                placeholder="e.g. 1"
                                disabled={isSubmitting}
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label htmlFor="prefix" className="block text-sm font-medium text-gray-700">Bed ID Prefix</label>
                        <input
                            type="text"
                            id="prefix"
                            value={prefix}
                            onChange={(e) => setPrefix(e.target.value)}
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
                            placeholder="e.g. ICU"
                            disabled={isSubmitting}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Preview: <span className="font-semibold text-gray-700">{prefix || '[prefix]'}-{String(startNum || 1).padStart(2, '0')}</span> to <span className="font-semibold text-gray-700">{prefix || '[prefix]'}-{String(Number(startNum || 1) + Number(numBeds || 1) - 1).padStart(2, '0')}</span>
                        </p>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="flex-1 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-200"
                            disabled={isSubmitting}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 shadow-sm shadow-blue-600/20 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex justify-center items-center"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Creating...
                                </>
                            ) : (
                                'Create Beds'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default AddBedsModal;
