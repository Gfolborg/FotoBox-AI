import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  ReactNode,
} from "react";

type VariantsMap = Record<string, string[]>;

interface MockupVariantsContextType {
  variantsByOriginal: VariantsMap;
  addVariant: (originalUri: string, resultUri: string) => void;
  replaceVariant: (
    originalUri: string,
    oldUri: string,
    newUri: string,
  ) => void;
  clearVariants: (originalUri?: string) => void;
}

const MockupVariantsContext = createContext<MockupVariantsContextType | undefined>(
  undefined,
);

const ensureUnique = (values: string[]) =>
  Array.from(new Set(values.filter(Boolean)));

export function MockupVariantsProvider({ children }: { children: ReactNode }) {
  const [variantsByOriginal, setVariantsByOriginal] = useState<VariantsMap>({});

  const addVariant = (originalUri: string, resultUri: string) => {
    if (!originalUri || !resultUri) return;
    setVariantsByOriginal((prev) => ({
      ...prev,
      [originalUri]: ensureUnique([...(prev[originalUri] || []), resultUri]),
    }));
  };

  const replaceVariant = (
    originalUri: string,
    oldUri: string,
    newUri: string,
  ) => {
    if (!originalUri || !oldUri || !newUri) return;
    setVariantsByOriginal((prev) => {
      const existing = prev[originalUri] || [];
      const next = existing.map((uri) => (uri === oldUri ? newUri : uri));
      return { ...prev, [originalUri]: ensureUnique(next) };
    });
  };

  const clearVariants = (originalUri?: string) => {
    if (!originalUri) {
      setVariantsByOriginal({});
      return;
    }
    setVariantsByOriginal((prev) => {
      const next = { ...prev };
      delete next[originalUri];
      return next;
    });
  };

  const value = useMemo(
    () => ({ variantsByOriginal, addVariant, replaceVariant, clearVariants }),
    [variantsByOriginal],
  );

  return (
    <MockupVariantsContext.Provider value={value}>
      {children}
    </MockupVariantsContext.Provider>
  );
}

export function useMockupVariants() {
  const context = useContext(MockupVariantsContext);
  if (!context) {
    throw new Error(
      "useMockupVariants must be used within a MockupVariantsProvider",
    );
  }
  return context;
}
