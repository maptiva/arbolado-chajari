
import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Tree } from '../types';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import L from 'leaflet';
import 'leaflet.markercluster';

// Fix for default marker icon issue with webpack
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});


const MarkerClusterComponent: React.FC<{ trees: Tree[] }> = ({ trees }) => {
    const map = useMap();
    const markerClusterGroupRef = useRef<L.MarkerClusterGroup | null>(null);

    useEffect(() => {
        if (!map) return;

        // Initialize marker cluster group
        if (!markerClusterGroupRef.current) {
            markerClusterGroupRef.current = L.markerClusterGroup();
            map.addLayer(markerClusterGroupRef.current);
        }

        const mc_group = markerClusterGroupRef.current;
        mc_group.clearLayers();

        trees.forEach(tree => {
            const marker = L.marker([tree.location.latitude, tree.location.longitude]);
            const popupContent = `
                <div class="w-48">
                    <div class="p-2">
                        <h3 class="font-bold text-md">${tree.speciesName}</h3>
                        <p class="text-sm text-gray-600">Estado: ${tree.healthStatus}</p>
                    </div>
                </div>
            `;
            marker.bindPopup(popupContent);
            mc_group.addLayer(marker);
        });

        // Cleanup function
        return () => {
            if (mc_group && map.hasLayer(mc_group)) {
                 // We don't remove on re-render, only on component unmount
                 // mc_group.clearLayers();
            }
        };
    }, [trees, map]);
    
    // On unmount, remove the layer group
    useEffect(() => {
        const mc_group = markerClusterGroupRef.current;
        return () => {
            if (mc_group && map.hasLayer(mc_group)) {
                map.removeLayer(mc_group);
            }
        };
    }, [map]);


    return null;
};


const MapPage: React.FC = () => {
  const [trees, setTrees] = useState<Tree[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const q = query(collection(db, "trees"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const treesData: Tree[] = [];
      querySnapshot.forEach((doc) => {
        treesData.push({ id: doc.id, ...doc.data() } as Tree);
      });
      setTrees(treesData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching trees:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="h-full w-full">
      {loading ? (
        <div className="flex items-center justify-center h-full">
          <p>Cargando mapa y datos...</p>
        </div>
      ) : (
        <MapContainer center={[-30.76, -57.98]} zoom={13} scrollWheelZoom={true} className="h-full w-full">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          />
          <MarkerClusterComponent trees={trees} />
        </MapContainer>
      )}
    </div>
  );
};

export default MapPage;
