import { render } from "@testing-library/react-native";
import AppIcon, { icons, type IconName } from "../AppIcon";

// `IconName` is `keyof typeof icons`, so it can never itself drift from the
// map's keys - but that only guarantees every *key* has a *value*, not that
// every value is a real, renderable component (a typo'd import, e.g. mapping
// a name to an identifier that doesn't exist, is `undefined` at runtime and
// AppIcon's `icons[name] || Circle` fallback would silently swallow it as a
// generic circle everywhere that icon is used). This exercises every actual
// entry in the map, not just the type.
describe("AppIcon icon map coverage", () => {
  const names = Object.keys(icons) as IconName[];

  it("has icons defined", () => {
    expect(names.length).toBeGreaterThan(0);
  });

  it.each(names)("maps %s to a defined, renderable icon component", (name) => {
    expect(icons[name]).toBeDefined();
    expect(() => render(<AppIcon name={name} />)).not.toThrow();
  });
});
