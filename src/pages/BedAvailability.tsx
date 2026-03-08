import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { Bed } from '../types/bed';
import AddBedsModal from '../components/AddBedsModal';
import AssignBedModal from '../components/AssignBedModal';

const BedAvailability = () => {
    const [beds, setBeds] = useState<Bed[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterWard, setFilterWard] = useState<string>('All');
    const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    // Assign Bed Modal State
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [selectedBed, setSelectedBed] = useState<Bed | null>(null);

    useEffect(() => {
        const q = query(collection(db, 'beds'));
        const unsubscribe = onSnapshot(
            q,
            (querySnapshot) => {
                const bedsData: Bed[] = [];
                querySnapshot.forEach((doc) => {
                    bedsData.push({ ...doc.data(), bedId: doc.id } as Bed);
                });
                setBeds(bedsData);
                setLoading(false);
            },
            (error) => {
                console.error("Error fetching bed data:", error);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, []);

    const filteredBeds = filterWard === 'All' ? beds : beds.filter(bed => bed.ward === filterWard);

    const totalBeds = beds.length;
    const availableBeds = beds.filter(b => b.status === 'available').length;
    const occupiedBeds = beds.filter(b => b.status === 'occupied').length;
    const cleaningBeds = beds.filter(b => b.status === 'cleaning').length;

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'available': return 'bg-green-100 text-green-800 border-green-200';
            case 'occupied': return 'bg-red-100 text-red-800 border-red-200';
            case 'cleaning': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getStatusDotColor = (status: string) => {
        switch (status) {
            case 'available': return 'bg-green-500';
            case 'occupied': return 'bg-red-500';
            case 'cleaning': return 'bg-yellow-500';
            default: return 'bg-gray-500';
        }
    };

    const handleMarkCleaning = async (bedId: string) => {
        try {
            const bedRef = doc(db, 'beds', bedId);
            await updateDoc(bedRef, {
                status: 'cleaning',
                patientName: '',
                lastUpdated: serverTimestamp()
            });
        } catch (error) {
            console.error("Error marking bed as cleaning:", error);
            alert("Failed to update bed status.");
        }
    };

    const handleMarkAvailable = async (bedId: string) => {
        try {
            const bedRef = doc(db, 'beds', bedId);
            await updateDoc(bedRef, {
                status: 'available',
                patientName: '',
                lastUpdated: serverTimestamp()
            });
        } catch (error) {
            console.error("Error marking bed as available:", error);
            alert("Failed to update bed status.");
        }
    };

    const openAssignModal = (bed: Bed) => {
        setSelectedBed(bed);
        setIsAssignModalOpen(true);
    };

    const formatDate = (timestamp: any) => {
        if (!timestamp) return 'N/A';
        // Handle Firestore timestamp
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleString();
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6 md:p-8">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Bed Availability</h1>
                        <p className="text-gray-500 mt-1">Monitor real-time bed status across all wards</p>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center justify-between transition-all hover:shadow-md">
                        <div>
                            <p className="text-sm font-medium text-gray-500 mb-1">Total Beds</p>
                            <h3 className="text-3xl font-bold text-gray-900">{totalBeds}</h3>
                        </div>
                        <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center justify-between transition-all hover:shadow-md">
                        <div>
                            <p className="text-sm font-medium text-gray-500 mb-1">Available</p>
                            <h3 className="text-3xl font-bold text-green-600">{availableBeds}</h3>
                        </div>
                        <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center text-green-600">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center justify-between transition-all hover:shadow-md">
                        <div>
                            <p className="text-sm font-medium text-gray-500 mb-1">Occupied</p>
                            <h3 className="text-3xl font-bold text-red-600">{occupiedBeds}</h3>
                        </div>
                        <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center text-red-600">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center justify-between transition-all hover:shadow-md">
                        <div>
                            <p className="text-sm font-medium text-gray-500 mb-1">Cleaning</p>
                            <h3 className="text-3xl font-bold text-yellow-600">{cleaningBeds}</h3>
                        </div>
                        <div className="w-12 h-12 bg-yellow-50 rounded-full flex items-center justify-center text-yellow-600">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Controls Section */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <label htmlFor="wardFilter" className="text-sm font-medium text-gray-700 whitespace-nowrap">Filter by Ward:</label>
                        <select
                            id="wardFilter"
                            value={filterWard}
                            onChange={(e) => setFilterWard(e.target.value)}
                            className="pl-3 pr-10 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 hover:bg-white transition-colors appearance-none cursor-pointer w-full sm:w-auto"
                        >
                            <option value="All">All Wards</option>
                            <option value="ICU">ICU</option>
                            <option value="General">General</option>
                            <option value="Private">Private</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm shadow-blue-600/20 flex items-center gap-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Add Beds
                        </button>

                        <div className="flex bg-gray-100 p-1 rounded-lg">
                            <button
                                onClick={() => setViewMode('table')}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'table' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Table View
                            </button>
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Grid View
                            </button>
                        </div>
                    </div>
                </div>

                {/* Content Section */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-gray-100 shadow-sm min-h-[400px]">
                        <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
                        <p className="mt-4 text-gray-500 font-medium">Loading bed data...</p>
                    </div>
                ) : beds.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-gray-100 shadow-sm min-h-[400px] text-center">
                        <div className="w-16 h-16 bg-gray-50 flex items-center justify-center rounded-full mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">No beds found</h3>
                        <p className="text-gray-500 mt-1 max-w-sm">There are no beds currently registered in the database. Please add beds to start monitoring.</p>
                    </div>
                ) : filteredBeds.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-gray-100 shadow-sm min-h-[400px]">
                        <p className="text-gray-500 font-medium text-lg">No beds found in {filterWard} ward.</p>
                        <button
                            onClick={() => setFilterWard('All')}
                            className="mt-4 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg font-medium hover:bg-blue-100 transition-colors"
                        >
                            Clear Filter
                        </button>
                    </div>
                ) : viewMode === 'table' ? (
                    /* Table View */
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50/50 border-b border-gray-100 text-sm font-semibold text-gray-600">
                                        <th className="p-4 pl-6 whitespace-nowrap">Bed ID</th>
                                        <th className="p-4 whitespace-nowrap">Ward</th>
                                        <th className="p-4 whitespace-nowrap">Status</th>
                                        <th className="p-4 whitespace-nowrap">Patient Name</th>
                                        <th className="p-4 whitespace-nowrap">Last Updated</th>
                                        <th className="p-4 pr-6 whitespace-nowrap text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {filteredBeds.map((bed) => (
                                        <tr key={bed.bedId} className="hover:bg-gray-50/50 transition-colors group">
                                            <td className="p-4 pl-6">
                                                <span className="font-medium text-gray-900">{bed.bedId}</span>
                                            </td>
                                            <td className="p-4 text-gray-600">
                                                {bed.ward}
                                            </td>
                                            <td className="p-4">
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(bed.status)}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${getStatusDotColor(bed.status)}`}></span>
                                                    {bed.status.charAt(0).toUpperCase() + bed.status.slice(1)}
                                                </span>
                                            </td>
                                            <td className="p-4 text-gray-600">
                                                {bed.patientName ? (
                                                    <span className="flex items-center gap-2">
                                                        <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
                                                            {bed.patientName.charAt(0)}
                                                        </span>
                                                        {bed.patientName}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400 italic">Not Assigned</span>
                                                )}
                                            </td>
                                            <td className="p-4 text-sm text-gray-500 whitespace-nowrap">
                                                {formatDate(bed.lastUpdated)}
                                            </td>
                                            <td className="p-4 pr-6 whitespace-nowrap text-right space-x-2">
                                                <button
                                                    onClick={() => openAssignModal(bed)}
                                                    disabled={bed.status === 'occupied'}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${bed.status === 'occupied'
                                                            ? 'bg-gray-50 text-gray-400 border-gray-100 cursor-not-allowed'
                                                            : 'bg-white text-blue-600 border-blue-200 hover:bg-blue-50'
                                                        }`}
                                                >
                                                    Assign Bed
                                                </button>

                                                {bed.status !== 'cleaning' && (
                                                    <button
                                                        onClick={() => handleMarkCleaning(bed.bedId)}
                                                        className="px-3 py-1.5 bg-white text-yellow-600 border border-yellow-200 rounded-lg text-xs font-medium hover:bg-yellow-50 transition-colors"
                                                    >
                                                        Mark Cleaning
                                                    </button>
                                                )}

                                                {bed.status !== 'available' && (
                                                    <button
                                                        onClick={() => handleMarkAvailable(bed.bedId)}
                                                        className="px-3 py-1.5 bg-white text-green-600 border border-green-200 rounded-lg text-xs font-medium hover:bg-green-50 transition-colors"
                                                    >
                                                        Mark Available
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    /* Grid View */
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {filteredBeds.map((bed) => (
                            <div key={bed.bedId} className="bg-white border text-left border-gray-100 rounded-xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col h-full">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <span className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1 block">{bed.ward}</span>
                                        <h3 className="text-xl font-bold text-gray-900">{bed.bedId}</h3>
                                    </div>
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusColor(bed.status)}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${getStatusDotColor(bed.status)}`}></span>
                                        {bed.status.charAt(0).toUpperCase() + bed.status.slice(1)}
                                    </span>
                                </div>

                                <div className="mt-auto pt-4 border-t border-gray-50 space-y-3">
                                    <div>
                                        <p className="text-xs text-gray-500 mb-1">Patient</p>
                                        <p className="text-sm font-medium text-gray-900">
                                            {bed.patientName || <span className="text-gray-400 italic">Not Assigned</span>}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 mb-1">Last Updated</p>
                                        <p className="text-xs text-gray-600">
                                            {formatDate(bed.lastUpdated)}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-4 pt-4 border-t border-gray-50 flex flex-wrap gap-2">
                                    <button
                                        onClick={() => openAssignModal(bed)}
                                        disabled={bed.status === 'occupied'}
                                        className={`flex-1 min-w-[100px] px-3 py-2 rounded-lg text-xs font-medium transition-colors border text-center ${bed.status === 'occupied'
                                                ? 'bg-gray-50 text-gray-400 border-gray-100 cursor-not-allowed'
                                                : 'bg-white text-blue-600 border-blue-200 hover:bg-blue-50'
                                            }`}
                                    >
                                        Assign Bed
                                    </button>

                                    {bed.status !== 'cleaning' && (
                                        <button
                                            onClick={() => handleMarkCleaning(bed.bedId)}
                                            className="flex-1 min-w-[100px] px-3 py-2 bg-white text-yellow-600 border border-yellow-200 rounded-lg text-xs font-medium hover:bg-yellow-50 transition-colors text-center"
                                        >
                                            Mark Cleaning
                                        </button>
                                    )}

                                    {bed.status !== 'available' && (
                                        <button
                                            onClick={() => handleMarkAvailable(bed.bedId)}
                                            className="flex-1 min-w-[100px] px-3 py-2 bg-white text-green-600 border border-green-200 rounded-lg text-xs font-medium hover:bg-green-50 transition-colors text-center"
                                        >
                                            Mark Available
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modals */}
            <AddBedsModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
            />
            <AssignBedModal
                isOpen={isAssignModalOpen}
                onClose={() => setIsAssignModalOpen(false)}
                bed={selectedBed}
            />
        </div>
    );
};

export default BedAvailability;
