export async function uploadImage(file: File, _path: string): Promise<string> {
  console.log(`Converting ${file.name} to Base64...`);
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Max dimensions for compression (e.g., 800px)
        const MAX_DIM = 800;
        if (width > height) {
          if (width > MAX_DIM) {
            height *= MAX_DIM / width;
            width = MAX_DIM;
          }
        } else {
          if (height > MAX_DIM) {
            width *= MAX_DIM / height;
            height = MAX_DIM;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        // Compress to JPEG with 0.7 quality
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        
        // Check size (Firestore limit is 1MB, but we want to be safe)
        const sizeInBytes = Math.round((dataUrl.length * 3) / 4);
        console.log(`Compressed image size: ${Math.round(sizeInBytes / 1024)}KB`);
        
        if (sizeInBytes > 800 * 1024) {
          reject(new Error('Image is too large even after compression. Please try a smaller file.'));
        } else {
          resolve(dataUrl);
        }
      };
      img.onerror = () => reject(new Error('Failed to process image.'));
    };
    reader.onerror = (error) => reject(error);
  });
}
