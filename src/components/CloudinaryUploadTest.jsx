import { useState } from "react";

export default function CloudinaryUploadTest() {
  const [file, setFile] = useState(null);
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleUpload = async () => {
    if (!file) {
      setError("Please select an image first.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image must not exceed 5MB.");
      return;
    }

    setLoading(true);
    setError("");
    setImageUrl("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append(
        "upload_preset",
        import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET,
      );

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: "POST",
          body: formData,
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || "Upload failed.");
      }

      setImageUrl(data.secure_url);
      console.log("Cloudinary response:", data);
      console.log("Image URL:", data.secure_url);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "24px", maxWidth: "500px" }}>
      <h2>Cloudinary Upload Test</h2>

      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />

      {file && <p>Selected: {file.name}</p>}

      <button onClick={handleUpload} disabled={loading}>
        {loading ? "Uploading..." : "Upload Image"}
      </button>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {imageUrl && (
        <div>
          <p style={{ color: "green" }}>Upload successful!</p>
          <img
            src={imageUrl}
            alt="Uploaded"
            style={{ width: "100%", marginTop: "12px" }}
          />
          <p>
            <a href={imageUrl} target="_blank" rel="noreferrer">
              Open uploaded image
            </a>
          </p>
        </div>
      )}
    </div>
  );
}
