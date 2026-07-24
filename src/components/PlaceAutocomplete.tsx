import { useEffect, useRef, useState } from "react";
import { loadGoogleMaps } from "@/lib/gmaps";
import type { Place } from "@/lib/store";

type Prediction = {
  placeId: string;
  mainText: string;
  secondaryText: string;
};

export function PlaceAutocomplete({
  value,
  placeholder,
  onSelect,
  onClear,
}: {
  value: Place | null;
  placeholder: string;
  onSelect: (p: Place) => void;
  onClear?: () => void;
}) {
  const [input, setInput] = useState(value?.name ?? "");
  const [preds, setPreds] = useState<Prediction[]>([]);
  const [open, setOpen] = useState(false);
  const sessionRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null);
  const svcRef = useRef<any>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    setInput(value?.name ?? "");
  }, [value]);

  useEffect(() => {
    loadGoogleMaps().then((g) => {
      // New Places API - AutocompleteSuggestion
      sessionRef.current = new g.maps.places.AutocompleteSessionToken();
      svcRef.current = g.maps.places;
    });
  }, []);

  const query = (text: string) => {
    if (!text.trim() || !svcRef.current) {
      setPreds([]);
      return;
    }
    const { AutocompleteSuggestion } = svcRef.current;
    AutocompleteSuggestion.fetchAutocompleteSuggestions({
      input: text,
      sessionToken: sessionRef.current,
      language: "ko",
      region: "kr",
    })
      .then((res: any) => {
        const items: Prediction[] = (res.suggestions ?? []).slice(0, 6).map((s: any) => {
          const p = s.placePrediction;
          return {
            placeId: p?.placeId ?? "",
            mainText: p?.mainText?.text ?? p?.text?.text ?? "",
            secondaryText: p?.secondaryText?.text ?? "",
          };
        });
        setPreds(items.filter((i) => i.mainText));
      })
      .catch(() => setPreds([]));
  };

  const handleChange = (v: string) => {
    setInput(v);
    setOpen(true);
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => query(v), 200);
  };

  const pick = async (p: Prediction) => {
    if (!svcRef.current) return;
    const { Place } = svcRef.current;
    const place = new Place({ id: p.placeId });
    await place.fetchFields({ fields: ["displayName", "location", "formattedAddress"] });
    const loc = place.location;
    if (!loc) return;
    onSelect({
      name: place.displayName ?? p.mainText,
      address: place.formattedAddress ?? p.secondaryText,
      lat: loc.lat(),
      lng: loc.lng(),
    });
    setInput(place.displayName ?? p.mainText);
    setOpen(false);
    setPreds([]);
    sessionRef.current = new (window as any).google.maps.places.AutocompleteSessionToken();
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-2 rounded-lg bg-white px-2 py-1.5">
        <input
          value={input}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
        {input && onClear ? (
          <button
            type="button"
            onClick={() => {
              setInput("");
              onClear();
              setPreds([]);
            }}
            aria-label="지우기"
            className="text-muted-foreground text-xs"
          >
            ✕
          </button>
        ) : (
          <span className="text-muted-foreground">🔍</span>
        )}
      </div>
      {open && preds.length > 0 && (
        <ul className="absolute left-0 right-0 top-full z-30 mt-1 max-h-64 overflow-auto rounded-xl border border-border bg-popover shadow-lg">
          {preds.map((p) => (
            <li key={p.placeId}>
              <button
                type="button"
                onClick={() => pick(p)}
                className="block w-full px-3 py-2 text-left hover:bg-accent"
              >
                <div className="text-sm font-medium text-foreground">{p.mainText}</div>
                {p.secondaryText && (
                  <div className="text-xs text-muted-foreground">{p.secondaryText}</div>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
