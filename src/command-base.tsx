export async function renderPick<T>(
  items: T[],
  opts: {
    allowRunningSelection?: boolean;
    labelOf: (item: T) => string;
    runningOf: (item: T) => boolean;
    title: string;
  }
): Promise<T[]> {
  const [{ render }, { MultiSelect }] = await Promise.all([
    import("ink"),
    import("@/tui/multi-select"),
  ]);
  return new Promise<T[]>((resolve) => {
    const { unmount } = render(
      <MultiSelect
        allowRunningSelection={opts.allowRunningSelection}
        items={items}
        labelOf={opts.labelOf}
        onSubmit={(sel) => {
          unmount();
          resolve(sel);
        }}
        runningOf={opts.runningOf}
        title={opts.title}
      />
    );
  });
}
