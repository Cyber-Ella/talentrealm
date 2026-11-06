import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { createListing } from "../../services/listings";
import RefineWithGemini from "../../components/RefineWithGemini";
import "../../styles/listing-phase5.css";

const CATEGORIES = [
  "Beauty",
  "Fashion",
  "Photography",
  "Food",
  "Music",
  "Technology",
  "Academics",
  "Creative",
  "Other",
];

export default function CreateListing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [type, setType] = useState("service");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Other");
  const [price, setPrice] = useState("");
  const [skills, setSkills] = useState([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [images, setImages] = useState([]);
  const [imageError, setImageError] = useState("");

  const MAX_IMAGES = 4;
  const MAX_SIZE = 5 * 1024 * 1024;

  const handleImageChange = (e) => {
    const selected = Array.from(e.target.files || []);
    setImageError("");

    const valid = selected.filter((file) => {
      if (!file.type.startsWith("image/")) {
        setImageError("Only image files are allowed.");
        return false;
      }

      if (file.size > MAX_SIZE) {
        setImageError(`${file.name} is larger than 5MB.`);
        return false;
      }

      return true;
    });

    setImages((current) => {
      const combined = [...current, ...valid];
      return combined.slice(0, MAX_IMAGES);
    });

    e.target.value = "";
  };

  const removeImage = (index) => {
    setImages((current) => current.filter((_, i) => i !== index));
  };
  const previews = useMemo(() => images.map((file) => URL.createObjectURL(file)), [images]);

  useEffect(() => {
    return () => previews.forEach((url) => URL.revokeObjectURL(url));
  }, [images]);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!user?.uid) { setError("Sign in to publish a listing."); return; }
    if (title.trim().length < 2) { setError("Your title needs at least 2 characters."); return; }
    if (!description.trim()) { setError("Add a description before publishing."); return; }
    setBusy(true);
    try {
      const id = await createListing(
        {
          ownerId: user.uid,
          ownerName: user.displayName,
          type,
          title: title.trim(),
          description: description.trim(),
          category,
          price: type === "showcase" ? 0 : Math.max(0, Number(price) || 0),
          skills: skills.length ? skills : [title.trim()],
        },
        images,
      );
      navigate("/listings/" + id);
    } catch (err) {
      setError(err.message || "Listing could not be published.");
      setBusy(false);
    }
  };

  return (
    <main className="tr-create-listing-page">
      <header className="tr-create-listing-heading">
        <div><span className="tr-eyebrow">PUT YOUR TALENT OUT THERE</span><h1>Create a listing<span>.</span></h1><p>Give your work a place to be found.</p></div>
        <span className="tr-create-step">01 / PUBLISH</span>
      </header>
      <form className="tr-create-listing-form" onSubmit={submit}>
      <section className="tr-listing-form-section">
        <div className="tr-listing-section-title"><span>01</span><div><h2>What are you sharing?</h2><p>Choose how people can engage with your talent.</p></div></div>
      <div className="row" style={{ marginBottom: 12 }}>
        <button
          type="button"
          className={"tab" + (type === "service" ? " on" : "")}
          onClick={() => setType("service")}
        >
          Service
        </button>
        <button
          type="button"
          className={"tab" + (type === "product" ? " on" : "")}
          onClick={() => setType("product")}
        >
          Product
        </button>
        <button
          type="button"
          className={"tab" + (type === "showcase" ? " on" : "")}
          onClick={() => setType("showcase")}
        >
          Talent showcase
        </button>
      </div>
      <p className="muted tr-listing-type-description">
        {type === "service"
          ? "Offer a service people can request, book, or exchange."
          : type === "product"
            ? "List something you made or own. Set its price and let students buy or barter for it."
            : "Share your work so people can find you. No bookings needed."}
      </p>
      <label className="tr-listing-label">Listing title
      <input
        maxLength={100}
        placeholder="e.g. Product photography"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      /></label>
      <label className="tr-listing-label">Description
      <textarea
        maxLength={2000}
        rows={5}
        placeholder="Describe what you offer, in your own words"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        required
      /></label>
      <RefineWithGemini
        text={description}
        onAccept={(r) => {
          setDescription(r.refined);
          setCategory(r.category);
          setType(r.type);
          setSkills(r.skills);
          if (!title.trim() && r.skills[0]) setTitle(r.skills[0]);
        }}
      />

      </section>
      <section className="tr-listing-form-section">
        <div className="tr-listing-section-title"><span>02</span><div><h2>Show it, don't just tell it.</h2><p>Strong visuals help people understand your work faster.</p></div></div>
      <section className="listing-upload tr-listing-upload">

        <p className="muted">
          Upload up to 4 images of your work. PNG, JPG, or WebP · Max 5MB each.
        </p>

        <label className="upload-button">
          <span>＋ Add portfolio images</span>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            multiple
            onChange={handleImageChange}
            disabled={images.length >= MAX_IMAGES}
          />
        </label>

        {imageError && <p className="upload-error">{imageError}</p>}

        <div className="upload-grid">
          {previews.map((src, index) => (
            <div className="upload-preview" key={src}>
              <img src={src} alt={`Portfolio preview ${index + 1}`} />

              <button
                type="button"
                className="upload-remove"
                onClick={() => removeImage(index)}
                aria-label={`Remove image ${index + 1}`}
              >
                ×
              </button>
            </div>
          ))}
        </div>

        <p className="muted">{images.length}/4 images selected</p>
      </section>
      </section>
      <section className="tr-listing-form-section">
        <div className="tr-listing-section-title"><span>03</span><div><h2>Set the details.</h2><p>Help the right people find what you offer.</p></div></div>
        <label className="tr-listing-label">Category<select value={category} onChange={(e) => setCategory(e.target.value)}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></label>
        {(type === "service" || type === "product") && <label className="tr-listing-label">Price in Nigerian naira<input type="number" min="0" step="100" placeholder="0 = free" value={price} onChange={(e) => setPrice(e.target.value)} /><span className="tr-listing-field-note">Leave at 0 if you're open to free requests or exchanges.</span></label>}
      </section>
      {error && <p className="tr-listing-error" role="alert">{error}</p>}
      <footer className="tr-listing-submit-row"><span>{images.length}/4 images · Your listing can be updated later.</span><button className="tr-listing-publish" disabled={busy}>{busy ? "Publishing…" : "Publish listing ↗"}</button></footer>
    </form>
    </main>
  );
}
