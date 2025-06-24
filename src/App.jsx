import { useState, useEffect, useRef } from 'react';
import { databases, client } from './appwrite';
import { Storage } from 'appwrite';

const storage = new Storage(client);

function App() {
  const [items, setItems] = useState([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState(null);
  const fileInputRef = useRef(null);
  const [editingItem, setEditingItem] = useState(null);
  const [showEditPopup, setShowEditPopup] = useState(false);

  const fetchItems = async () => {
    try {
      const response = await databases.listDocuments(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        import.meta.env.VITE_APPWRITE_COLLECTION_ID
      );
      setItems(response.documents);
    } catch (error) {
      console.error('Fetch error:', error.message);
    }
  };

  const addItem = async () => {
    if (!name || !description) {
      alert("Please fill in both name and description.");
      return;
    }
    let imageId = null;
    if (image) {
      try {
        const uploadedFile = await storage.createFile(
          import.meta.env.VITE_APPWRITE_BUCKET_ID,
          'unique()',
          image
        );
        imageId = uploadedFile.$id;
      } catch (err) {
        console.error('Image upload error:', err.message);
        return;
      }
    }

    const item = {
      name,
      description,
      imageId,
    };

    try {
      await databases.createDocument(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        import.meta.env.VITE_APPWRITE_COLLECTION_ID,
        'unique()',
        item
      );
      fetchItems();
      setName('');
      setDescription('');
      setImage(null);
      fileInputRef.current.value = null;
    } catch (error) {
      console.error('Add error:', error.message);
    }
  };

  const deleteItem = async (id, imageId) => {
    try {
      await databases.deleteDocument(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        import.meta.env.VITE_APPWRITE_COLLECTION_ID,
        id
      );

      if (imageId) {
        try {
          await storage.deleteFile(import.meta.env.VITE_APPWRITE_BUCKET_ID, imageId);
        } catch (err) {
          console.error('Image delete error:', err.message);
        }
      }

      fetchItems();
    } catch (error) {
      console.error('Delete error:', error.message);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const openEditPopup = (item) => {
    setEditingItem(item);
    setName(item.name);
    setDescription(item.description);
    setImage(null);
    setShowEditPopup(true);
  };

  const updateItem = async () => {
    if (!name || !description || !editingItem) {
      alert("Please fill all fields.");
      return;
    }

    let updatedFields = {
      name,
      description,
    };

    if (image) {
      try {
        const uploadedFile = await storage.createFile(
          import.meta.env.VITE_APPWRITE_BUCKET_ID,
          'unique()',
          image
        );
        updatedFields.imageId = uploadedFile.$id;

        if (editingItem.imageId) {
          await storage.deleteFile(import.meta.env.VITE_APPWRITE_BUCKET_ID, editingItem.imageId);
        }
      } catch (err) {
        console.error('Image update error:', err.message);
        return;
      }
    }

    try {
      await databases.updateDocument(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        import.meta.env.VITE_APPWRITE_COLLECTION_ID,
        editingItem.$id,
        updatedFields
      );

      fetchItems();
      setShowEditPopup(false);
      setEditingItem(null);
      setName('');
      setDescription('');
      setImage(null);
    } catch (error) {
      console.error('Update error:', error.message);
    }
  };

  return (
    <div style={{ maxWidth: "1024px", margin: "0 auto", padding: "1rem" }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "1rem" }}>
        CRUD Application with AppWrite
      </h1>
      <div style={{ marginBottom: "1rem" }}>
        <input
          style={{ border: "1px solid #ccc", padding: "0.5rem", marginRight: "0.5rem" }}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
        />
        <input
          style={{ border: "1px solid #ccc", padding: "0.5rem", marginRight: "0.5rem" }}
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description"
        />
        <input
          ref={fileInputRef}
          style={{ border: "1px solid #ccc", padding: "0.5rem", marginRight: "0.5rem" }}
          type="file"
          onChange={(e) => setImage(e.target.files[0])}
        />
        <button
          style={{ backgroundColor: "#3b82f6", color: "#fff", padding: "0.5rem", border: "none", cursor: "pointer" }}
          onClick={addItem}
        >
          Add Item
        </button>
      </div>
      <ul>
        {items.map((item) => {
          const imageUrl = item.imageId
            ? `${import.meta.env.VITE_APPWRITE_ENDPOINT}/storage/buckets/${import.meta.env.VITE_APPWRITE_BUCKET_ID}/files/${item.imageId}/view?project=${import.meta.env.VITE_APPWRITE_PROJECT_ID}`
            : null;

          return (
            <li
              key={item.$id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "1rem",
                border: "1px solid #ccc",
                padding: "0.5rem",
                borderRadius: "0.5rem",
              }}
            >
              <div>
                <strong> Name: {item.name}</strong>
                <p>Description: {item.description} </p>
                {imageUrl && (
                  <div>
                    <img
                      src={imageUrl}
                      alt={item.name}
                      style={{ width: "200px", height: "200px", marginTop: "0.5rem", borderRadius: "0.5rem" }}
                    />
                  </div>
                )}
              </div>
              <div>
                <button
                  style={{
                    backgroundColor: "#3b82f6",
                    color: "#fff",
                    padding: "0.5rem",
                    border: "none",
                    cursor: "pointer",
                    marginRight: "0.5rem"
                  }}
                  onClick={() => openEditPopup(item)}
                >
                  Edit
                </button>

                {showEditPopup && (
                  <div style={{
                    position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
                    backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center"
                  }}>
                    <div style={{ backgroundColor: "#fff", padding: "2rem", borderRadius: "0.5rem", width: "400px" }}>
                      <h2>Edit Item</h2>
                      <input
                        style={{ display: "block", marginBottom: "1rem", width: "100%", padding: "0.5rem" }}
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Name"
                      />
                      <input
                        style={{ display: "block", marginBottom: "1rem", width: "100%", padding: "0.5rem" }}
                        type="text"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Description"
                      />
                      <input
                        style={{ display: "block", marginBottom: "1rem" }}
                        type="file"
                        onChange={(e) => setImage(e.target.files[0])}
                      />
                      <button
                        style={{ backgroundColor: "#10b981", color: "#fff", padding: "0.5rem", marginRight: "0.5rem", border: "none", cursor: "pointer" }}
                        onClick={updateItem}
                      >
                        Save Changes
                      </button>
                      <button
                        style={{ backgroundColor: "#ef4444", color: "#fff", padding: "0.5rem", border: "none", cursor: "pointer" }}
                        onClick={() => setShowEditPopup(false)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                <button
                  style={{
                    backgroundColor: "#ef4444",
                    color: "#fff",
                    padding: "0.5rem",
                    border: "none",
                    cursor: "pointer",
                  }}
                  onClick={() => deleteItem(item.$id, item.imageId)}
                >
                  Delete
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default App;

