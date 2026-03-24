"use client";
import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { getFeatureSubtitle } from "@/context/featureLabels";

const BookmarkContext = createContext();

/**
 * Builds a bookmark ID from the feature name, subtitle, and geometry type.
 * Coordinates are used only when a feature has no stable display name.
 */
function getFeatureId(feature) {
  if (!feature) return null;
  
  const name = feature?.properties?.NAME || feature?.properties?.name || "";
  const subtitle = getFeatureSubtitle(feature);
  const type = feature?.geometry?.type || "";

  let fallback = "";
  if (!name && feature?.geometry?.coordinates) {
    const coords = feature.geometry.coordinates;
    const firstCoord = Array.isArray(coords[0]) 
      ? (Array.isArray(coords[0][0]) ? coords[0][0] : coords[0])
      : coords;
    if (Array.isArray(firstCoord) && firstCoord.length >= 2) {
      fallback = `${firstCoord[0].toFixed(4)}_${firstCoord[1].toFixed(4)}`;
    }
  }
  
  const idParts = [name || fallback, subtitle, type].filter(Boolean);
  return idParts.length > 0 ? idParts.join("_") : null;
}

/**
 * Deep clone a feature to preserve all properties including geometry
 */
function cloneFeature(feature) {
  if (!feature) return null;
  
  return {
    type: feature.type || "Feature",
    geometry: feature.geometry ? {
      type: feature.geometry.type,
      coordinates: JSON.parse(JSON.stringify(feature.geometry.coordinates || []))
    } : null,
    properties: { ...(feature.properties || {}) },
  };
}

export function BookmarkProvider({ children }) {
  const { data: session, status } = useSession();
  const [collections, setCollections] = useState({});
  
  // Track pending operations to prevent race conditions
  const pendingOpsRef = useRef(new Set());

  // Load collections from localStorage when session is available
  useEffect(() => {
    if (status === "loading") {
      // Session is still loading, do nothing yet
      return;
    }
    
    if (status === "authenticated" && session?.user?.id) {
      const storageKey = `bookmarks_${session.user.id}`;
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        try {
          setCollections(JSON.parse(stored));
        } catch {
          setCollections({});
        }
      }
    } else if (status === "unauthenticated") {
      setCollections({});
    }
  }, [session, status]);

  // Persist collections to localStorage whenever they change
  useEffect(() => {
    if (status === "authenticated" && session?.user?.id) {
      const storageKey = `bookmarks_${session.user.id}`;
      localStorage.setItem(storageKey, JSON.stringify(collections));
    }
  }, [collections, session, status]);

  /**
   * Create a new collection and return its ID
   */
  const createCollection = useCallback((name) => {
    const id = `col_${Date.now()}`;
    setCollections((prev) => ({
      ...prev,
      [id]: {
        id,
        name,
        createdAt: new Date().toISOString(),
        type: "FeatureCollection",
        features: [],
      },
    }));
    return id;
  }, []);

  /**
   * Add feature to collection (only if not already present)
   * Uses a lock mechanism to prevent race conditions
   */
  const addFeatureToCollection = useCallback((collectionId, feature) => {
    const featureId = getFeatureId(feature);
    
    if (!featureId) {
      return false;
    }

    const opKey = `${collectionId}_${featureId}`;
    
    if (pendingOpsRef.current.has(opKey)) {
      return false;
    }
    
    pendingOpsRef.current.add(opKey);

    const clonedFeature = cloneFeature(feature);

    setCollections((prev) => {
      const collection = prev[collectionId];
      
      if (!collection) {
        pendingOpsRef.current.delete(opKey);
        return prev;
      }

      const exists = collection.features.some((f) => {
        const existingId = getFeatureId(f);
        return existingId === featureId;
      });

      if (exists) {
        pendingOpsRef.current.delete(opKey);
        return prev;
      }

      const newState = {
        ...prev,
        [collectionId]: {
          ...collection,
          features: [
            ...collection.features,
            { 
              ...clonedFeature, 
              _bookmarkId: featureId, 
              savedAt: new Date().toISOString() 
            },
          ],
        },
      };
      
      setTimeout(() => {
        pendingOpsRef.current.delete(opKey);
      }, 100);
      
      return newState;
    });

    return true;
  }, []);

  /**
   * Remove feature from collection
   */
  const removeFeatureFromCollection = useCallback((collectionId, feature) => {
    const featureId = getFeatureId(feature);
    if (!featureId) return false;

    setCollections((prev) => {
      const collection = prev[collectionId];
      if (!collection) return prev;

      const filteredFeatures = collection.features.filter(
        (f) => getFeatureId(f) !== featureId
      );

      // If nothing was removed, return previous state
      if (filteredFeatures.length === collection.features.length) {
        return prev;
      }

      return {
        ...prev,
        [collectionId]: {
          ...collection,
          features: filteredFeatures,
        },
      };
    });
  }, []);

  /**
   * Remove a feature from a collection by index
   */
  const removeFromCollectionByIndex = useCallback((collectionId, featureIndex) => {
    setCollections((prev) => {
      const collection = prev[collectionId];
      if (!collection) return prev;

      return {
        ...prev,
        [collectionId]: {
          ...collection,
          features: collection.features.filter((_, i) => i !== featureIndex),
        },
      };
    });
  }, []);

  /**
   * Delete an entire collection
   */
  const deleteCollection = useCallback((collectionId) => {
    setCollections((prev) => {
      const { [collectionId]: removed, ...rest } = prev;
      return rest;
    });
  }, []);

  /**
   * Rename a collection
   */
  const renameCollection = useCallback((collectionId, newName) => {
    setCollections((prev) => {
      const collection = prev[collectionId];
      if (!collection) return prev;
      return {
        ...prev,
        [collectionId]: { ...collection, name: newName },
      };
    });
  }, []);

  /**
   * Check if a feature is in a specific collection
   */
  const isFeatureInCollection = useCallback(
    (collectionId, feature) => {
      if (!feature || !collections[collectionId]) return false;
      const featureId = getFeatureId(feature);
      return collections[collectionId].features.some(
        (f) => getFeatureId(f) === featureId
      );
    },
    [collections]
  );

  /**
   * Check if a feature is saved in any collection
   */
  const isFeatureSaved = useCallback(
    (feature) => {
      if (!feature) return false;
      const featureId = getFeatureId(feature);
      return Object.values(collections).some((col) =>
        col.features.some((f) => getFeatureId(f) === featureId)
      );
    },
    [collections]
  );

  /**
   * Get count of collections containing this feature
   */
  const getFeatureSaveCount = useCallback(
    (feature) => {
      if (!feature) return 0;
      const featureId = getFeatureId(feature);
      return Object.values(collections).filter((col) =>
        col.features.some((f) => getFeatureId(f) === featureId)
      ).length;
    },
    [collections]
  );

  return (
    <BookmarkContext.Provider
      value={{
        collections,
        createCollection,
        addFeatureToCollection,
        removeFeatureFromCollection,
        removeFromCollectionByIndex,
        deleteCollection,
        renameCollection,
        isFeatureInCollection,
        isFeatureSaved,
        getFeatureSaveCount,
        isAuthenticated: status === "authenticated",
      }}
    >
      {children}
    </BookmarkContext.Provider>
  );
}

export function useBookmarks() {
  const context = useContext(BookmarkContext);
  if (!context) {
    throw new Error("useBookmarks must be used within a BookmarkProvider");
  }
  return context;
}
