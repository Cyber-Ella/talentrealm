
import { useRef, useState } from "react";

export default function ProfilePhotoUploader({ photoURL, onUploaded }) {
  const inputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const upload = async (file) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image must not exceed 5MB.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const formData = new FormData();

      formData.append("file", file);
      formData.append(
        "upload_preset",
        import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET,
      );

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${
          import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
        }/image/upload`,
        {
          method: "POST",
          body: formData,
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || "Upload failed.");
      }

      await onUploaded(data.secure_url);
    } catch (err) {
      setError(err.message || "Could not upload image.");
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="tr-photo-uploader">
      <button
        type="button"
        className="tr-photo-edit"
        onClick={() => inputRef.current?.click()}
        disabled={loading}
      >
        {loading ? "Uploading..." : photoURL ? "Change photo" : "Add photo"}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        hidden
        onChange={(e) => upload(e.target.files?.[0])}
      />

      {error && (
        <p className="tr-photo-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
