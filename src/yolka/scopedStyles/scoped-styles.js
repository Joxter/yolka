import css from "css";
import { forEachNodes } from "../../utils.js";

export function scopedStyles(Components) {
  Object.values(Components).forEach((comp) => makeUniq(comp));
}

const noStyleTags = new Set(["html", "link", "style", "script", "title", "head", "meta"]);

function makeUniq(component) {
  if (!component.style) {
    return;
  }

  const unicClass = "-c-" + component.uid;
  const rawStyles = component.style;
  const cssData = css.parse(rawStyles);
  const cssRules = cssData.stylesheet.rules;

  forEachNodes(component, (node) => {
    if (node.type !== "tag") {
      return;
    }
    if (node.type === "tag" && noStyleTags.has(node.name)) {
      return;
    }

    if (!node.attribs.class) {
      node.attribs.class = unicClass;
    } else {
      node.attribs.class += ` ${unicClass}`;
    }
  });

  cssRules.forEach((rule) => {
    if (rule.type === "media") {
      rule.rules.forEach((innerRule) => {
        innerRule.selectors = innerRule.selectors.map((selector) => modifyRule(selector, unicClass));
      });
    } else {
      rule.selectors = rule.selectors.map((selector) => modifyRule(selector, unicClass));
    }
  });

  component.style = css.stringify(cssData);
}

function eq(pattern) {
  return (char) => pattern === char;
}

function byRegexp(reg) {
  return (char) => reg.test(char);
}

const toNone = byRegexp(/[\s+~>]/i);
const machine = [
  ["none", eq("*"), "none"],
  ["none", eq("."), "dot"],
  ["none", eq(":"), "colon"],
  ["none", byRegexp(/\w/i), "tag"],
  //
  ["tag", byRegexp(/\w/i), "tag"],
  ["tag", eq("."), "dot"],
  ["tag", eq(":"), "colon", true],
  ["tag", toNone, "none", true],
  //
  ["colon", eq(":"), "pseudo"],
  ["colon", byRegexp(/[\w-()]/i), "pseudo"],
  ["pseudo", byRegexp(/[\w-()]/i), "pseudo"],
  ["pseudo", toNone, "none"],
  //
  ["dot", byRegexp(/[\w-]/i), "class"],
  ["class", byRegexp(/[\w-]/i), "class"],
  ["class", eq("."), "dot"],
  ["class", eq(":"), "colon", true],
  ["class", toNone, "none", true],
];

export function modifyRule(selector, salt) {
  if (selector.includes("#")) {
    return selector;
  }

  const selectorArr = selector.split("");
  salt = "." + salt;
  let currState = "none";

  for (let i = 0; i < selectorArr.length; i++) {
    const char = selectorArr[i];

    for (const [fromState, tester, nextState, needAddSalt] of machine) {
      if (currState === fromState && tester(char)) {
        currState = nextState;
        if (needAddSalt) selectorArr.splice(i, 0, salt);
        break;
      }
    }
  }

  if (currState === "class" || currState === "tag") selectorArr.push(salt);

  return selectorArr.join("");
}
