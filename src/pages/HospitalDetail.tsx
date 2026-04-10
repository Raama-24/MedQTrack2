import { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { mockHospitals, mockBeds } from '../lib/mockData';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const HospitalDetail = () => {
    const { id } = useParams<{ id: string }>();
    
    const hospital = useMemo(() => 
        mockHospitals.find(h => h.id === id),
    [id]);

    const hospitalBeds = useMemo(() => 
        mockBeds.filter(b => b.hospitalId === id),
    [id]);

    if (!hospital) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
                <h2 className="text-2xl font-bold text-gray-900">Hospital not found</h2>
                <Link to="/hospitals" className="mt-4 text-blue-600 hover:underline">Return to Hospital List</Link>
            </div>
        );
    }

    const availableCount = hospitalBeds.filter(b => b.status === 'available').length;
    const occupiedCount = hospitalBeds.filter(b => b.status === 'occupied').length;
    const cleaningCount = hospitalBeds.filter(b => b.status === 'cleaning').length;

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

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Navbar />

            <main className="flex-grow">
                {/* Hero Header */}
                <div className="relative h-64 md:h-80 bg-gray-900">
                    <img 
                        src={hospital.image} 
                        alt={hospital.name}
                        className="w-full h-full object-cover opacity-60"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-8 container mx-auto">
                        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6">
                            <div>
                                <Link to="/hospitals" className="text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-2 mb-4 font-semibold">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                                    </svg>
                                    Back to Hospitals
                                </Link>
                                <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">{hospital.name}</h1>
                                <p className="text-gray-300 mt-2 flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    {hospital.address}
                                </p>
                            </div>
                            <div className="flex gap-4">
                                <a href={`tel:${hospital.phone}`} className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-6 py-3 rounded-xl font-bold hover:bg-white/20 transition-all flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                    </svg>
                                    Call Now
                                </a>
                                <Link to="/book" className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/30">
                                    Book OPD
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="container mx-auto px-4 py-12">
                    <div className="max-w-6xl mx-auto space-y-12">
                        
                        {/* Summary Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                                <p className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Total Beds</p>
                                <p className="text-4xl font-bold text-gray-900 mt-1">{hospitalBeds.length}</p>
                            </div>
                            <div className="bg-green-50 p-6 rounded-3xl border border-green-100 shadow-sm">
                                <p className="text-sm font-semibold text-green-600 uppercase tracking-wider">Available</p>
                                <p className="text-4xl font-bold text-green-700 mt-1">{availableCount}</p>
                            </div>
                            <div className="bg-red-50 p-6 rounded-3xl border border-red-100 shadow-sm">
                                <p className="text-sm font-semibold text-red-600 uppercase tracking-wider">Occupied</p>
                                <p className="text-4xl font-bold text-red-700 mt-1">{occupiedCount}</p>
                            </div>
                            <div className="bg-yellow-50 p-6 rounded-3xl border border-yellow-100 shadow-sm">
                                <p className="text-sm font-semibold text-yellow-600 uppercase tracking-wider">Cleaning</p>
                                <p className="text-4xl font-bold text-yellow-700 mt-1">{cleaningCount}</p>
                            </div>
                        </div>

                        {/* Bed Grid */}
                        <div>
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-2xl font-bold text-gray-900">Real-time Bed Status</h2>
                                <div className="flex items-center gap-4 text-sm font-semibold">
                                    <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-green-500"></span> Available</div>
                                    <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-500"></span> Occupied</div>
                                    <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-yellow-500"></span> Cleaning</div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                {hospitalBeds.map(bed => (
                                    <div key={bed.bedId} className={`p-4 rounded-2xl border transition-all ${getStatusColor(bed.status)}`}>
                                        <div className="flex flex-col h-full">
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="text-xs font-bold uppercase tracking-widest opacity-60">{bed.ward}</span>
                                                <div className={`w-2 h-2 rounded-full ${getStatusDotColor(bed.status)} animate-pulse shadow-[0_0_8px_rgba(0,0,0,0.2)]`} />
                                            </div>
                                            <p className="text-lg font-bold">{bed.bedId}</p>
                                            <p className="mt-auto pt-2 text-xs font-semibold capitalize opacity-70 border-t border-black/5">{bed.status}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default HospitalDetail;
