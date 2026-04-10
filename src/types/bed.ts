export interface Bed {
    bedId: string;
    hospitalId: string;
    ward: string;
    status: 'available' | 'occupied' | 'cleaning';
    patientName?: string;
    lastUpdated: any; // Firestore Timestamp
}
