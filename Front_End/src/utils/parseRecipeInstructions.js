export function parseRecipeInstructions(instructions) {
  if (typeof instructions !== "string" || !instructions.trim()) {
    return [];
  }

  const markers = [];
  const markerPattern = /(^\s*|[.!?]\s+|\r?\n\s*)(\d+)\.\s+/g;
  let match;

  while ((match = markerPattern.exec(instructions)) !== null) {
    markers.push({
      number: match[2],
      start: match.index + match[1].length,
      contentStart: match.index + match[0].length,
    });
  }

  if (
    markers.length === 0 ||
    markers[0].number !== "1" ||
    instructions.slice(0, markers[0].start).trim() !== "" ||
    markers.some((marker, index) => marker.number !== String(index + 1))
  ) {
    return [instructions];
  }

  const steps = markers.map((marker, index) => {
    const nextMarker = markers[index + 1];
    return instructions.slice(marker.contentStart, nextMarker?.start).trim();
  });

  return steps.every(Boolean) ? steps : [instructions];
}
