import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import type { ImageEditingState } from "@/hooks/useImageEditing";

interface EditResult {
  originalUri: string;
  editedUri: string;
}

interface BatchEditContextType {
  isBatchMode: boolean;
  setBatchMode: (value: boolean) => void;
  hasShownApplyAllPopup: boolean;
  setHasShownApplyAllPopup: (value: boolean) => void;
  savedEditSettings: Partial<ImageEditingState> | null;
  setSavedEditSettings: (settings: Partial<ImageEditingState> | null) => void;
  applyToAllPending: boolean;
  setApplyToAllPending: (value: boolean) => void;
  totalBatchImages: number;
  setTotalBatchImages: (count: number) => void;
  editedBatchImages: Set<string>;
  markImageAsEdited: (uri: string) => void;
  resetBatchSession: () => void;
  pendingEditResult: EditResult | null;
  setPendingEditResult: (result: EditResult | null) => void;
}

const BatchEditContext = createContext<BatchEditContextType | undefined>(
  undefined,
);

export function BatchEditProvider({ children }: { children: ReactNode }) {
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [hasShownApplyAllPopup, setHasShownApplyAllPopup] = useState(false);
  const [savedEditSettings, setSavedEditSettings] =
    useState<Partial<ImageEditingState> | null>(null);
  const [applyToAllPending, setApplyToAllPending] = useState(false);
  const [totalBatchImages, setTotalBatchImages] = useState(0);
  const [editedBatchImages, setEditedBatchImages] = useState<Set<string>>(
    new Set(),
  );
  const [pendingEditResult, setPendingEditResult] = useState<EditResult | null>(
    null,
  );

  const markImageAsEdited = useCallback((uri: string) => {
    setEditedBatchImages((prev) => new Set([...prev, uri]));
  }, []);

  const resetBatchSession = useCallback(() => {
    setIsBatchMode(false);
    setHasShownApplyAllPopup(false);
    setSavedEditSettings(null);
    setApplyToAllPending(false);
    setTotalBatchImages(0);
    setEditedBatchImages(new Set());
    setPendingEditResult(null);
  }, []);

  const setBatchMode = useCallback(
    (value: boolean) => {
      if (!value) {
        resetBatchSession();
      } else {
        setIsBatchMode(true);
      }
    },
    [resetBatchSession],
  );

  return (
    <BatchEditContext.Provider
      value={{
        isBatchMode,
        setBatchMode,
        hasShownApplyAllPopup,
        setHasShownApplyAllPopup,
        savedEditSettings,
        setSavedEditSettings,
        applyToAllPending,
        setApplyToAllPending,
        totalBatchImages,
        setTotalBatchImages,
        editedBatchImages,
        markImageAsEdited,
        resetBatchSession,
        pendingEditResult,
        setPendingEditResult,
      }}
    >
      {children}
    </BatchEditContext.Provider>
  );
}

export function useBatchEdit() {
  const context = useContext(BatchEditContext);
  if (context === undefined) {
    throw new Error("useBatchEdit must be used within a BatchEditProvider");
  }
  return context;
}
