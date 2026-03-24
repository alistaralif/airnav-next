"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useBookmarks } from "@/context/BookmarkContext";
import { getFeatureSubtitle } from "@/context/featureLabels";
import {
  FaFolder,
  FaFolderOpen,
  FaTrash,
  FaEdit,
  FaCheck,
  FaTimes,
  FaMap,
} from "react-icons/fa";
import { PiMapPinFill } from "react-icons/pi";
import { TbRoute, TbPolygon } from "react-icons/tb";
import { PiWarningCircleBold } from "react-icons/pi";
import "./CustomMapPanel.css";

export default function CustomMapPanel({ onOpenLoginPanel }) {
  const router = useRouter();
  const {
    collections,
    deleteCollection,
    renameCollection,
    removeFromCollectionByIndex,
    isAuthenticated,
  } = useBookmarks();

  const [expandedCollection, setExpandedCollection] = useState(null);
  const [editingCollection, setEditingCollection] = useState(null);
  const [editName, setEditName] = useState("");

  if (!isAuthenticated) {
    return (
      <div className="custom-map-panel">
        <h3>Custom Map</h3>
        <div className="login-message">
          <PiWarningCircleBold className="login-message-icon" />
          <p className="login-message-text">
            Please{" "}
            <button className="login-link" onClick={onOpenLoginPanel}>
              login
            </button>{" "}
            to view your saved collections.
          </p>
        </div>
      </div>
    );
  }

  const collectionList = Object.values(collections);

  const handleToggleExpand = (colId) => {
    setExpandedCollection(expandedCollection === colId ? null : colId);
  };

  const handleStartEdit = (e, col) => {
    e.stopPropagation();
    setEditingCollection(col.id);
    setEditName(col.name);
  };

  const handleSaveEdit = (colId) => {
    if (editName.trim()) {
      renameCollection(colId, editName.trim());
    }
    setEditingCollection(null);
    setEditName("");
  };

  const handleCancelEdit = () => {
    setEditingCollection(null);
    setEditName("");
  };

  const handleDeleteCollection = (e, colId) => {
    e.stopPropagation();
    if (confirm("Delete this collection and all its items?")) {
      deleteCollection(colId);
      if (expandedCollection === colId) {
        setExpandedCollection(null);
      }
    }
  };

  const handleRemoveFeature = (colId, featureIndex) => {
    removeFromCollectionByIndex(colId, featureIndex);
  };

  const handleViewOnMap = (e, colId) => {
    e.stopPropagation();
    router.push(`/collection/${colId}`);
  };

  const getFeatureIcon = (feature) => {
    const type = feature?.geometry?.type;
    switch (type) {
      case "Point":
        return <PiMapPinFill />;
      case "LineString":
      case "MultiLineString":
        return <TbRoute />;
      case "Polygon":
      case "MultiPolygon":
        return <TbPolygon />;
      default:
        return <PiMapPinFill />;
    }
  };

  const getFeatureName = (feature) => {
    return (
      feature?.properties?.NAME ||
      feature?.properties?.name ||
      feature?.properties?.type ||
      "Unnamed Feature"
    );
  };

  return (
    <div className="custom-map-panel">
      <h3>Saved Collections</h3>
      <p className="panel-subtitle">
        {collectionList.length} collection{collectionList.length !== 1 ? "s" : ""}
      </p>

      {collectionList.length === 0 ? (
        <div className="empty-state">
          <FaFolder className="empty-icon" />
          <p>No collections yet</p>
          <p className="empty-hint">
            Click the bookmark icon on any map feature to start saving!
          </p>
        </div>
      ) : (
        <div className="collections-container">
          {collectionList.map((col) => (
            <div key={col.id} className="collection-card">
              <div
                className="collection-header"
                onClick={() => handleToggleExpand(col.id)}
              >
                <span className="collection-icon">
                  {expandedCollection === col.id ? <FaFolderOpen /> : <FaFolder />}
                </span>

                {editingCollection === col.id ? (
                  <div className="edit-name-form" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveEdit(col.id);
                        if (e.key === "Escape") handleCancelEdit();
                      }}
                      autoFocus
                    />
                    <button onClick={() => handleSaveEdit(col.id)}>
                      <FaCheck />
                    </button>
                    <button onClick={handleCancelEdit}>
                      <FaTimes />
                    </button>
                  </div>
                ) : (
                  <>
                    <span className="collection-title">{col.name}</span>
                    <span className="collection-badge">{col.features.length}</span>
                  </>
                )}

                <div className="collection-actions">
                  <button
                    className="action-btn view-map"
                    onClick={(e) => handleViewOnMap(e, col.id)}
                    title="View on map"
                    disabled={col.features.length === 0}
                  >
                    <FaMap />
                  </button>
                  <button
                    className="action-btn edit"
                    onClick={(e) => handleStartEdit(e, col)}
                    title="Rename"
                  >
                    <FaEdit />
                  </button>
                  <button
                    className="action-btn delete"
                    onClick={(e) => handleDeleteCollection(e, col.id)}
                    title="Delete"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>

              {expandedCollection === col.id && (
                <div className="collection-features">
                  {col.features.length === 0 ? (
                    <p className="no-features">No items in this collection</p>
                  ) : (
                    col.features.map((feature, idx) => (
                      <div key={idx} className="collection-feature-item">
                        <span className="collection-feature-icon">{getFeatureIcon(feature)}</span>
                        <div className="collection-feature-info">
                          <span className="collection-feature-name">{getFeatureName(feature)}</span>
                          <span className="collection-feature-subtitle">
                            {getFeatureSubtitle(feature)}
                          </span>
                        </div>
                        <button
                          className="collection-remove-feature-btn"
                          onClick={() => handleRemoveFeature(col.id, idx)}
                          title="Remove from collection"
                        >
                          <FaTimes />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
