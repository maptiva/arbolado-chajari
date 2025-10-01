import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

const db = admin.firestore();
const storage = admin.storage().bucket();

// ¡IMPORTANTE! Debes configurar tu UID de administrador en el entorno de Firebase.
// Ejecuta este comando en tu terminal (reemplaza "YOUR_ADMIN_UID"):
// firebase functions:config:set config.admin_uid="YOUR_ADMIN_UID"
const adminUid = functions.config().config.admin_uid;


export const approveTree = functions.https.onCall(async (data, context) => {
  functions.logger.info("approveTree function triggered", { data, auth: context.auth });

  // 1. Verificar que el usuario que llama es el administrador
  if (context.auth?.uid !== adminUid) {
    functions.logger.warn("Permission denied for user", { uid: context.auth?.uid });
    throw new functions.https.HttpsError(
      "permission-denied",
      "Debes ser un administrador para realizar esta acción."
    );
  }

  const treeId = data.treeId;
  if (!treeId || typeof treeId !== "string") {
    functions.logger.error("Argumento inválido: treeId no encontrado o no es un string");
    throw new functions.https.HttpsError(
      "invalid-argument",
      "La función debe ser llamada con un 'treeId' válido."
    );
  }

  try {
    const treeRef = db.collection("trees").doc(treeId);
    const treeDoc = await treeRef.get();

    if (!treeDoc.exists) {
      throw new functions.https.HttpsError(
        "not-found",
        `El árbol con ID ${treeId} no fue encontrado.`
      );
    }

    const treeData = treeDoc.data();
    const originalImagePath = treeData?.imageUrl;

    if (!originalImagePath || typeof originalImagePath !== 'string') {
        throw new functions.https.HttpsError(
            "internal",
            "El documento del árbol no contiene una ruta de imagen válida."
        );
    }

    // 2. Mover el archivo en Storage a una carpeta pública
    const fileName = originalImagePath.substring(originalImagePath.lastIndexOf('/') + 1);
    const newImagePath = `public_images/${fileName}`;
    const file = storage.file(originalImagePath);
    
    functions.logger.info(`Moviendo archivo de '${originalImagePath}' a '${newImagePath}'`);
    await file.move(newImagePath);
    
    // 3. Hacer público el nuevo archivo
    const newFile = storage.file(newImagePath);
    await newFile.makePublic();

    // 4. Obtener la URL pública y permanente
    const publicUrl = newFile.publicUrl();
    functions.logger.info(`El archivo ahora es público en ${publicUrl}`);

    // 5. Actualizar el documento en Firestore
    await treeRef.update({
      isPublic: true,
      imageUrl: publicUrl,
    });

    functions.logger.info(`Árbol ${treeId} aprobado exitosamente`);
    return { success: true, message: "Árbol aprobado exitosamente." };

  } catch (error) {
    functions.logger.error(`Error al aprobar el árbol ${treeId}:`, error);
    if (error instanceof functions.https.HttpsError) {
        throw error;
    }
    throw new functions.https.HttpsError(
      "internal",
      "Ocurrió un error inesperado. Revisa los logs de la función para más detalles."
    );
  }
});
