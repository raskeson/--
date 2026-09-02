```javascript
/*
 * 智慧園藝管理
 * App 主控制程式
 */

import {
    openDatabase,
    getAllData,
    getData,
    putData,
    deleteData,
    generateId,
    generatePlantUID,
    STORES
} from "./database.js";


/* =========================================================
   全域狀態
========================================================= */

const state = {

    currentPage: "dashboard",

    editingPlantId: null,

    plants: [],

    locations: []

};


/* =========================================================
   DOM
========================================================= */

const $ = selector =>
    document.querySelector(selector);


const $$ = selector =>
    document.querySelectorAll(selector);


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

    } catch (error) {

        console.error(
            "系統初始化失敗:",
            error
        );

        showToast(
            "系統初始化失敗，請重新整理頁面"
        );

    }

}


/* =========================================================
   載入資料
========================================================= */

async function loadData() {

    state.plants =
        await getAllData(
            STORES.plants
        );

    state.locations =
        await getAllData(
            STORES.locations
        );

}


/* =========================================================
   Navigation
========================================================= */

function setupNavigation() {

    $$(".nav-item").forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    const page =
                        button.dataset.page;

                    navigateTo(page);

                }
            );

        }
    );


    $$("[data-go-page]").forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    navigateTo(
                        button.dataset.goPage
                    );

                }
            );

        }
    );

}


/* =========================================================
   切換頁面
========================================================= */

function navigateTo(page) {

    state.currentPage = page;


    $$(".page").forEach(
        section => {

            section.classList.remove(
                "active-page"
            );

        }
    );


    const target =
        document.getElementById(page);


    if (target) {

        target.classList.add(
            "active-page"
        );

    }


    $$(".nav-item").forEach(
        button => {

            button.classList.toggle(
                "active",
                button.dataset.page === page
            );

        }
    );


    /* 手機版關閉側邊欄 */

    $("#sidebar")?.classList.remove(
        "open"
    );


    if (page === "plants") {

        renderPlants();

    }


    if (page === "locations") {

        renderLocations();

    }


    if (page === "dashboard") {

        renderDashboard();

    }

}


/* =========================================================
   Buttons
========================================================= */

function setupButtons() {

    $("#addPlantButton")
        ?.addEventListener(
            "click",
            () => openPlantModal()
        );


    $("#plantsPageAddButton")
        ?.addEventListener(
            "click",
            () => openPlantModal()
        );


    $("#quickAddPlant")
        ?.addEventListener(
            "click",
            () => openPlantModal()
        );


    $("#emptyAddPlantButton")
        ?.addEventListener(
            "click",
            () => openPlantModal()
        );


    $("#mobileAddPlantButton")
        ?.addEventListener(
            "click",
            () => openPlantModal()
        );


    $("#addLocationButton")
        ?.addEventListener(
            "click",
            () => openLocationModal()
        );


    $("#quickAddLocation")
        ?.addEventListener(
            "click",
            () => openLocationModal()
        );


    $("#quickViewTimeline")
        ?.addEventListener(
            "click",
            () => navigateTo("timeline")
        );


    $("#menuButton")
        ?.addEventListener(
            "click",
            () => {

                $("#sidebar")
                    ?.classList.toggle("open");

            }
        );

}


/* =========================================================
   Modal
========================================================= */

function setupModals() {

    $$("[data-close-modal]")
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        closeModal(
                            button.dataset.closeModal
                        );

                    }
                );

            }
        );


    $$(".modal-backdrop")
        .forEach(
            backdrop => {

                backdrop.addEventListener(
                    "click",
                    () => {

                        const modal =
                            backdrop.closest(".modal");

                        modal?.classList.remove(
                            "open"
                        );

                    }
                );

            }
        );


    document.addEventListener(
        "keydown",
        event => {

            if (event.key !== "Escape") {
                return;
            }

            $$(".modal.open")
                .forEach(
                    modal =>
                        modal.classList.remove(
                            "open"
                        )
                );

        }
    );

}


function openModal(id) {

    const modal =
        document.getElementById(id);

    modal?.classList.add(
        "open"
    );

}


function closeModal(id) {

    const modal =
        document.getElementById(id);

    modal?.classList.remove(
        "open"
    );

}


/* =========================================================
   植物 Modal
========================================================= */

async function openPlantModal(
    plant = null
) {

    const form =
        $("#plantForm");

    if (!form) {
        return;
    }


    form.reset();


    state.editingPlantId =
        plant?.id || null;


    $("#plantModalTitle").textContent =
        plant
            ? "編輯植物"
            : "新增植物";


    $("#plantUid").value =
        plant?.uid ||
        await generatePlantUID();


    $("#plantName").value =
        plant?.name || "";


    $("#plantCategory").value =
        plant?.category || "";


    $("#plantStatus").value =
        plant?.status || "alive";


    $("#plantPurchaseDate").value =
        plant?.purchaseDate || "";


    $("#plantCost").value =
        plant?.cost ?? "";


    $("#plantParent").value =
        plant?.parentUid || "";


    $("#plantNotes").value =
        plant?.notes || "";


    updateLocationSelect(
        plant?.locationId || ""
    );


    openModal("plantModal");

}


/* =========================================================
   場域下拉選單
========================================================= */

function updateLocationSelect(
    selectedId = ""
) {

    const select =
        $("#plantLocation");

    if (!select) {
        return;
    }


    select.innerHTML = `
        <option value="">
            尚未設定
        </option>
    `;


    state.locations.forEach(
        location => {

            const option =
                document.createElement("option");


            option.value =
                location.id;


            option.textContent =
                location.name;


            option.selected =
                location.id === selectedId;


            select.appendChild(
                option
            );

        }
    );

}


/* =========================================================
   表單
========================================================= */

function setupForms() {

    $("#plantForm")
        ?.addEventListener(
            "submit",
            savePlant
        );


    $("#locationForm")
        ?.addEventListener(
            "submit",
            saveLocation
        );

}


/* =========================================================
   儲存植物
========================================================= */

async function savePlant(event) {

    event.preventDefault();


    const name =
        $("#plantName")
            .value
            .trim();


    if (!name) {

        showToast(
            "植物名稱不可為空白"
        );

        return;

    }


    const costValue =
        $("#plantCost").value;


    const cost =
        costValue === ""
            ? 0
            : Number(costValue);


    if (
        Number.isNaN(cost) ||
        cost < 0
    ) {

        showToast(
            "購入成本不得小於 0"
        );

        return;

    }


    const existing =
        state.plants.find(
            plant =>
                plant.id ===
                state.editingPlantId
        );


    const now =
        new Date().toISOString();


    const plant = {

        id:
            existing?.id ||
            generateId("PLANT"),


        uid:
            $("#plantUid").value,


        name,


        category:
            $("#plantCategory")
                .value
                .trim(),


        locationId:
            $("#plantLocation").value ||
            null,


        status:
            $("#plantStatus").value,


        purchaseDate:
            $("#plantPurchaseDate").value ||
            null,


        cost,


        parentUid:
            $("#plantParent")
                .value
                .trim() ||
            null,


        notes:
            $("#plantNotes")
                .value
                .trim(),


        createdAt:
            existing?.createdAt ||
            now,


        updatedAt:
            now

    };


    await putData(
        STORES.plants,
        plant
    );


    /* 第一次建立植物時，自動建立購入履歷 */

    if (!existing) {

        await putData(
            STORES.timeline,
            {

                id:
                    generateId("EVENT"),

                plantId:
                    plant.id,

                type:
                    "purchase",

                title:
                    "購入植物",

                description:
                    `建立植物 ${plant.name}`,

                date:
                    plant.purchaseDate ||
                    now.substring(0, 10),

                createdAt:
                    now

            }
        );

    }


    await loadData();


    closeModal(
        "plantModal"
    );


    renderAll();


    showToast(
        existing
            ? "植物資料已更新"
            : "植物已成功新增"
    );

}


/* =========================================================
   Location Modal
========================================================= */

function openLocationModal() {

    const form =
        $("#locationForm");

    form?.reset();

    openModal(
        "locationModal"
    );

}


/* =========================================================
   儲存場域
========================================================= */

async function saveLocation(event) {

    event.preventDefault();


    const name =
        $("#locationName")
            .value
            .trim();


    if (!name) {

        showToast(
            "場域名稱不可為空白"
        );

        return;

    }


    const location = {

        id:
            generateId("LOCATION"),


        name,


        city:
            $("#locationCity")
                .value
                .trim(),


        district:
            $("#locationDistrict")
                .value
                .trim(),


        light:
            $("#locationLight").value,


        ventilation:
            $("#locationVentilation").value,


        rain:
            $("#locationRain").value,


        notes:
            $("#locationNotes")
                .value
                .trim(),


        createdAt:
            new Date().toISOString()

    };


    await putData(
        STORES.locations,
        location
    );


    await loadData();


    closeModal(
        "locationModal"
    );


    updateLocationSelect();


    renderAll();


    showToast(
        "場域已成功新增"
    );

}


/* =========================================================
   Dashboard
========================================================= */

function renderDashboard() {

    const total =
        state.plants.length;


    const alive =
        state.plants.filter(
            plant =>
                plant.status === "alive"
        ).length;


    $("#totalPlants").textContent =
        total;


    $("#alivePlants").textContent =
        alive;


    $("#totalLocations").textContent =
        state.locations.length;


    /*
     * 第一版先以植物具有 parentUid
     * 作為分株關係的統計基礎。
     */

    const splits =
        state.plants.filter(
            plant =>
                Boolean(plant.parentUid)
        ).length;


    $("#totalSplits").textContent =
        splits;


    renderRecentPlants();

}


/* =========================================================
   最近植物
========================================================= */

function renderRecentPlants() {

    const container =
        $("#recentPlants");

    if (!container) {
        return;
    }


    const plants =
        [...state.plants]
            .sort(
                (a, b) =>
                    new Date(b.createdAt) -
                    new Date(a.createdAt)
            )
            .slice(0, 6);


    if (plants.length === 0) {

        container.innerHTML = `

            <div class="empty-state">

                <div class="empty-icon">
                    🌿
                </div>

                <h3>
                    目前還沒有植物紀錄
                </h3>

                <p>
                    建立第一株植物，開始管理你的園藝世界。
                </p>

                <button
                    class="primary-button"
                    id="emptyAddPlantButton"
                >
                    ＋ 新增第一株植物
                </button>

            </div>
        `;


        $("#emptyAddPlantButton")
            ?.addEventListener(
                "click",
                () => openPlantModal()
            );


        return;

    }


    container.innerHTML =
        plants
            .map(
                createPlantCard
            )
            .join("");


    bindPlantCardButtons(
        container
    );

}


/* =========================================================
   植物圖鑑
========================================================= */

function renderPlants() {

    const container =
        $("#plantsContainer");

    if (!container) {
        return;
    }


    const search =
        $("#plantSearch")
            ?.value
            .trim()
            .toLowerCase() || "";


    const status =
        $("#plantStatusFilter")
            ?.value ||
        "all";


    let plants =
        [...state.plants];


    if (search) {

        plants =
            plants.filter(
                plant => {

                    const text =
                        [
                            plant.name,
                            plant.uid,
                            plant.category
                        ]
                            .join(" ")
                            .toLowerCase();


                    return text.includes(
                        search
                    );

                }
            );

    }


    if (status !== "all") {

        plants =
            plants.filter(
                plant =>
                    plant.status === status
            );

    }


    if (plants.length === 0) {

        container.innerHTML = `

            <div class="empty-state">

                <div class="empty-icon">
                    🌱
                </div>

                <h3>
                    沒有符合條件的植物
                </h3>

                <p>
                    可以新增植物，或調整搜尋條件。
                </p>

            </div>
        `;

        return;

    }


    container.innerHTML =
        plants
            .map(
                createPlantCard
            )
            .join("");


    bindPlantCardButtons(
        container
    );

}


/* =========================================================
   植物卡片
========================================================= */

function createPlantCard(
    plant
) {

    const location =
        state.locations.find(
            item =>
                item.id ===
                plant.locationId
        );


    const statusText = {

        alive: "存活中",

        dead: "已死亡",

        sold: "已出售",

        gifted: "已贈送"

    };


    const statusClass = {

        alive: "status-alive",

        dead: "status-dead",

        sold: "status-sold",

        gifted: "status-gifted"

    };


    return `

        <article
            class="plant-card"
            data-plant-id="${escapeHtml(
                plant.id
            )}"
        >

            <div class="plant-image">
                🌿
            </div>


            <div class="plant-card-content">

                <div class="plant-card-header">

                    <div>

                        <h3>
                            ${escapeHtml(
                                plant.name
                            )}
                        </h3>

                        <div class="plant-uid">
                            UID：
                            ${escapeHtml(
                                plant.uid
                            )}
                        </div>

                    </div>

                    <span
                        class="status-badge
                        ${statusClass[
                            plant.status
                        ] || "status-alive"}"
                    >
                        ${statusText[
                            plant.status
                        ] || "存活中"}
                    </span>

                </div>


                <div class="plant-meta">

                    ${
                        plant.category
                            ? `
                                <span class="tag">
                                    ${escapeHtml(
                                        plant.category
                                    )}
                                </span>
                            `
                            : ""
                    }


                    ${
                        location
                            ? `
                                <span class="tag">
                                    📍
                                    ${escapeHtml(
                                        location.name
                                    )}
                                </span>
                            `
                            : ""
                    }


                    ${
                        plant.parentUid
                            ? `
                                <span class="tag">
                                    🌱
                                    母株：
                                    ${escapeHtml(
                                        plant.parentUid
                                    )}
                                </span>
                            `
                            : ""
                    }

                </div>


                <div class="plant-card-actions">

                    <button
                        class="card-button"
                        data-action="edit"
                        data-id="${escapeHtml(
                            plant.id
                        )}"
                    >
                        編輯
                    </button>


                    <button
                        class="card-button"
                        data-action="timeline"
                        data-id="${escapeHtml(
                            plant.id
                        )}"
                    >
                        履歷
                    </button>


                    <button
                        class="card-button"
                        data-action="delete"
                        data-id="${escapeHtml(
                            plant.id
                        )}"
                    >
                        刪除
                    </button>

                </div>

            </div>

        </article>

    `;

}


/* =========================================================
   卡片按鈕
========================================================= */

function bindPlantCardButtons(
    container
) {

    container
        .querySelectorAll(
            "[data-action]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    async () => {

                        const action =
                            button.dataset.action;

                        const id =
                            button.dataset.id;


                        if (
                            action ===
                            "edit"
                        ) {

                            const plant =
                                await getData(
                                    STORES.plants,
                                    id
                                );


                            if (plant) {

                                openPlantModal(
                                    plant
                                );

                            }

                        }


                        if (
                            action ===
                            "delete"
                        ) {

                            await deletePlant(
                                id
                            );

                        }


                        if (
                            action ===
                            "timeline"
                        ) {

                            navigateTo(
                                "timeline"
                            );

                            showToast(
                                "下一階段將顯示指定植物履歷"
                            );

                        }

                    }
                );

            }
        );

}


/* =========================================================
   刪除植物
========================================================= */

async function deletePlant(
    id
) {

    const plant =
        state.plants.find(
            item =>
                item.id === id
        );


    if (!plant) {
        return;
    }


    const confirmed =
        window.confirm(
            `確定要刪除「${plant.name}」嗎？\n\n刪除後植物資料將無法復原。`
        );


    if (!confirmed) {
        return;
    }


    await deleteData(
        STORES.plants,
        id
    );


    /* 同時刪除生命履歷 */

    const events =
        await getAllData(
            STORES.timeline
        );


    for (
        const event of events
    ) {

        if (
            event.plantId === id
        ) {

            await deleteData(
                STORES.timeline,
                event.id
            );

        }

    }


    await loadData();

    renderAll();


    showToast(
        "植物資料已刪除"
    );

}


/* =========================================================
   場域
========================================================= */

function renderLocations() {

    const container =
        $("#locationsContainer");

    if (!container) {
        return;
    }


    if (
        state.locations.length === 0
    ) {

        container.innerHTML = `

            <div class="empty-state">

                <div class="empty-icon">
                    📍
                </div>

                <h3>
                    目前還沒有場域
                </h3>

                <p>
                    例如：露台、陽台、溫室、室內或隔離區。
                </p>

            </div>

        `;

        return;

    }


    container.innerHTML =
        state.locations
            .map(
                location => `

                    <article
                        class="location-card"
                    >

                        <h3>
                            📍
                            ${escapeHtml(
                                location.name
                            )}
                        </h3>

                        <div
                            class="location-meta"
                        >

                            ${
                                location.city ||
                                location.district
                                    ? `
                                        ${
                                            escapeHtml(
                                                [
                                                    location.city,
                                                    location.district
                                                ]
                                                    .filter(Boolean)
                                                    .join(" ")
                                            )
                                        }
                                    `
                                    : "尚未設定地點"
                            }

                        </div>


                        <div class="plant-meta">

                            <span class="tag">
                                ☀️
                                光照：
                                ${translateLevel(
                                    location.light
                                )}
                            </span>

                            <span class="tag">
                                💨
                                通風：
                                ${translateLevel(
                                    location.ventilation
                                )}
                            </span>

                            <span class="tag">
                                🌧️
                                遮雨：
                                ${translateLevel(
                                    location.rain
                                )}
                            </span>

                        </div>

                    </article>

                `
            )
            .join("");

}


/* =========================================================
   搜尋
========================================================= */

function setupSearch() {

    $("#plantSearch")
        ?.addEventListener(
            "input",
            () => renderPlants()
        );


    $("#plantStatusFilter")
        ?.addEventListener(
            "change",
            () => renderPlants()
        );

}


/* =========================================================
   Render All
========================================================= */

function renderAll() {

    renderDashboard();

    renderPlants();

    renderLocations();

    updateLocationSelect();

}


/* =========================================================
   Toast
========================================================= */

let toastTimer = null;


function showToast(
    message
) {

    const toast =
        $("#toast");


    const messageElement =
        $("#toastMessage");


    if (
        !toast ||
        !messageElement
    ) {
        return;
    }


    messageElement.textContent =
        message;


    toast.classList.add(
        "show"
    );


    clearTimeout(
        toastTimer
    );


    toastTimer =
        setTimeout(
            () => {

                toast.classList.remove(
                    "show"
                );

            },
            2500
        );

}


/* =========================================================
   等級翻譯
========================================================= */

function translateLevel(
    value
) {

    const levels = {

        low: "低",

        medium: "中",

        high: "高"

    };


    return (
        levels[value] ||
        "未設定"
    );

}


/* =========================================================
   HTML 安全處理
========================================================= */

function escapeHtml(
    value
) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    return String(value)
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
   Service Worker
========================================================= */

function registerServiceWorker() {

    if (
        "serviceWorker" in navigator
    ) {

        window.addEventListener(
            "load",
            () => {

                navigator.serviceWorker
                    .register(
                        "./sw.js"
                    )
                    .catch(
                        error => {

                            console.warn(
                                "Service Worker 註冊失敗：",
                                error
                            );

                        }
                    );

            }
        );

    }

}


/* =========================================================
   啟動
========================================================= */

init();
```
