import { create } from "zustand";
import type { BrandDNA } from "@/components/ecos/BrandDNAPanel";
import { supabase } from "@/integrations/supabase/client";

interface BrandStore {
  brandData: BrandDNA | null;
  fullBrandDNA: any;
  isLoading: boolean;
  setBrandData: (data: BrandDNA | null) => void;
  setFullBrandDNA: (data: any) => void;
  saveBrandDNA: (data: any, sourceUrl?: string) => Promise<void>;
  loadBrandDNA: () => Promise<void>;
}

export const useBrandStore = create<BrandStore>((set, get) => ({
  brandData: null,
  fullBrandDNA: null,
  isLoading: false,
  setBrandData: (data) => set({ brandData: data }),
  setFullBrandDNA: (data) => set({ fullBrandDNA: data }),

  saveBrandDNA: async (data: any, sourceUrl?: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("brand_dna" as any)
      .upsert(
        { user_id: user.id, data, source_url: sourceUrl || null, updated_at: new Date().toISOString() } as any,
        { onConflict: "user_id" }
      );

    if (error) console.error("Failed to save brand DNA:", error);
  },

  loadBrandDNA: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    set({ isLoading: true });
    const { data, error } = await supabase
      .from("brand_dna" as any)
      .select("data, source_url")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      console.error("Failed to load brand DNA:", error);
      set({ isLoading: false });
      return;
    }

    if (data) {
      const brandDNA = (data as any).data;
      set({ brandData: brandDNA, fullBrandDNA: brandDNA, isLoading: false });
    } else {
      set({ isLoading: false });
    }
  },
}));
