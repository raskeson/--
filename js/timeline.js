import {
  getAllData,
  putData,
  deleteData,
  generateId
} from "./database.js";

const TIMELINE_STORE = "timeline";

const EVENT_TYPES = {
  purchase: "購入",
  repot: "換盆",
  division: "分株",
  hybridization: "雜交",
  watering: "澆水",
  fertilizing: "施肥",
  disease: "病蟲害",
  medicine: "用藥",
  isolation: "隔離",
  transfer: "移動",
  harvest: "採收",
  sold: "出售",
  gifted: "贈送",
  death: "死亡",
  note: "備註"
};

export async function addTimelineEvent({
  plantUid,
  type,
  date,
  title,
  description = "",
  data = {}
}) {
  if (!plantUid) {
    throw new Error("缺少植物 UID");
  }

  if (!type) {
    throw new Error("缺少履歷類型");
  }

  const event = {
    id: generateId("TL"),
    plantUid,
    type,
    date: date || new Date().toISOString().slice(0, 10),
    title: title || EVENT_TYPES[type] || "植物紀錄",
    description,
    data,
    createdAt: new Date().toISOString()
  };

  await putData(TIMELINE_STORE, event);

  return event;
}

export async function getPlantTimeline(plantUid) {
  const events = await getAllData(TIMELINE_STORE);

  return events
    .filter(event => event.plantUid === plantUid)
    .sort((a, b) => {
      const dateA = new Date(a.date || a.createdAt);
      const dateB = new Date(b.date || b.createdAt);

      return dateB - dateA;
    });
}

export async function deleteTimelineEvent(eventId) {
  await deleteData(TIMELINE_STORE, eventId);
}

export function renderTimeline(events) {
  if (!events.length) {
    return `
      <div class="empty-state">
        <div class="empty-icon">🌱</div>
        <h3>尚無生命履歷</h3>
        <p>這株植物目前還沒有紀錄。</p>
      </div>
    `;
  }

  return `
    <div class="timeline">
      ${events
        .map(event => {
          const typeText =
            EVENT_TYPES[event.type] || "植物紀錄";

          return `
            <div class="timeline-item">
              <div class="timeline-dot"></div>

              <div class="timeline-content">
                <div class="timeline-date">
                  ${escapeHtml(event.date || "")}
                </div>

                <div class="timeline-card">
                  <div class="timeline-card-header">
                    <strong>
                      ${escapeHtml(event.title || typeText)}
                    </strong>

                    <span class="timeline-type">
                      ${escapeHtml(typeText)}
                    </span>
                  </div>

                  ${
                    event.description
                      ? `
                        <p>
                          ${escapeHtml(event.description)}
                        </p>
                      `
                      : ""
                  }
                </div>
              </div>
            </div>
          `;
        })
        .join("")}
    </div>
  `;
}

export {
  EVENT_TYPES
};

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
