"use client";
import React, { useState } from "react";
import { useBookmarks } from "@/context/BookmarkContext";
import { FaPlus, FaTimes } from "react-icons/fa";
import { PiCheckCircleFill, PiCircle } from "react-icons/pi";
import "./SaveToCollectionModal.css";

export default function SaveToCollectionModal({ feature, onClose }) {
  const {
    collections,
    createCollection,
    addFeatureToCollection,
    removeFeatureFromCollection,
    isFeatureInCollection,
    isAuthenticated,
  } = useBookmarks();

  const [isCreating, setIsCreating] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");

  if (!isAuthenticated) {
    return (
      <div className="save-modal-overlay" onClick={onClose}>
        <div className="save-modal-sheet" onClick={(e) => e.stopPropagation()}>
          <div className="save-modal-handle" />
          <div className="save-modal-header">
            <h3>Save to Collection</h3>
          </div>
          <p className="auth-warning">Please log in to save bookmarks.</p>
        </div>
      </div>
    );
  }

  const featureName =
    feature?.properties?.NAME || feature?.properties?.name || "Unnamed Feature";

  const handleCreateAndSave = () => {
    const trimmedName = newCollectionName.trim();
    if (trimmedName) {
      const newId = createCollection(trimmedName);
      // Small delay to ensure state is updated before adding
      setTimeout(() => {
        addFeatureToCollection(newId, feature);
      }, 100);
      setNewCollectionName("");
      setIsCreating(false);
    }
  };

  const handleToggle = (collectionId) => {
    const isInCollection = isFeatureInCollection(collectionId, feature);
    if (isInCollection) {
      removeFeatureFromCollection(collectionId, feature);
    } else {
      addFeatureToCollection(collectionId, feature);
    }
  };

  const collectionList = Object.values(collections);

  return (
    <div className="save-modal-overlay" onClick={onClose}>
      <div className="save-modal-sheet" onClick={(e) => e.stopPropagation()}>
        {/* Drag handle */}
        <div className="save-modal-handle" />

        {/* Header with feature info */}
        <div className="save-modal-header">
          <div className="save-modal-feature-info">
            <span className="save-modal-title">Save</span>
            <span className="save-modal-feature-name">{featureName}</span>
          </div>
        </div>

        {/* New collection button/form */}
        <div className="save-modal-new-section">
          <span className="section-label">Collections</span>
          {isCreating ? (
            <div className="new-collection-form">
              <input
                type="text"
                placeholder="Collection name"
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateAndSave();
                  if (e.key === "Escape") {
                    setIsCreating(false);
                    setNewCollectionName("");
                  }
                }}
                autoFocus
              />
              <div className="new-collection-actions">
                <button 
                  className="btn-cancel-create"
                  onClick={() => {
                    setIsCreating(false);
                    setNewCollectionName("");
                  }}
                >
                  Cancel
                </button>
                <button 
                  className="btn-create"
                  onClick={handleCreateAndSave}
                  disabled={!newCollectionName.trim()}
                >
                  Create
                </button>
              </div>
            </div>
          ) : (
            <button 
              className="new-collection-btn"
              onClick={() => setIsCreating(true)}
            >
              New collection
            </button>
          )}
        </div>

        {/* Collections list */}
        <div className="save-modal-collections">
          {collectionList.length === 0 ? (
            <p className="no-collections-msg">
              No collections yet. Create your first one!
            </p>
          ) : (
            collectionList.map((col) => {
              const isSelected = isFeatureInCollection(col.id, feature);
              return (
                <div
                  key={col.id}
                  className={`collection-row ${isSelected ? "selected" : ""}`}
                  onClick={() => handleToggle(col.id)}
                >
                  <div className="collection-row-info">
                    <span className="collection-row-name">{col.name}</span>
                    <span className="collection-row-count">
                      {col.features.length} {col.features.length === 1 ? "item" : "items"}
                    </span>
                  </div>
                  <div className="collection-row-checkbox">
                    {isSelected ? (
                      <PiCheckCircleFill className="checkbox-checked" />
                    ) : (
                      <PiCircle className="checkbox-unchecked" />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Done button */}
        <div className="save-modal-footer">
          <button className="btn-done" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}