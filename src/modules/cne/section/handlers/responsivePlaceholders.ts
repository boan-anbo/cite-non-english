const COMPACT_PLACEHOLDER_WIDTH = 150;
const STACK_TWO_COLUMN_GRID_WIDTH = 340;

type ResponsivePlaceholderContainer = HTMLElement & {
  __cnePlaceholderResizeObserver?: { disconnect: () => void };
  __cnePlaceholderResizeHandler?: () => void;
};
type ResponsivePlaceholderTextarea = HTMLTextAreaElement & {
  __cneResponsivePlaceholderBound?: boolean;
};

export function clearResponsivePlaceholderObservers(
  container: ResponsivePlaceholderContainer,
): void {
  container.__cnePlaceholderResizeObserver?.disconnect();
  container.__cnePlaceholderResizeObserver = undefined;

  const resizeHandler = container.__cnePlaceholderResizeHandler;
  const view = container.ownerDocument?.defaultView;
  if (resizeHandler && view) {
    view.removeEventListener("resize", resizeHandler);
  }
  container.__cnePlaceholderResizeHandler = undefined;
}

function updatePlaceholder(textarea: HTMLTextAreaElement): void {
  const full = textarea.dataset.placeholderFull || "";
  const compact = textarea.dataset.placeholderShort || full;
  const isShowingPlaceholder = textarea.value === "";
  const next =
    compact && textarea.clientWidth < COMPACT_PLACEHOLDER_WIDTH
      ? compact
      : full;

  if (textarea.placeholder !== next) {
    textarea.placeholder = next;
  }

  textarea.wrap = isShowingPlaceholder ? "off" : "soft";
  textarea.classList.toggle(
    "cne-text-input--placeholder-nowrap",
    isShowingPlaceholder,
  );
}

function updateTwoColumnGrid(grid: HTMLElement): void {
  grid.classList.toggle(
    "cne-field-grid--stacked",
    grid.clientWidth < STACK_TWO_COLUMN_GRID_WIDTH,
  );
}

/**
 * Keep CNE placeholder examples readable when the item pane is narrow.
 *
 * Textareas wrap placeholders by default, which makes long examples look broken
 * in the two-column creator grid. Use compact examples only when the rendered
 * input width is narrow, and stack the creator grid before the inputs become
 * too small to show useful examples.
 */
export function setupResponsivePlaceholders(container: HTMLElement): void {
  const responsiveContainer = container as ResponsivePlaceholderContainer;
  clearResponsivePlaceholderObservers(responsiveContainer);

  const textareas = Array.from(
    container.querySelectorAll(
      "textarea.cne-text-input[data-placeholder-full]",
    ),
  ) as HTMLTextAreaElement[];
  const twoColumnGrids = Array.from(
    container.querySelectorAll(".cne-field-grid--two-column"),
  ) as HTMLElement[];

  if (textareas.length === 0 && twoColumnGrids.length === 0) {
    return;
  }

  textareas.forEach((textarea) => {
    updatePlaceholder(textarea);

    const responsiveTextarea = textarea as ResponsivePlaceholderTextarea;
    if (!responsiveTextarea.__cneResponsivePlaceholderBound) {
      const update = () => updatePlaceholder(responsiveTextarea);
      responsiveTextarea.addEventListener("input", update);
      responsiveTextarea.addEventListener("change", update);
      responsiveTextarea.__cneResponsivePlaceholderBound = true;
    }
  });
  twoColumnGrids.forEach(updateTwoColumnGrid);

  const ownerDocument = container.ownerDocument;
  if (!ownerDocument) {
    return;
  }

  const view = ownerDocument.defaultView;
  const ResizeObserverCtor =
    view?.ResizeObserver || (globalThis as any).ResizeObserver;

  if (ResizeObserverCtor) {
    const observer = new ResizeObserverCtor((entries: any[]) => {
      for (const entry of entries) {
        const target = entry.target as HTMLElement;
        if (target.matches("textarea.cne-text-input")) {
          updatePlaceholder(target as HTMLTextAreaElement);
        } else {
          updateTwoColumnGrid(target);
        }
      }
    });

    textareas.forEach((textarea) => observer.observe(textarea));
    twoColumnGrids.forEach((grid) => observer.observe(grid));
    responsiveContainer.__cnePlaceholderResizeObserver = observer;
    return;
  }

  const resizeHandler = () => {
    textareas.forEach(updatePlaceholder);
    twoColumnGrids.forEach(updateTwoColumnGrid);
  };
  view?.addEventListener("resize", resizeHandler);
  responsiveContainer.__cnePlaceholderResizeHandler = resizeHandler;
}
