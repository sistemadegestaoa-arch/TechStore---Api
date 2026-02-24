import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Verificar configuração
console.log('☁️ Cloudinary configurado:');
console.log('  - Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME);
console.log('  - API Key:', process.env.CLOUDINARY_API_KEY ? '✅ Configurado' : '❌ Não configurado');
console.log('  - API Secret:', process.env.CLOUDINARY_API_SECRET ? '✅ Configurado' : '❌ Não configurado');

/**
 * Upload image to Cloudinary
 * @param {string} filePath - Local file path
 * @param {string} folder - Cloudinary folder name
 * @returns {Promise<object>} Upload result
 */
export const uploadToCloudinary = async (filePath, folder = 'techstore') => {
  try {
    console.log(`📤 Iniciando upload para Cloudinary...`);
    console.log(`  - Arquivo: ${filePath}`);
    console.log(`  - Pasta: ${folder}`);
    console.log(`  - Arquivo existe: ${fs.existsSync(filePath)}`);

    if (!fs.existsSync(filePath)) {
      throw new Error(`Arquivo não encontrado: ${filePath}`);
    }

    const result = await cloudinary.uploader.upload(filePath, {
      folder: folder,
      resource_type: 'auto',
      transformation: [
        { width: 1000, height: 1000, crop: 'limit' },
        { quality: 'auto' },
        { fetch_format: 'auto' }
      ]
    });

    console.log(`✅ Upload bem-sucedido!`);
    console.log(`  - URL: ${result.secure_url}`);
    console.log(`  - Public ID: ${result.public_id}`);

    // Delete local file after upload
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`🗑️ Arquivo local deletado: ${filePath}`);
    }

    return result;
  } catch (error) {
    console.error('❌ Erro no upload para Cloudinary:', error);
    
    // Delete local file on error
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`🗑️ Arquivo local deletado após erro: ${filePath}`);
    }
    
    throw error;
  }
};

/**
 * Delete image from Cloudinary
 * @param {string} imageUrl - Cloudinary image URL
 * @returns {Promise<object>} Delete result
 */
export const deleteFromCloudinary = async (imageUrl) => {
  try {
    console.log(`🗑️ Deletando imagem do Cloudinary: ${imageUrl}`);
    
    // Extract public_id from URL
    const parts = imageUrl.split('/');
    const filename = parts[parts.length - 1];
    const publicId = filename.split('.')[0];
    const folder = parts[parts.length - 2];
    
    const fullPublicId = `${folder}/${publicId}`;
    
    console.log(`  - Public ID: ${fullPublicId}`);
    
    const result = await cloudinary.uploader.destroy(fullPublicId);
    
    console.log(`✅ Imagem deletada:`, result);
    
    return result;
  } catch (error) {
    console.error('❌ Erro ao deletar do Cloudinary:', error);
    throw error;
  }
};

/**
 * Get public ID from Cloudinary URL
 * @param {string} imageUrl - Cloudinary image URL
 * @returns {string} Public ID
 */
export const getPublicIdFromUrl = (imageUrl) => {
  try {
    if (!imageUrl || !imageUrl.includes('cloudinary.com')) {
      return null;
    }
    
    const parts = imageUrl.split('/');
    const filename = parts[parts.length - 1];
    const publicId = filename.split('.')[0];
    const folder = parts[parts.length - 2];
    
    return `${folder}/${publicId}`;
  } catch (error) {
    console.error('Erro ao extrair public ID:', error);
    return null;
  }
};

export default cloudinary;
