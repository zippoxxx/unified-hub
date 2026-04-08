
import React, { useState } from 'react';
import { cn } from '@/lib/utils';

const ProfilePictureUpload = () => {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    setImage(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className={cn('flex flex-col items-center justify-center', 'rounded-xl', 'shadow-md', 'transition-all', 'hover:opacity-90')}>
      <input type='file' className={cn('hidden')} onChange={handleImageChange} />
      <button type='button' className={cn('bg-primary', 'text-primary-foreground', 'px-4', 'py-2', 'rounded-full', 'hover:opacity-90', 'transition-all')} >
        Upload Image
      </button>
      {preview && (
        <img src={preview} alt='Profile picture' className={cn('rounded-full', 'object-cover', 'w-32', 'h-32', 'mt-4')} />
      )}
    </div>
  );
};

export default ProfilePictureUpload;
