/**
 * @file Módulo para la interacción con la API de Google Gemini.
 * Proporciona funcionalidades para analizar imágenes y extraer información utilizando modelos de IA generativa.
 */

import { GoogleGenAI } from "@google/genai";

// Inicializa el cliente de Google Gemini AI.
// La clave de la API se proporciona de forma segura a través de las variables de entorno.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Convierte un objeto File a una cadena en formato base64, estructurada como lo requiere la API de Gemini.
 * Esta función es un paso de pre-procesamiento necesario para enviar archivos de imagen al modelo.
 * @param file El archivo de imagen a convertir.
 * @returns Una promesa que se resuelve con un objeto `GenerativePart`, que contiene los datos de la imagen en base64 y su tipo MIME.
 */
function fileToGenerativePart(file: File): Promise<{inlineData: {data: string, mimeType: string}}> {
    return new Promise((resolve, reject) => {
        // Se utiliza FileReader para leer el contenido del archivo.
        const reader = new FileReader();
        
        // Se define el callback para cuando la lectura del archivo finaliza.
        reader.onloadend = () => {
            // Aseguramos que el resultado sea una cadena de texto.
            if (typeof reader.result !== 'string') {
                return reject(new Error("Falló la lectura del archivo como cadena base64"));
            }
            // El resultado de readAsDataURL incluye el prefijo "data:mime/type;base64,", que debe ser eliminado.
            const base64Data = reader.result.split(',')[1];
            
            // Se resuelve la promesa con el objeto en el formato esperado por la API.
            resolve({
                inlineData: {
                    data: base64Data,
                    mimeType: file.type,
                }
            });
        };
        
        // Se define el callback para manejar errores durante la lectura.
        reader.onerror = reject;
        
        // Se inicia la lectura del archivo, convirtiéndolo a una URL de datos (que contiene base64).
        reader.readAsDataURL(file);
    });
}

/**
 * Identifica la especie de un árbol a partir de un archivo de imagen utilizando la API de Gemini.
 * @param imageFile La imagen del árbol que se va a identificar.
 * @returns Una promesa que se resuelve con el nombre común de la especie identificada en español.
 */
export async function identifyTreeSpecies(imageFile: File): Promise<string> {
    console.log("La identificación de especies está deshabilitada temporalmente.", imageFile);
    return "Función deshabilitada";
}
