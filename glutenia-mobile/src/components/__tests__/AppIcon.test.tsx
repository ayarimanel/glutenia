import { render } from "@testing-library/react-native";
import AppIcon, { icons, type IconName } from "../AppIcon";

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
