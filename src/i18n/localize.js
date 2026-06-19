// Returns the Bengali version of a field when the UI is in Bengali AND a
// Bengali value exists; otherwise falls back to the default (English) value.
//
//   localized(product, "name", i18n.language)
//   localized(category, "name", lang)
//   localized(product, "description", lang)
export function localized(obj, field, lang) {
    if (!obj) return "";
    if (lang === "bn") {
        const bn = obj[`${field}_bn`];
        if (bn && String(bn).trim()) return bn;
    }
    return obj[field] || "";
}
