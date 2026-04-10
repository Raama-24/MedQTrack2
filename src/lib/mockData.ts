import { Hospital } from '../types/hospital';
import { Bed } from '../types/bed';

export const mockHospitals: Hospital[] = [
    {
        id: 'hosp-1',
        name: 'City General Hospital',
        address: '123 Health Ave, Metro City',
        phone: '(555) 123-4567',
        image: 'https://images.unsplash.com/photo-1587350859728-117622bc937e?auto=format&fit=crop&q=80&w=800',
        totalBeds: 150,
        availableBeds: 45,
        rating: 4.8
    },
    {
        id: 'hosp-2',
        name: 'St. Mary\'s Specialized Clinic',
        address: '456 Wellness Blvd, Metro City',
        phone: '(555) 987-6543',
        image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=800',
        totalBeds: 80,
        availableBeds: 12,
        rating: 4.5
    },
    {
        id: 'hosp-3',
        name: 'Unity Community Hospital',
        address: '789 Care Lane, Metro City',
        phone: '(555) 456-7890',
        image: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=800',
        totalBeds: 120,
        availableBeds: 28,
        rating: 4.2
    }
];

export const mockBeds: Bed[] = [
    // Beds for Hospital 1
    { bedId: 'B1-101', hospitalId: 'hosp-1', ward: 'ICU', status: 'available', lastUpdated: new Date() },
    { bedId: 'B1-102', hospitalId: 'hosp-1', ward: 'ICU', status: 'occupied', patientName: 'John Doe', lastUpdated: new Date() },
    { bedId: 'B1-201', hospitalId: 'hosp-1', ward: 'General', status: 'available', lastUpdated: new Date() },
    { bedId: 'B1-202', hospitalId: 'hosp-1', ward: 'General', status: 'cleaning', lastUpdated: new Date() },
    { bedId: 'B1-301', hospitalId: 'hosp-1', ward: 'Private', status: 'available', lastUpdated: new Date() },
    
    // Beds for Hospital 2
    { bedId: 'B2-101', hospitalId: 'hosp-2', ward: 'ICU', status: 'occupied', patientName: 'Jane Smith', lastUpdated: new Date() },
    { bedId: 'B2-102', hospitalId: 'hosp-2', ward: 'ICU', status: 'available', lastUpdated: new Date() },
    { bedId: 'B2-201', hospitalId: 'hosp-2', ward: 'General', status: 'available', lastUpdated: new Date() },
    
    // Beds for Hospital 3
    { bedId: 'B3-101', hospitalId: 'hosp-3', ward: 'General', status: 'available', lastUpdated: new Date() },
    { bedId: 'B3-102', hospitalId: 'hosp-3', ward: 'General', status: 'occupied', patientName: 'Bob Brown', lastUpdated: new Date() }
];
