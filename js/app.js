import {
  openDatabase,
  putData,
  getAllData,
  getData,
  deleteData,
  generatePlantUID,
  generateId
} from "./database.js";

import {
  createDivision,
  createHybridization,
  buildGenealogyTree,
  renderGenealogyNode
} from "./genealogy.js";

import {
  addTimelineEvent,
  getPlantTimeline,
  renderTimeline,
  deleteTimelineEvent
} from "./timeline.js";


/* =========================================================
   全域狀態
========================================================= */

const state = {
  currentPage: "dashboard",

  editingPlantId: null,
  selectedPlantUid: null,

  plants: [],
  locations: [],
  timeline: []
};


/* =========================================================
   初始化
========================================================= */

async function init() {
  try {
    await openDatabase();

    await loadData();

    setupNavigation();
    setupButtons();
    setupModals();
    setupForms();
    setupSearch();

    renderAll();

    registerServiceWorker();

    console.log("智慧園藝管理初始化完成");
  } catch (error) {
    console.error("初始化失敗：", error);
    showToast("系統初始化失敗，請重新整理頁面");
  }
}


/* =========================================================
   資料載入
========================================================= */

async function loadData() {
  state.plants = await getAllData("plants");
  state.locations = await getAllData("locations");
  state.timeline = await getAllData("timeline");

  state.plants.sort((a, b) => {
    return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
  });

  state.locations.sort((a, b) => {
    return String(a.name || "").localeCompare(
      String(b.name || ""),
      "zh-Hant"
    );
  });
}


/* =========================================================
   導覽
========================================================= */

function setupNavigation() {
  document.querySelectorAll("[data-page]").forEach(button => {
    button.addEventListener("click", () => {
      const page = button.dataset.page;

      if (!page) {
        return;
      }

      navigateTo(page);
    });
  });

  const mobileMenuButton =
    document.querySelector(".mobile-menu-button");

  const sidebar =
    document.querySelector(".sidebar");

  if (mobileMenuButton && sidebar) {
    mobileMenuButton.addEventListener("click", () => {
      sidebar.classList.toggle("open");
    });
  }
}


function navigateTo(page) {
  state.currentPage = page;

  document.querySelectorAll(".page").forEach(section => {
    section.classList.remove("active");
  });

  const target =
    document.getElementById(`${page}Page`);

  if (target) {
    target.classList.add("active");
  }

  document.querySelectorAll("[data-page]").forEach(button => {
    button.classList.toggle(
      "active",
      button.dataset.page === page
    );
  });

  renderCurrentPage();

  const sidebar =
    document.querySelector(".sidebar");

  if (sidebar) {
    sidebar.classList.remove("open");
  }
}


/* =========================================================
   按鈕
========================================================= */

function setupButtons() {
  const addPlantButton =
    document.getElementById("addPlantButton");

  if (addPlantButton) {
    addPlantButton.addEventListener("click", () => {
      openPlantModal();
    });
  }

  const addLocationButton =
    document.getElementById("addLocationButton");

  if (addLocationButton) {
    addLocationButton.addEventListener("click", () => {
      openLocationModal();
    });
  }

  const quickAddPlant =
    document.getElementById("quickAddPlant");

  if (quickAddPlant) {
    quickAddPlant.addEventListener("click", () => {
      openPlantModal();
    });
  }

  const quickAddLocation =
    document.getElementById("quickAddLocation");

  if (quickAddLocation) {
    quickAddLocation.addEventListener("click", () => {
      openLocationModal();
    });
  }
}


/* =========================================================
   Modal
========================================================= */

function setupModals() {
  const plantModal =
    document.getElementById("plantModal");

  const locationModal =
    document.getElementById("locationModal");

  document
    .querySelectorAll("[data-close-modal]")
    .forEach(button => {
      button.addEventListener("click", () => {
        const modalId = button.dataset.closeModal;

        const modal =
          document.getElementById(modalId);

        if (modal) {
          closeModal(modal);
        }
      });
    });

  [plantModal, locationModal].forEach(modal => {
    if (!modal) {
      return;
    }

    modal.addEventListener("click", event => {
      if (event.target === modal) {
        closeModal(modal);
      }
    });
  });
}


function openModal(modal) {
  if (!modal) {
    return;
  }

  modal.classList.add("active");
  modal.removeAttribute("hidden");
}


function closeModal(modal) {
  if (!modal) {
    return;
  }

  modal.classList.remove("active");
  modal.setAttribute("hidden", "");
}


/* =========================================================
   植物 Modal
========================================================= */

function openPlantModal(plant = null) {
  const modal =
    document.getElementById("plantModal");

  const form =
    document.getElementById("plantForm");

  if (!modal || !form) {
    return;
  }

  state.editingPlantId = plant?.id || null;

  form.reset();

  const uidInput =
    document.getElementById("plantUid");

  const nameInput =
    document.getElementById("plantName");

  const categoryInput =
    document.getElementById("plantCategory");

  const locationInput =
    document.getElementById("plantLocation");

  const statusInput =
    document.getElementById("plantStatus");

  const purchaseDateInput =
    document.getElementById("plantPurchaseDate");

  const costInput =
    document.getElementById("plantCost");

  const parentInput =
    document.getElementById("plantParent");

  const notesInput =
    document.getElementById("plantNotes");

  updateLocationOptions();

  if (plant) {
    uidInput.value = plant.uid || "";
    nameInput.value = plant.name || "";
    categoryInput.value = plant.category || "";
    locationInput.value = plant.locationId || "";
    statusInput.value = plant.status || "alive";
    purchaseDateInput.value =
      plant.purchaseDate || "";
    costInput.value =
      plant.cost ?? "";
    parentInput.value =
      plant.parentUid || "";
    notesInput.value =
      plant.notes || "";

    const title =
      modal.querySelector(".modal-title");

    if (title) {
      title.textContent = "編輯植物";
    }
  } else {
    uidInput.value = generatePlantUID();

    statusInput.value = "alive";

    const title =
      modal.querySelector(".modal-title");

    if (title) {
      title.textContent = "新增植物";
    }
  }

  openModal(modal);
}


/* =========================================================
   場域下拉
========================================================= */

function updateLocationOptions() {
  const select =
    document.getElementById("plantLocation");

  if (!select) {
    return;
  }

  const currentValue = select.value;

  select.innerHTML = `
    <option value="">未指定場域</option>
    ${state.locations
      .map(location => `
        <option value="${escapeHtml(location.id)}">
          ${escapeHtml(location.name)}
        </option>
      `)
      .join("")}
  `;

  select.value = currentValue;
}


/* =========================================================
   表單
========================================================= */

function setupForms() {
  const plantForm =
    document.getElementById("plantForm");

  if (plantForm) {
    plantForm.addEventListener("submit", async event => {
      event.preventDefault();

      await savePlant();
    });
  }

  const locationForm =
    document.getElementById("locationForm");

  if (locationForm) {
    locationForm.addEventListener("submit", async event => {
      event.preventDefault();

      await saveLocation();
    });
  }
}


/* =========================================================
   儲存植物
========================================================= */

async function savePlant() {
  const name =
    document.getElementById("plantName")?.value.trim();

  const uid =
    document.getElementById("plantUid")?.value.trim();

  const category =
    document.getElementById("plantCategory")?.value.trim();

  const locationId =
    document.getElementById("plantLocation")?.value || "";

  const status =
    document.getElementById("plantStatus")?.value || "alive";

  const purchaseDate =
    document.getElementById("plantPurchaseDate")?.value || "";

  const costRaw =
    document.getElementById("plantCost")?.value;

  const parentUid =
    document.getElementById("plantParent")?.value.trim() || "";

  const notes =
    document.getElementById("plantNotes")?.value.trim() || "";

  if (!name) {
    showToast("植物名稱不可為空白");
    return;
  }

  const cost =
    costRaw === ""
      ? 0
      : Number(costRaw);

  if (Number.isNaN(cost) || cost < 0) {
    showToast("成本不得小於 0");
    return;
  }

  if (!uid) {
    showToast("植物 UID 不可為空白");
    return;
  }

  const duplicateUid = state.plants.find(
    plant =>
      plant.uid === uid &&
      plant.id !== state.editingPlantId
  );

  if (duplicateUid) {
    showToast("植物 UID 已存在");
    return;
  }

  const existingPlant =
    state.plants.find(
      plant => plant.id === state.editingPlantId
    );

  const now =
    new Date().toISOString();

  const plant = {
    id:
      existingPlant?.id ||
      generateId("PLANT"),

    uid,

    name,

    category,

    locationId,

    status,

    purchaseDate,

    cost,

    parentUid,

    notes,

    createdAt:
      existingPlant?.createdAt || now,

    updatedAt: now
  };

  await putData("plants", plant);

  if (!existingPlant) {
    await addTimelineEvent({
      plantUid: plant.uid,
      type: "purchase",
      date:
        purchaseDate ||
        new Date().toISOString().slice(0, 10),
      title: "植物建立",
      description:
        `建立植物 ${plant.name}（${plant.uid}）`
    });
  }

  if (
    existingPlant &&
    existingPlant.status !== plant.status
  ) {
    await handleStatusChange(
      existingPlant,
      plant
    );
  }

  await reloadAndRender();

  closeModal(
    document.getElementById("plantModal")
  );

  state.editingPlantId = null;

  showToast(
    existingPlant
      ? "植物資料已更新"
      : "植物已新增"
  );
}


/* =========================================================
   植物狀態變更
========================================================= */

async function handleStatusChange(
  oldPlant,
  newPlant
) {
  const statusText = {
    alive: "存活",
    dead: "死亡",
    sold: "已出售",
    gifted: "已贈送"
  };

  const currentStatus =
    statusText[newPlant.status] ||
    newPlant.status;

  let type = "note";

  if (newPlant.status === "dead") {
    type = "death";
  } else if (newPlant.status === "sold") {
    type = "sold";
  } else if (newPlant.status === "gifted") {
    type = "gifted";
  }

  await addTimelineEvent({
    plantUid: newPlant.uid,
    type,
    date:
      new Date().toISOString().slice(0, 10),
    title: `狀態變更：${currentStatus}`,
    description:
      `${statusText[oldPlant.status] || oldPlant.status} → ${currentStatus}`
  });
}


/* =========================================================
   儲存場域
========================================================= */

async function saveLocation() {
  const name =
    document.getElementById("locationName")
      ?.value.trim();

  const city =
    document.getElementById("locationCity")
      ?.value.trim() || "";

  const district =
    document.getElementById("locationDistrict")
      ?.value.trim() || "";

  const light =
    document.getElementById("locationLight")
      ?.value || "";

  const ventilation =
    document.getElementById("locationVentilation")
      ?.value || "";

  const rain =
    document.getElementById("locationRain")
      ?.value || "";

  const notes =
    document.getElementById("locationNotes")
      ?.value.trim() || "";

  if (!name) {
    showToast("場域名稱不可為空白");
    return;
  }

  const existingId =
    document.getElementById("locationForm")
      ?.dataset.editingId || null;

  const existing =
    state.locations.find(
      location => location.id === existingId
    );

  const location = {
    id:
      existing?.id ||
      generateId("LOC"),

    name,

    city,

    district,

    light,

    ventilation,

    rain,

    notes,

    createdAt:
      existing?.createdAt ||
      new Date().toISOString(),

    updatedAt:
      new Date().toISOString()
  };

  await putData(
    "locations",
    location
  );

  const form =
    document.getElementById("locationForm");

  if (form) {
    form.dataset.editingId = "";
    form.reset();
  }

  await reloadAndRender();

  closeModal(
    document.getElementById("locationModal")
  );

  showToast(
    existing
      ? "場域資料已更新"
      : "場域已新增"
  );
}


/* =========================================================
   儀表板
========================================================= */

function renderDashboard() {
  const totalPlants =
    state.plants.length;

  const alivePlants =
    state.plants.filter(
      plant => plant.status === "alive"
    ).length;

  const totalLocations =
    state.locations.length;

  const totalSplits =
    state.timeline.filter(
      event => event.type === "division"
    ).length;

  setText(
    "totalPlants",
    totalPlants
  );

  setText(
    "alivePlants",
    alivePlants
  );

  setText(
    "totalLocations",
    totalLocations
  );

  setText(
    "totalSplits",
    totalSplits
  );

  renderRecentPlants();
}


function renderRecentPlants() {
  const container =
    document.getElementById("recentPlants");

  if (!container) {
    return;
  }

  const recent =
    [...state.plants]
      .sort(
        (a, b) =>
          new Date(b.createdAt || 0) -
          new Date(a.createdAt || 0)
      )
      .slice(0, 6);

  if (!recent.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🌱</div>
        <h3>尚無植物資料</h3>
        <p>先建立第一株植物吧。</p>
      </div>
    `;

    return;
  }

  container.innerHTML =
    recent
      .map(createPlantCard)
      .join("");
}


/* =========================================================
   植物列表
========================================================= */

function renderPlants() {
  const container =
    document.getElementById("plantsContainer");

  if (!container) {
    return;
  }

  const search =
    document
      .getElementById("plantSearch")
      ?.value
      .trim()
      .toLowerCase() || "";

  const status =
    document
      .getElementById("plantStatusFilter")
      ?.value || "all";

  let plants =
    [...state.plants];

  if (search) {
    plants = plants.filter(plant => {
      const text = [
        plant.uid,
        plant.name,
        plant.category,
        plant.parentUid
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return text.includes(search);
    });
  }

  if (status !== "all") {
    plants =
      plants.filter(
        plant => plant.status === status
      );
  }

  if (!plants.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🌿</div>
        <h3>找不到植物</h3>
        <p>目前沒有符合條件的植物資料。</p>
      </div>
    `;

    return;
  }

  container.innerHTML =
    plants
      .map(createPlantCard)
      .join("");
}


/* =========================================================
   植物卡片
========================================================= */

function createPlantCard(plant) {
  const statusMap = {
    alive: "存活",
    dead: "死亡",
    sold: "已出售",
    gifted: "已贈送"
  };

  const status =
    statusMap[plant.status] ||
    plant.status ||
    "未知";

  const location =
    state.locations.find(
      location =>
        location.id === plant.locationId
    );

  const splitCount =
    state.timeline.filter(
      event =>
        event.type === "division" &&
        event.parentUid === plant.uid
    ).length;

  return `
    <article class="plant-card">

      <div class="plant-card-top">

        <div class="plant-icon">
          🌱
        </div>

        <div class="plant-main">

          <div class="plant-title-row">
            <h3>
              ${escapeHtml(plant.name)}
            </h3>

            <span class="status-badge status-${escapeHtml(
              plant.status || "alive"
            )}">
              ${escapeHtml(status)}
            </span>
          </div>

          <div class="plant-uid">
            ${escapeHtml(plant.uid)}
          </div>

          ${
            plant.category
              ? `
                <div class="plant-category">
                  ${escapeHtml(plant.category)}
                </div>
              `
              : ""
          }

        </div>

      </div>

      <div class="plant-info">

        ${
          location
            ? `
              <div>
                <span>📍</span>
                ${escapeHtml(location.name)}
              </div>
            `
            : `
              <div>
                <span>📍</span>
                未指定場域
              </div>
            `
        }

        ${
          plant.purchaseDate
            ? `
              <div>
                <span>📅</span>
                ${escapeHtml(plant.purchaseDate)}
              </div>
            `
            : ""
        }

        ${
          plant.cost !== undefined &&
          plant.cost !== null
            ? `
              <div>
                <span>💰</span>
                $${Number(plant.cost).toLocaleString()}
              </div>
            `
            : ""
        }

        ${
          splitCount > 0
            ? `
              <div>
                <span>✂️</span>
                已分株 ${splitCount} 次
              </div>
            `
            : ""
        }

      </div>

      ${
        plant.parentUid
          ? `
            <div class="plant-tags">
              <span class="tag">
                親株：${escapeHtml(plant.parentUid)}
              </span>
            </div>
          `
          : ""
      }

      <div class="plant-actions">

        <button
          class="btn btn-secondary btn-small"
          data-action="timeline"
          data-id="${escapeHtml(plant.id)}"
        >
          📅 履歷
        </button>

        <button
          class="btn btn-secondary btn-small"
          data-action="genealogy"
          data-uid="${escapeHtml(plant.uid)}"
        >
          🌳 親緣
        </button>

        <button
          class="btn btn-secondary btn-small"
          data-action="division"
          data-id="${escapeHtml(plant.id)}"
        >
          ✂️ 分株
        </button>

        <button
          class="btn btn-secondary btn-small"
          data-action="edit"
          data-id="${escapeHtml(plant.id)}"
        >
          編輯
        </button>

        <button
          class="btn btn-danger btn-small"
          data-action="delete"
          data-id="${escapeHtml(plant.id)}"
        >
          刪除
        </button>

      </div>

    </article>
  `;
}


/* =========================================================
   植物卡片操作
========================================================= */

document.addEventListener("click", async event => {
  const button =
    event.target.closest(
      "[data-action]"
    );

  if (!button) {
    return;
  }

  const action =
    button.dataset.action;

  const id =
    button.dataset.id;

  const uid =
    button.dataset.uid;

  switch (action) {
    case "edit":
      editPlant(id);
      break;

    case "delete":
      await deletePlant(id);
      break;

    case "timeline":
      await showPlantTimelineById(id);
      break;

    case "genealogy":
      await showGenealogy(uid);
      break;

    case "division":
      await dividePlant(id);
      break;

    default:
      break;
  }
});


/* =========================================================
   編輯植物
========================================================= */

function editPlant(id) {
  const plant =
    state.plants.find(
      item => item.id === id
    );

  if (!plant) {
    return;
  }

  openPlantModal(plant);
}


/* =========================================================
   刪除植物
========================================================= */

async function deletePlant(id) {
  const plant =
    state.plants.find(
      item => item.id === id
    );

  if (!plant) {
    return;
  }

  const confirmed =
    window.confirm(
      `確定要刪除「${plant.name}」嗎？\n\n此操作會刪除植物資料。`
    );

  if (!confirmed) {
    return;
  }

  await deleteData(
    "plants",
    id
  );

  const events =
    await getAllData("timeline");

  for (const event of events) {
    if (event.plantUid === plant.uid) {
      await deleteTimelineEvent(
        event.id
      );
    }
  }

  await reloadAndRender();

  showToast("植物已刪除");
}


/* =========================================================
   分株
========================================================= */

async function dividePlant(id) {
  const parent =
    state.plants.find(
      plant => plant.id === id
    );

  if (!parent) {
    return;
  }

  const countInput =
    window.prompt(
      `「${parent.name}」要分成幾株？\n\n例如輸入 3`
    );

  if (
    countInput === null ||
    countInput.trim() === ""
  ) {
    return;
  }

  const count =
    Number(countInput);

  if (
    !Number.isInteger(count) ||
    count <= 0 ||
    count > 50
  ) {
    showToast(
      "分株數量必須是 1～50 的整數"
    );

    return;
  }

  const children = [];

  for (let i = 1; i <= count; i++) {
    const uid =
      `${parent.uid}-${String(i).padStart(2, "0")}`;

    let childUid = uid;

    let suffix = 2;

    while (
      state.plants.some(
        plant => plant.uid === childUid
      )
    ) {
      childUid =
        `${parent.uid}-${String(i).padStart(2, "0")}-${suffix}`;

      suffix++;
    }

    const childName =
      `${parent.name} 分株 ${i}`;

    const child = {
      id: generateId("PLANT"),

      uid: childUid,

      name: childName,

      category:
        parent.category || "",

      locationId:
        parent.locationId || "",

      status: "alive",

      purchaseDate:
        new Date()
          .toISOString()
          .slice(0, 10),

      /*
       * 無性繁殖：
       * 子株繼承母株植物資訊，
       * 但成本可以獨立管理。
       */
      cost: 0,

      parentUid:
        parent.uid,

      notes:
        `由 ${parent.uid} 分株產生`,

      createdAt:
        new Date().toISOString(),

      updatedAt:
        new Date().toISOString()
    };

    await putData(
      "plants",
      child
    );

    children.push(child);

    await addTimelineEvent({
      plantUid: child.uid,
      type: "division",
      date:
        new Date()
          .toISOString()
          .slice(0, 10),
      title: "分株產生",
      description:
        `由 ${parent.uid}「${parent.name}」分株產生`,
      data: {
        parentUid: parent.uid,
        inheritanceType: "asexual"
      }
    });
  }

  await createDivision(
    parent,
    children
  );

  await addTimelineEvent({
    plantUid: parent.uid,
    type: "division",
    date:
      new Date()
        .toISOString()
        .slice(0, 10),
    title: "進行分株",
    description:
      `本次分株產生 ${count} 株子株`,
    data: {
      childUids:
        children.map(child => child.uid),
      inheritanceType: "asexual"
    }
  });

  await reloadAndRender();

  showToast(
    `已建立 ${count} 株子株`
  );
}


/* =========================================================
   雜交繁殖
========================================================= */

async function createHybridChild() {
  if (state.plants.length < 2) {
    showToast(
      "至少需要兩株植物才能建立雜交關係"
    );

    return;
  }

  const fatherUid =
    window.prompt(
      "請輸入父株 UID：\n\n例如 PL-001"
    );

  if (!fatherUid) {
    return;
  }

  const motherUid =
    window.prompt(
      "請輸入母株 UID：\n\n例如 PL-002"
    );

  if (!motherUid) {
    return;
  }

  if (fatherUid === motherUid) {
    showToast(
      "父株與母株不能是同一株"
    );

    return;
  }

  const father =
    state.plants.find(
      plant => plant.uid === fatherUid.trim()
    );

  const mother =
    state.plants.find(
      plant => plant.uid === motherUid.trim()
    );

  if (!father || !mother) {
    showToast(
      "找不到父株或母株 UID"
    );

    return;
  }

  const childName =
    window.prompt(
      "請輸入子代植物名稱："
    );

  if (!childName?.trim()) {
    return;
  }

  const childUid =
    generatePlantUID();

  const child = {
    id: generateId("PLANT"),

    uid: childUid,

    name: childName.trim(),

    category:
      father.category ||
      mother.category ||
      "",

    locationId:
      father.locationId ||
      mother.locationId ||
      "",

    status: "alive",

    purchaseDate:
      new Date()
        .toISOString()
        .slice(0, 10),

    cost: 0,

    fatherUid:
      father.uid,

    motherUid:
      mother.uid,

    notes:
      `由 ${father.uid} × ${mother.uid} 雜交產生`,

    createdAt:
      new Date().toISOString(),

    updatedAt:
      new Date().toISOString()
  };

  await putData(
    "plants",
    child
  );

  await createHybridization({
    father,
    mother,
    child
  });

  await addTimelineEvent({
    plantUid: child.uid,
    type: "hybridization",
    date:
      new Date()
        .toISOString()
        .slice(0, 10),
    title: "雜交產生",
    description:
      `${father.uid} × ${mother.uid} → ${child.uid}`,
    data: {
      fatherUid: father.uid,
      motherUid: mother.uid,
      inheritanceType: "sexual"
    }
  });

  await reloadAndRender();

  showToast(
    `已建立雜交子代 ${child.uid}`
  );
}


/* =========================================================
   生命履歷
========================================================= */

async function showPlantTimelineById(id) {
  const plant =
    state.plants.find(
      item => item.id === id
    );

  if (!plant) {
    return;
  }

  state.selectedPlantUid =
    plant.uid;

  navigateTo("timeline");

  await renderPlantTimeline(
    plant.uid
  );
}


async function renderPlantTimeline(uid) {
  const container =
    document.getElementById(
      "timelineContainer"
    );

  if (!container) {
    return;
  }

  const plant =
    state.plants.find(
      item => item.uid === uid
    );

  if (!plant) {
    container.innerHTML = `
      <div class="empty-state">
        <h3>找不到植物</h3>
      </div>
    `;

    return;
  }

  const events =
    await getPlantTimeline(uid);

  container.innerHTML = `
    <div class="content-card">

      <div class="section-header">

        <div>
          <h2>
            ${escapeHtml(plant.name)}
          </h2>

          <p>
            ${escapeHtml(plant.uid)}
          </p>
        </div>

        <button
          class="btn btn-secondary"
          id="backToPlantsFromTimeline"
        >
          返回植物圖鑑
        </button>

      </div>

      ${renderTimeline(events)}

    </div>
  `;

  const backButton =
    document.getElementById(
      "backToPlantsFromTimeline"
    );

  if (backButton) {
    backButton.addEventListener(
      "click",
      () => navigateTo("plants")
    );
  }
}


/* =========================================================
   親緣圖
========================================================= */

async function showGenealogy(uid) {
  state.selectedPlantUid =
    uid;

  navigateTo("genealogy");

  await renderGenealogy(uid);
}


async function renderGenealogy(uid) {
  const container =
    document.getElementById(
      "genealogyContainer"
    );

  if (!container) {
    return;
  }

  if (!uid) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🌳</div>
        <h3>尚未選擇植物</h3>
        <p>
          請從植物圖鑑選擇一株植物查看親緣關係。
        </p>
      </div>
    `;

    return;
  }

  const plant =
    state.plants.find(
      item => item.uid === uid
    );

  if (!plant) {
    container.innerHTML = `
      <div class="empty-state">
        <h3>找不到植物</h3>
      </div>
    `;

    return;
  }

  const tree =
    await buildGenealogyTree(uid);

  if (!tree) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🌱</div>
        <h3>尚無親緣資料</h3>
        <p>
          ${escapeHtml(plant.name)}
          目前還沒有建立親緣關係。
        </p>
      </div>
    `;

    return;
  }

  container.innerHTML = `
    <div class="content-card">

      <div class="section-header">

        <div>
          <h2>
            🌳 ${escapeHtml(plant.name)}
          </h2>

          <p>
            UID：${escapeHtml(plant.uid)}
          </p>
        </div>

        <div class="section-actions">

          <button
            class="btn btn-secondary"
            id="genealogyTimelineButton"
          >
            查看生命履歷
          </button>

          <button
            class="btn btn-secondary"
            id="genealogyBackButton"
          >
            返回植物圖鑑
          </button>

        </div>

      </div>

      <div class="genealogy-wrapper">

        ${renderGenealogyNode(tree)}

      </div>

    </div>
  `;

  const timelineButton =
    document.getElementById(
      "genealogyTimelineButton"
    );

  if (timelineButton) {
    timelineButton.addEventListener(
      "click",
      async () => {
        navigateTo("timeline");
        await renderPlantTimeline(uid);
      }
    );
  }

  const backButton =
    document.getElementById(
      "genealogyBackButton"
    );

  if (backButton) {
    backButton.addEventListener(
      "click",
      () => navigateTo("plants")
    );
  }
}


/* =========================================================
   場域
========================================================= */

function renderLocations() {
  const container =
    document.getElementById(
      "locationsContainer"
    );

  if (!container) {
    return;
  }

  if (!state.locations.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📍</div>
        <h3>尚無場域</h3>
        <p>
          建立陽台、溫室、庭院或其他照護區域。
        </p>
      </div>
    `;

    return;
  }

  container.innerHTML =
    state.locations
      .map(createLocationCard)
      .join("");
}


function createLocationCard(location) {
  const plantCount =
    state.plants.filter(
      plant =>
        plant.locationId === location.id
    ).length;

  return `
    <article class="location-card">

      <div class="location-header">

        <div>
          <h3>
            📍 ${escapeHtml(location.name)}
          </h3>

          ${
            location.city ||
            location.district
              ? `
                <p>
                  ${escapeHtml(
                    [
                      location.city,
                      location.district
                    ]
                      .filter(Boolean)
                      .join(" ")
                  )}
                </p>
              `
              : ""
          }
        </div>

        <span class="location-count">
          ${plantCount} 株
        </span>

      </div>

      <div class="location-details">

        ${
          location.light
            ? `
              <div>
                ☀️ 光照：
                ${escapeHtml(location.light)}
              </div>
            `
            : ""
        }

        ${
          location.ventilation
            ? `
              <div>
                💨 通風：
                ${escapeHtml(
                  location.ventilation
                )}
              </div>
            `
            : ""
        }

        ${
          location.rain
            ? `
              <div>
                🌧️ 遮雨：
                ${escapeHtml(location.rain)}
              </div>
            `
            : ""
        }

      </div>

      ${
        location.notes
          ? `
            <p class="location-notes">
              ${escapeHtml(location.notes)}
            </p>
          `
          : ""
      }

      <div class="location-actions">

        <button
          class="btn btn-secondary btn-small"
          data-location-action="edit"
          data-id="${escapeHtml(location.id)}"
        >
          編輯
        </button>

        <button
          class="btn btn-danger btn-small"
          data-location-action="delete"
          data-id="${escapeHtml(location.id)}"
        >
          刪除
        </button>

      </div>

    </article>
  `;
}


/* =========================================================
   場域操作
========================================================= */

document.addEventListener(
  "click",
  async event => {
    const button =
      event.target.closest(
        "[data-location-action]"
      );

    if (!button) {
      return;
    }

    const action =
      button.dataset.locationAction;

    const id =
      button.dataset.id;

    if (action === "edit") {
      editLocation(id);
    }

    if (action === "delete") {
      await deleteLocation(id);
    }
  }
);


function editLocation(id) {
  const location =
    state.locations.find(
      item => item.id === id
    );

  if (!location) {
    return;
  }

  const form =
    document.getElementById(
      "locationForm"
    );

  if (!form) {
    return;
  }

  form.dataset.editingId =
    location.id;

  setValue(
    "locationName",
    location.name
  );

  setValue(
    "locationCity",
    location.city
  );

  setValue(
    "locationDistrict",
    location.district
  );

  setValue(
    "locationLight",
    location.light
  );

  setValue(
    "locationVentilation",
    location.ventilation
  );

  setValue(
    "locationRain",
    location.rain
  );

  setValue(
    "locationNotes",
    location.notes
  );

  const modal =
    document.getElementById(
      "locationModal"
    );

  const title =
    modal?.querySelector(
      ".modal-title"
    );

  if (title) {
    title.textContent =
      "編輯場域";
  }

  openModal(modal);
}


async function deleteLocation(id) {
  const location =
    state.locations.find(
      item => item.id === id
    );

  if (!location) {
    return;
  }

  const usingPlants =
    state.plants.filter(
      plant =>
        plant.locationId === id
    );

  if (usingPlants.length) {
    const confirmed =
      window.confirm(
        `目前有 ${usingPlants.length} 株植物使用此場域。\n\n刪除後這些植物將變成「未指定場域」。\n\n確定繼續嗎？`
      );

    if (!confirmed) {
      return;
    }

    for (const plant of usingPlants) {
      plant.locationId = "";
      plant.updatedAt =
        new Date().toISOString();

      await putData(
        "plants",
        plant
      );
    }
  } else {
    const confirmed =
      window.confirm(
        `確定要刪除場域「${location.name}」嗎？`
      );

    if (!confirmed) {
      return;
    }
  }

  await deleteData(
    "locations",
    id
  );

  await reloadAndRender();

  showToast("場域已刪除");
}


/* =========================================================
   搜尋
========================================================= */

function setupSearch() {
  const search =
    document.getElementById(
      "plantSearch"
    );

  const filter =
    document.getElementById(
      "plantStatusFilter"
    );

  if (search) {
    search.addEventListener(
      "input",
      renderPlants
    );
  }

  if (filter) {
    filter.addEventListener(
      "change",
      renderPlants
    );
  }
}


/* =========================================================
   生命履歷頁初始化
========================================================= */

async function renderTimelinePage() {
  const container =
    document.getElementById(
      "timelineContainer"
    );

  if (!container) {
    return;
  }

  if (state.selectedPlantUid) {
    await renderPlantTimeline(
      state.selectedPlantUid
    );

    return;
  }

  container.innerHTML = `
    <div class="content-card">

      <div class="empty-state">

        <div class="empty-icon">
          📅
        </div>

        <h3>
          選擇植物查看生命履歷
        </h3>

        <p>
          請至「植物圖鑑」選擇植物。
        </p>

        <button
          class="btn btn-primary"
          id="timelineGoPlants"
        >
          前往植物圖鑑
        </button>

      </div>

    </div>
  `;

  const button =
    document.getElementById(
      "timelineGoPlants"
    );

  if (button) {
    button.addEventListener(
      "click",
      () => navigateTo("plants")
    );
  }
}


/* =========================================================
   親緣頁初始化
========================================================= */

async function renderGenealogyPage() {
  await renderGenealogy(
    state.selectedPlantUid
  );
}


/* =========================================================
   當前頁面渲染
========================================================= */

function renderCurrentPage() {
  switch (state.currentPage) {

    case "dashboard":
      renderDashboard();
      break;

    case "plants":
      renderPlants();
      break;

    case "genealogy":
      renderGenealogyPage();
      break;

    case "timeline":
      renderTimelinePage();
      break;

    case "locations":
      renderLocations();
      break;

    case "gallery":
      renderGalleryPlaceholder();
      break;

    default:
      renderDashboard();
      break;
  }
}


function renderAll() {
  renderDashboard();
  renderPlants();
  renderLocations();

  if (state.currentPage === "timeline") {
    renderTimelinePage();
  }

  if (state.currentPage === "genealogy") {
    renderGenealogyPage();
  }
}


/* =========================================================
   Gallery 預留
========================================================= */

function renderGalleryPlaceholder() {
  const container =
    document.getElementById(
      "galleryContainer"
    );

  if (!container) {
    return;
  }

  container.innerHTML = `
    <div class="empty-state">

      <div class="empty-icon">
        📷
      </div>

      <h3>
        照片履歷模組
      </h3>

      <p>
        下一階段將接上 IndexedDB 圖片儲存、
        生長時間軸與前後照片比較。
      </p>

    </div>
  `;
}


/* =========================================================
   重新載入
========================================================= */

async function reloadAndRender() {
  await loadData();

  updateLocationOptions();

  renderAll();
}


/* =========================================================
   Toast
========================================================= */

function showToast(message) {
  const toast =
    document.getElementById("toast");

  const messageElement =
    document.getElementById(
      "toastMessage"
    );

  if (!toast || !messageElement) {
    console.log(message);
    return;
  }

  messageElement.textContent =
    message;

  toast.classList.add("show");

  clearTimeout(
    showToast.timer
  );

  showToast.timer =
    setTimeout(() => {
      toast.classList.remove("show");
    }, 2500);
}


/* =========================================================
   Service Worker
========================================================= */

function registerServiceWorker() {
  if (
    "serviceWorker" in navigator
  ) {
    window.addEventListener(
      "load",
      async () => {
        try {
          await navigator.serviceWorker.register(
            "./sw.js"
          );

          console.log(
            "Service Worker 已註冊"
          );
        } catch (error) {
          console.warn(
            "Service Worker 註冊失敗：",
            error
          );
        }
      }
    );
  }
}


/* =========================================================
   工具函式
========================================================= */

function setText(id, value) {
  const element =
    document.getElementById(id);

  if (element) {
    element.textContent =
      String(value);
  }
}


function setValue(id, value) {
  const element =
    document.getElementById(id);

  if (element) {
    element.value =
      value ?? "";
  }
}


function translateLevel(level) {
  const map = {
    seedling: "幼苗",
    young: "幼株",
    mature: "成株",
    max: "成熟"
  };

  return map[level] || level;
}


function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll(
      "&",
      "&amp;"
    )
    .replaceAll(
      "<",
      "&lt;"
    )
    .replaceAll(
      ">",
      "&gt;"
    )
    .replaceAll(
      '"',
      "&quot;"
    )
    .replaceAll(
      "'",
      "&#039;"
    );
}


/* =========================================================
   啟動
========================================================= */

init();
