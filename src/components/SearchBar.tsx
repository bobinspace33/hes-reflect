"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Loader2 } from "lucide-react";
import { useUI } from "@/store/ui";

export function SearchBar() {
  const [value, setValue] = useState("");
  const setSearchHits = useUI((s) => s.setSearchHits);
  const searching = useUI((s) => s.searching);
  const setSearching = useUI((s) => s.setSearching);
  const searchHits = useUI((s) => s.searchHits);
  const searchQuery = useUI((s) => s.searchQuery);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = value.trim();
    if (!q) return;
    setSearching(true);
    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ query: q }),
      });
      const json = await res.json();
      if (json.ok) {
        setSearchHits(json.hits, q);
      } else {
        setSearchHits([], q);
      }
    } catch {
      setSearchHits([], q);
    } finally {
      setSearching(false);
    }
  }

  function clear() {
    setValue("");
    setSearchHits([], "");
  }

  return (
    <form onSubmit={onSubmit} className="w-full max-w-xl mx-auto">
      <div className="frosted rounded-full flex items-center gap-2 px-4 py-2.5 text-silver-100">
        <Search size={16} className="opacity-70 shrink-0" />
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Search a word, phrase, or idea…"
          className="flex-1 bg-transparent outline-none placeholder:text-silver-300/45 text-sm font-mono tracking-tight"
        />
        <AnimatePresence>
          {searching ? (
            <motion.div
              key="loader"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="text-gold-300"
            >
              <Loader2 size={16} className="animate-spin" />
            </motion.div>
          ) : value || searchQuery ? (
            <motion.button
              key="clear"
              type="button"
              onClick={clear}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-silver-300/60 hover:text-silver-100"
              aria-label="Clear search"
            >
              <X size={16} />
            </motion.button>
          ) : null}
        </AnimatePresence>
      </div>
      <AnimatePresence>
        {searchQuery && !searching ? (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-[11px] font-mono text-silver-300/60 text-center mt-2 tracking-wider"
          >
            {searchHits.length > 0
              ? `${searchHits.length} passage${searchHits.length === 1 ? "" : "s"} highlighted across documents`
              : "No matches found for that query."}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </form>
  );
}
