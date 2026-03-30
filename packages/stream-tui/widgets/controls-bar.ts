import blessed from "neo-blessed";

export function createControlsBar(
  parent: blessed.Widgets.Screen,
  options: { bottom: number }
): {
  element: blessed.Widgets.BoxElement;
} {
  const box = blessed.box({
    parent,
    bottom: options.bottom,
    left: 0,
    width: "100%",
    height: 2,
    tags: true,
    padding: { left: 1, right: 1 },
    style: {
      fg: "grey",
    },
  });

  box.setContent(
    "{bold}p{/}:pause  {bold}m{/}:mute  {bold}c{/}:chat  {bold}l{/}:layout  " +
      "{bold}\u2191\u2193{/}:vol\n" +
      "{bold}q{/}:hide  {bold}Q{/}:quit"
  );

  return { element: box };
}
