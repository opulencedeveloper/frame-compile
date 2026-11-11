import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Conversion, ConversionList, ConversionsState } from "@/types/conversion";
import { SiteFilter } from "@/utils/enum";

const initialState: ConversionsState = {
  newConversion: { isOpen: false, url: "" },
  conversions: [],
  counts: null,
  nextCursor: null,
  hasLoaded: false,
  filter: SiteFilter.All,
  search: "",
};

const conversionsSlice = createSlice({
  name: "conversions",
  initialState,
  reducers: {
    // The first page for the current filter and search.
    setPage(state, action: PayloadAction<ConversionList>) {
      state.conversions = action.payload.conversions;
      state.counts = action.payload.counts;
      state.nextCursor = action.payload.nextCursor;
      state.hasLoaded = true;
    },

    appendPage(state, action: PayloadAction<ConversionList>) {
      state.conversions.push(...action.payload.conversions);
      state.counts = action.payload.counts;
      state.nextCursor = action.payload.nextCursor;
    },

    // Fresh copies of conversions already shown (still running ones
    // finishing); new ones aren't added mid-list.
    refreshConversions(state, action: PayloadAction<ConversionList>) {
      const fresh = new Map(action.payload.conversions.map((conversion) => [conversion.id, conversion]));
      state.conversions = state.conversions.map((conversion) => fresh.get(conversion.id) ?? conversion);
      state.counts = action.payload.counts;
    },

    removeConversion(state, action: PayloadAction<Conversion>) {
      state.conversions = state.conversions.filter((conversion) => conversion.id !== action.payload.id);
      if (state.counts) {
        state.counts.all = Math.max(0, state.counts.all - 1);
        state.counts.notDeployed = Math.max(0, state.counts.notDeployed - 1);
      }
    },

    // The URL fills the form, e.g. from the landing page's.
    openNewConversion(state, action: PayloadAction<string | undefined>) {
      state.newConversion = { isOpen: true, url: action.payload ?? "" };
    },

    closeNewConversion(state) {
      state.newConversion = { isOpen: false, url: "" };
    },

    setFilter(state, action: PayloadAction<SiteFilter>) {
      state.filter = action.payload;
    },

    setSearch(state, action: PayloadAction<string>) {
      state.search = action.payload;
    },
  },
});

export const conversionsActions = conversionsSlice.actions;
export default conversionsSlice;
