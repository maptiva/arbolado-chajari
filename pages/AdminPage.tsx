import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, DocumentData } from 'firebase/firestore';
import { getDownloadURL, ref } from 'firebase/storage';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { db, storage } from '../services/firebase';
import { Tree } from '../types';

// Componente para mostrar la imagen del árbol obteniendo la URL de descarga
const TreeImage: React.FC<{ imagePath: string }> = ({ imagePath }) => {
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchImageUrl = async () => {
            try {
                const url = await getDownloadURL(ref(storage, imagePath));
                setImageUrl(url);
            } catch (error) {
                console.error("Error fetching image URL:", error);
                // Puedes poner una imagen de placeholder en caso de error
                setImageUrl('https://via.placeholder.com/150');
            }
            setLoading(false);
        };

        if (imagePath) {
            fetchImageUrl();
        }
    }, [imagePath]);

    if (loading) {
        return <div className="w-full h-32 bg-gray-200 animate-pulse"></div>;
    }

    return <img src={imageUrl || ''} alt="Tree" className="w-full h-32 object-cover" />;
};

const AdminPage: React.FC = () => {
    const [pendingTrees, setPendingTrees] = useState<Tree[]>([]);
    const [loading, setLoading] = useState(true);
    const [approving, setApproving] = useState<string | null>(null); // Holds the ID of the tree being approved
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const q = query(collection(db, 'trees'), where('isPublic', '==', false));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const trees: Tree[] = [];
            snapshot.forEach((doc: DocumentData) => {
                trees.push({ id: doc.id, ...doc.data() } as Tree);
            });
            setPendingTrees(trees);
            setLoading(false);
        }, (err) => {
            console.error("Error fetching pending trees:", err);
            setError("Error al cargar los árboles pendientes.");
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleApprove = async (treeId: string) => {
        if (approving) return; // Prevent multiple clicks

        setApproving(treeId);
        setError(null);

        try {
            const functions = getFunctions();
            const approveTree = httpsCallable(functions, 'approveTree');
            const result = await approveTree({ treeId });

            if (result.data.success) {
                // The onSnapshot listener will automatically remove the tree from the list
                console.log(`Tree ${treeId} approved successfully.`);
            } else {
                throw new Error(result.data.error || 'Failed to approve tree.');
            }

        } catch (err: any) {
            console.error("Error approving tree:", err);
            setError(err.message);
        } finally {
            setApproving(null);
        }
    };

    if (loading) {
        return <div className="text-center p-10">Cargando árboles pendientes...</div>;
    }

    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Panel de Aprobación</h1>
            {error && <p className="text-red-500 bg-red-100 p-3 rounded-md mb-4">{error}</p>}
            {pendingTrees.length === 0 ? (
                <p>No hay árboles pendientes de aprobación.</p>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {pendingTrees.map((tree) => (
                        <div key={tree.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                            <TreeImage imagePath={tree.imageUrl} />
                            <div className="p-4">
                                <h3 className="font-bold text-lg">{tree.speciesName}</h3>
                                <p className="text-sm text-gray-600">Salud: {tree.healthStatus}</p>
                                <p className="text-sm text-gray-600">Edad aprox.: {tree.estimatedAge} años</p>
                                <p className="text-sm text-gray-500 mt-2">{tree.notes}</p>
                                <p className="text-xs text-gray-400 mt-2">Dirección: {tree.address}</p>
                                <button
                                    onClick={() => handleApprove(tree.id)}
                                    disabled={approving === tree.id}
                                    className="w-full mt-4 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400"
                                >
                                    {approving === tree.id ? 'Aprobando...' : 'Aprobar'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AdminPage;
