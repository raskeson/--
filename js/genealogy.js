import {
  getAllData,
  putData,
  generateId
} from "./database.js";

/**
 * 血統親緣管理
 *
 * 支援：
 * 1. 無性繁殖／分株：一個母株 → 多個子株
 * 2. 有性繁殖／雜交：父株 + 母株 → 子株
 * 3. 子株獨立死亡
 * 4. 子株可以再分株
 * 5. 顯示完整親緣樹
 */

const RELATION_STORE = "timeline";

export async function createDivision(parentPlant, children) {
  if (!parentPlant || !children?.length) {
    throw new Error("缺少母株或子株資料");
  }

  const events = [];

  for (const child of children) {
    const event = {
      id: generateId("DIV"),
      plantUid: child.uid,
      type: "division",
      date: new Date().toISOString().slice(0, 10),
      title: "分株",
      description: `由 ${parentPlant.uid} 分株產生`,
      parentUid: parentPlant.uid,
      childUid: child.uid,
      inheritanceType: "asexual",
      createdAt: new Date().toISOString()
    };

    await putData(RELATION_STORE, event);
    events.push(event);
  }

  return events;
}

export async function createHybridization({
  father,
  mother,
  child
}) {
  if (!father || !mother || !child) {
    throw new Error("父株、母株與子株資料不完整");
  }

  const event = {
    id: generateId("HYB"),
    plantUid: child.uid,
    type: "hybridization",
    date: new Date().toISOString().slice(0, 10),
    title: "雜交繁殖",
    description: `${father.uid} × ${mother.uid}`,
    fatherUid: father.uid,
    motherUid: mother.uid,
    childUid: child.uid,
    inheritanceType: "sexual",
    createdAt: new Date().toISOString()
  };

  await putData(RELATION_STORE, event);

  return event;
}

export async function getPlantRelations(plantUid) {
  const events = await getAllData(RELATION_STORE);

  return events.filter(event =>
    event.plantUid === plantUid ||
    event.parentUid === plantUid ||
    event.childUid === plantUid ||
    event.fatherUid === plantUid ||
    event.motherUid === plantUid
  );
}

export async function buildGenealogyTree(rootUid) {
  const plants = await getAllData("plants");
  const events = await getAllData(RELATION_STORE);

  const plantMap = new Map(
    plants.map(plant => [plant.uid, plant])
  );

  const root = plantMap.get(rootUid);

  if (!root) {
    return null;
  }

  const nodeMap = new Map();

  function createNode(uid) {
    if (nodeMap.has(uid)) {
      return nodeMap.get(uid);
    }

    const plant = plantMap.get(uid);

    if (!plant) {
      return null;
    }

    const node = {
      plant,
      children: [],
      parents: []
    };

    nodeMap.set(uid, node);

    return node;
  }

  for (const event of events) {
    if (event.type === "division") {
      const parent = createNode(event.parentUid);
      const child = createNode(event.childUid);

      if (parent && child) {
        if (!parent.children.some(n => n.plant.uid === child.plant.uid)) {
          parent.children.push(child);
        }

        if (!child.parents.some(n => n.plant.uid === parent.plant.uid)) {
          child.parents.push(parent);
        }
      }
    }

    if (event.type === "hybridization") {
      const father = createNode(event.fatherUid);
      const mother = createNode(event.motherUid);
      const child = createNode(event.childUid);

      if (child) {
        if (father) {
          child.parents.push(father);

          if (!father.children.some(n => n.plant.uid === child.plant.uid)) {
            father.children.push(child);
          }
        }

        if (mother) {
          child.parents.push(mother);

          if (!mother.children.some(n => n.plant.uid === child.plant.uid)) {
            mother.children.push(child);
          }
        }
      }
    }
  }

  return createNode(rootUid);
}

export function renderGenealogyNode(node, level = 0) {
  if (!node) {
    return "";
  }

  const plant = node.plant;

  const statusMap = {
    alive: "存活",
    dead: "死亡",
    sold: "已出售",
    gifted: "已贈送"
  };

  const statusText = statusMap[plant.status] || plant.status || "未知";

  const childrenHtml = node.children.length
    ? `
      <div class="genealogy-children">
        ${node.children
          .map(child => renderGenealogyNode(child, level + 1))
          .join("")}
      </div>
    `
    : "";

  return `
    <div class="genealogy-node" data-level="${level}">
      <div class="genealogy-card">
        <div class="genealogy-card-header">
          <strong>${escapeHtml(plant.name)}</strong>
          <span class="status-badge status-${escapeHtml(plant.status || "alive")}">
            ${statusText}
          </span>
        </div>

        <div class="genealogy-uid">
          ${escapeHtml(plant.uid)}
        </div>

        ${
          plant.category
            ? `<div class="genealogy-category">
                ${escapeHtml(plant.category)}
              </div>`
            : ""
        }

        ${
          node.parents.length
            ? `
              <div class="genealogy-parents">
                親本：
                ${node.parents
                  .map(parent => escapeHtml(parent.plant.uid))
                  .join(" × ")}
              </div>
            `
            : ""
        }

        ${
          node.children.length
            ? `<div class="genealogy-child-count">
                子株 ${node.children.length} 株
              </div>`
            : ""
        }
      </div>

      ${childrenHtml}
    </div>
  `;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
