import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { db, auth } from '../services/firebase';
import { collection, addDoc, getDocs, GeoPoint, serverTimestamp } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { Species } from '../types';
import { getAddressFromCoordinates } from '../services/geocoding';

const LocationPicker: React.FC<{ onLocationChange: (lat: number, lng: number, address: string) => void }> = ({ onLocationChange }) => {
    const [position, setPosition] = useState<[number, number] | null>([-30.76, -57.98]);
    const markerRef = useRef(null);

    const MapEvents = () => {
        useMapEvents({
            click(e) {
                setPosition([e.latlng.lat, e.latlng.lng]);
                updateLocation(e.latlng.lat, e.latlng.lng);
            },
        });
        return null;
    };
    
    const updateLocation = async (lat: number, lng: number) => {
        const address = await getAddressFromCoordinates(lat, lng);
        onLocationChange(lat, lng, address);
    }

    return (
        <div className="h-64 w-full rounded-md overflow-hidden z-0">
            <MapContainer center={position || [-30.76, -57.98]} zoom={15} scrollWheelZoom={false}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                {position && <Marker position={position} ref={markerRef}></Marker>}
                <MapEvents />
            </MapContainer>
        </div>
    );
};


const AddTreePage: React.FC = () => {
    const [speciesList, setSpeciesList] = useState<Species[]>([]);
    const [speciesName, setSpeciesName] = useState('');
    const [otherSpecies, setOtherSpecies] = useState('');
    const [estimatedAge, setEstimatedAge] = useState<number>(0);
    const [healthStatus, setHealthStatus] = useState<'Bueno' | 'Regular' | 'Malo'>('Bueno');
    const [notes, setNotes] = useState('');
    const [location, setLocation] = useState<{ lat: number, lng: number } | null>(null);
    const [address, setAddress] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const navigate = useNavigate();

    useEffect(() => {
        const fetchSpecies = async () => {
            const speciesCollection = collection(db, 'species');
            const speciesSnapshot = await getDocs(speciesCollection);
            const speciesData = speciesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Species[];
            setSpeciesList(speciesData);
        };
        fetchSpecies();
    }, []);

    const handleLocationChange = (lat: number, lng: number, addr: string) => {
        setLocation({ lat, lng });
        setAddress(addr);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!location || !auth.currentUser) {
            setError('Por favor, completa todos los campos requeridos, incluyendo la ubicación.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const finalSpeciesName = speciesName === 'Otra' ? otherSpecies : speciesName;
            
            const treeData = {
                speciesName: finalSpeciesName,
                estimatedAge: Number(estimatedAge),
                healthStatus,
                notes,
                location: new GeoPoint(location.lat, location.lng),
                address,
                createdBy: auth.currentUser.uid,
                createdAt: serverTimestamp(),
            };
            
            await addDoc(collection(db, 'trees'), treeData);

            setLoading(false);
            alert('¡Árbol registrado con éxito!');
            navigate('/');

        } catch (err) {
            console.error(err);
            setError('Ocurrió un error al guardar el árbol. Inténtalo de nuevo.');
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Registrar un Nuevo Árbol</h1>
            <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-lg shadow-md">
                
                <div>
                    <label htmlFor="species" className="block text-sm font-medium text-gray-700">Especie</label>
                    <select id="species" value={speciesName} onChange={e => setSpeciesName(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm rounded-md">
                        <option value="">Selecciona una especie</option>
                        {speciesList.map(s => <option key={s.id} value={s.commonName}>{s.commonName}</option>)}
                        <option value="Otra">Otra...</option>
                    </select>
                </div>
                
                {speciesName === 'Otra' && (
                    <div>
                        <label htmlFor="otherSpecies" className="block text-sm font-medium text-gray-700">Nombre de la otra especie</label>
                        <input type="text" id="otherSpecies" value={otherSpecies} onChange={e => setOtherSpecies(e.target.value)} className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md" required />
                    </div>
                )}
                
                <div>
                    <label htmlFor="age" className="block text-sm font-medium text-gray-700">Edad Estimada (años)</label>
                    <input type="number" id="age" value={estimatedAge} onChange={e => setEstimatedAge(Number(e.target.value))} className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md" />
                </div>
                
                <div>
                    <label htmlFor="health" className="block text-sm font-medium text-gray-700">Estado de Salud</label>
                    <select id="health" value={healthStatus} onChange={e => setHealthStatus(e.target.value as any)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm rounded-md">
                        <option>Bueno</option>
                        <option>Regular</option>
                        <option>Malo</option>
                    </select>
                </div>

                <div>
                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Notas Adicionales</label>
                    <textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"></textarea>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Ubicación</label>
                    <p className="text-sm text-gray-500 mb-2">Haz clic en el mapa para marcar la ubicación exacta del árbol.</p>
                    <LocationPicker onLocationChange={handleLocationChange} />
                    {address && <p className="mt-2 text-sm text-gray-600">Dirección detectada: {address}</p>}
                </div>
                
                {error && <p className="text-red-500 text-sm">{error}</p>}
                
                <div className="pt-5">
                    <button type="submit" disabled={loading} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-green-300">
                        {loading ? 'Guardando...' : 'Guardar Árbol'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AddTreePage;
