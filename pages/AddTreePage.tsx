import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { db, storage, auth } from '../services/firebase';
import { collection, addDoc, getDocs, GeoPoint, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes } from 'firebase/storage';
import { useNavigate } from 'react-router-dom';
import imageCompression from 'browser-image-compression';
import { Species } from '../types';
import { getAddressFromCoordinates } from '../services/geocoding';
import { identifyTreeSpecies } from '../services/gemini';

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
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [location, setLocation] = useState<{ lat: number, lng: number } | null>(null);
    const [address, setAddress] = useState('');
    const [loading, setLoading] = useState(false);
    const [isIdentifying, setIsIdentifying] = useState(false);
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

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const options = {
                maxSizeMB: 1,
                maxWidthOrHeight: 1080,
                useWebWorker: true,
            };
            try {
                const compressedFile = await imageCompression(file, options);
                setImageFile(compressedFile);
                setImagePreview(URL.createObjectURL(compressedFile));
            } catch (error) {
                console.error('Error compressing image:', error);
                setError('Error al procesar la imagen.');
            }
        }
    };
    
    const handleLocationChange = (lat: number, lng: number, addr: string) => {
        setLocation({ lat, lng });
        setAddress(addr);
    };

    const handleIdentifySpecies = async () => {
        if (!imageFile) {
            setError("Por favor, sube una imagen primero.");
            return;
        }
        setIsIdentifying(true);
        setError(null);
        try {
            const identifiedName = await identifyTreeSpecies(imageFile);
            
            // Normalize names for comparison (simple version: lowercase and trim)
            const normalizedIdentifiedName = identifiedName.toLowerCase().trim();
            const speciesOption = speciesList.find(s => s.commonName.toLowerCase().trim() === normalizedIdentifiedName);

            if (speciesOption) {
                setSpeciesName(speciesOption.commonName);
            } else {
                setSpeciesName('Otra');
                setOtherSpecies(identifiedName);
            }

        } catch (err: any) {
            setError(err.message || 'Error al identificar la especie.');
        } finally {
            setIsIdentifying(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!imageFile || !location || !auth.currentUser) {
            setError('Por favor, completa todos los campos requeridos, incluyendo la foto y la ubicación.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // 1. Upload image to Storage root
            const imageRef = ref(storage, `${Date.now()}-${imageFile.name}`);
            const uploadResult = await uploadBytes(imageRef, imageFile);
            const imagePath = uploadResult.metadata.fullPath;

            // 2. Prepare data for Firestore
            const finalSpeciesName = speciesName === 'Otra' ? otherSpecies : speciesName;
            
            const treeData = {
                speciesName: finalSpeciesName,
                estimatedAge: Number(estimatedAge),
                healthStatus,
                notes,
                imageUrl: imagePath, // Save the fullPath, not a download URL
                isPublic: false, // Set as not public by default
                location: new GeoPoint(location.lat, location.lng),
                address,
                createdBy: auth.currentUser.uid,
                createdAt: serverTimestamp(),
            };
            
            // 3. Save to Firestore
            await addDoc(collection(db, 'trees'), treeData);

            setLoading(false);
            alert('¡Gracias por tu aporte! El árbol ha sido enviado y está pendiente de revisión. Aparecerá en el mapa una vez que sea aprobado.');
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
                
                <div className="flex items-end space-x-2">
                    <div className="flex-grow">
                        <label htmlFor="species" className="block text-sm font-medium text-gray-700">Especie</label>
                        <select id="species" value={speciesName} onChange={e => setSpeciesName(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm rounded-md">
                            <option value="">Selecciona una especie</option>
                            {speciesList.map(s => <option key={s.id} value={s.commonName}>{s.commonName}</option>)}
                            <option value="Otra">Otra...</option>
                        </select>
                    </div>
                    <button 
                        type="button" 
                        onClick={handleIdentifySpecies}
                        disabled={!imageFile || isIdentifying}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400 disabled:cursor-not-allowed whitespace-nowrap"
                        aria-live="polite"
                    >
                        {isIdentifying ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Identificando...
                            </>
                        ) : (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                                Identificar con IA
                            </>
                        )}
                    </button>
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
                    <label className="block text-sm font-medium text-gray-700">Fotografía</label>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                        <div className="space-y-1 text-center">
                            {imagePreview ? (
                                <img src={imagePreview} alt="Vista previa" className="mx-auto h-48 w-auto rounded-md object-cover"/>
                            ) : (
                                <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            )}
                            <div className="flex text-sm text-gray-600">
                                <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-green-600 hover:text-green-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-green-500">
                                    <span>Subir una fotografía</span>
                                    <input id="file-upload" name="file-upload" type="file" accept="image/*" className="sr-only" onChange={handleImageChange} />
                                </label>
                                <p className="pl-1">o arrastrar y soltar</p>
                            </div>
                            <p className="text-xs text-gray-500">PNG, JPG, GIF hasta 10MB (se optimizará)</p>
                        </div>
                    </div>
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