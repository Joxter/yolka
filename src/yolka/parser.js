import { parseDocument } from "htmlparser2";
import { removeElement } from "domutils";
import { forEachNodes } from "../utils.js";

function initComponents(componentsAST) {
  const Components = {};

  componentsAST.forEach((componentAST, i) => {
    const component = getServiceNodes(componentAST);
    component.uid = i;
    Components[component.name] = component;
  });

  return Components;
}

const COMPONENT_ATTRS = {
  NAME: "name",
  PROPS: "props",
  SLOTS: "slots",
};

export function parse(componentStrs, pageStrs) {
  const pages = pageStrs.map(page => getServiceNodes(parseDocument(page), true));

  const Components = initComponents(
    componentStrs.map(template => {
      return parseDocument(template);
    })
  );

  return [Components, pages];
}

function getServiceNodes(componentAST, isPage = false) {
  const templateEl = getComponentTemplateTag(componentAST, isPage);

  const name = isPage ? null : templateEl.attribs[COMPONENT_ATTRS.NAME];
  if (!isPage && !name) {
    // todo может сюда что-то подставлять, типа название файла?
    throw new Error("Component name should have a name");
  }

  let style = null;
  let componentNodes = [];
  let nodesToData = []; // текстовые ноды, в которые можно вставить какой-то текст "some text {insert}"
  const props = isPage ? [] : parseProps(templateEl.attribs[COMPONENT_ATTRS.PROPS]);
  const slots = isPage ? [] : parseProps(templateEl.attribs[COMPONENT_ATTRS.SLOTS]);

  forEachNodes(templateEl, el => {
    if (el.type === "tag") {
      if (el.name.includes("-")) {
        el.type = "component"; // hack первый хак парсера, нужен чтоб подружить AST с моей логикой
        componentNodes.push(el);
      }
    } else if (el.type === "text") {
      if (el.data.includes("{")) {
        // fixme исправить на более надежное и правильное, наверное это новый тип ноды
        //  чтоб insertDataToSting не понадобилось, а весь парсинг делать тут
        //  может как-то так "Hello, {user.name}!" => ["hello," + ['user', 'name'], '!'];
        nodesToData.push(el);
      }
    } else if (el.type === "style") {
      if (!style) {
        style = el;
      }
    }
  });
  if (style) {
    removeElement(style);
  }

  return {
    name, // имя компонента
    type: isPage ? "page" : "component",
    props, // имена параметров
    slots, // имена слотов
    style, // нода <style>
    children: templateEl.children, // осонвная верстка
    componentNodes, // ссылки на ноды вложенных компонентов
    nodesToData, // ссылки на ноды куда можно вставить некий текст
  };
}

function parseProps(str) {
  if (!str) {
    return [];
  }

  return str
    .trim()
    .split(/\s+/g)
    .filter(str => !!str);
}

function getComponentTemplateTag(node, isPage = false) {
  if (isPage) return node;

  const res = node.children[0];
  if (res.name === "template") {
    return res;
  }

  throw new Error("Can't get component's template");
}
