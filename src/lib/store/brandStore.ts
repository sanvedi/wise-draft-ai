import { create } from "zustand";
import type { BrandDNA } from "@/components/ecos/BrandDNAPanel";

interface BrandStore {
  brandData: BrandDNA | null;
  fullBrandDNA: any;
  setBrandData: (data: BrandDNA | null) => void;
  setFullBrandDNA: (data: any) => void;
}

export const useBrandStore = create<BrandStore>((set) => ({
  brandData: null,
  fullBrandDNA: null,
  setBrandData: (data) => set({ brandData: data }),
  setFullBrandDNA: (data) => set({ fullBrandDNA: data }),
}));
