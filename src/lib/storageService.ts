import supabase from './supabase';

export const storageService = {
  async uploadImage(file: File, folder: string = 'credentials-images'): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error } = await supabase.storage
      .from(folder)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;

    // Use permanent public URL for persistent display
    const { data: { publicUrl } } = supabase.storage
      .from(folder)
      .getPublicUrl(filePath);
    return publicUrl;
  }
};
