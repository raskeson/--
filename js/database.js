```javascript
/*
 * 智慧園藝管理
 * IndexedDB 資料庫
 *
 * 所有資料儲存在使用者自己的瀏覽器中。
 */

const DB_NAME = "SmartGardeningManagement";
const DB_VERSION = 1;

const STORES = {
    plants: "plants",
    locations: "locations",
    timeline: "timeline",
    photos: "photos"
};

let dbInstance = null;


/* =========================================================
   開啟資料庫
========================================================= */

export function openDatabase() {

    if (dbInstance) {
        return Promise.resolve(dbInstance);
    }

    return new Promise((resolve, reject) => {

        const request = indexedDB.open(
            DB_NAME,
            DB_VERSION
        );


        request.onupgradeneeded = (event) => {

            const db = event.target.result;


            /* 植物 */

            if (!db.objectStoreNames.contains(STORES.plants)) {

                const plantStore =
                    db.createObjectStore(
                        STORES.plants,
                        {
                            keyPath: "id"
                        }
                    );

                plantStore.createIndex(
                    "uid",
                    "uid",
                    {
                        unique: true
                    }
                );

                plantStore.createIndex(
                    "status",
                    "status",
                    {
                        unique: false
                    }
                );

                plantStore.createIndex(
                    "category",
                    "category",
                    {
                        unique: false
                    }
                );

                plantStore.createIndex(
                    "locationId",
                    "locationId",
                    {
                        unique: false
                    }
                );

            }


            /* 場域 */

            if (!db.objectStoreNames.contains(STORES.locations)) {

                const locationStore =
                    db.createObjectStore(
                        STORES.locations,
                        {
                            keyPath: "id"
                        }
                    );

                locationStore.createIndex(
                    "name",
                    "name",
                    {
                        unique: false
                    }
                );

            }


            /* 生命履歷 */

            if (!db.objectStoreNames.contains(STORES.timeline)) {

                const timelineStore =
                    db.createObjectStore(
                        STORES.timeline,
                        {
                            keyPath: "id"
                        }
                    );

                timelineStore.createIndex(
                    "plantId",
                    "plantId",
                    {
                        unique: false
                    }
                );

                timelineStore.createIndex(
                    "date",
                    "date",
                    {
                        unique: false
                    }
                );

            }


            /* 照片 */

            if (!db.objectStoreNames.contains(STORES.photos)) {

                const photoStore =
                    db.createObjectStore(
                        STORES.photos,
                        {
                            keyPath: "id"
                        }
                    );

                photoStore.createIndex(
                    "plantId",
                    "plantId",
                    {
                        unique: false
                    }
                );

                photoStore.createIndex(
                    "date",
                    "date",
                    {
                        unique: false
                    }
                );

            }

        };


        request.onsuccess = (event) => {

            dbInstance = event.target.result;

            resolve(dbInstance);

        };


        request.onerror = () => {

            reject(
                new Error(
                    "無法開啟植物資料庫"
                )
            );

        };

    });

}


/* =========================================================
   新增 / 更新
========================================================= */

export async function putData(
    storeName,
    data
) {

    const db = await openDatabase();

    return new Promise((resolve, reject) => {

        const transaction =
            db.transaction(
                storeName,
                "readwrite"
            );

        const store =
            transaction.objectStore(
                storeName
            );

        const request =
            store.put(data);


        request.onsuccess = () => {

            resolve(request.result);

        };


        request.onerror = () => {

            reject(request.error);

        };

    });

}


/* =========================================================
   取得單筆
========================================================= */

export async function getData(
    storeName,
    id
) {

    const db = await openDatabase();

    return new Promise((resolve, reject) => {

        const transaction =
            db.transaction(
                storeName,
                "readonly"
            );

        const store =
            transaction.objectStore(
                storeName
            );

        const request =
            store.get(id);


        request.onsuccess = () => {

            resolve(request.result);

        };


        request.onerror = () => {

            reject(request.error);

        };

    });

}


/* =========================================================
   取得全部
========================================================= */

export async function getAllData(
    storeName
) {

    const db = await openDatabase();

    return new Promise((resolve, reject) => {

        const transaction =
            db.transaction(
                storeName,
                "readonly"
            );

        const store =
            transaction.objectStore(
                storeName
            );

        const request =
            store.getAll();


        request.onsuccess = () => {

            resolve(
                request.result || []
            );

        };


        request.onerror = () => {

            reject(request.error);

        };

    });

}


/* =========================================================
   刪除
========================================================= */

export async function deleteData(
    storeName,
    id
) {

    const db = await openDatabase();

    return new Promise((resolve, reject) => {

        const transaction =
            db.transaction(
                storeName,
                "readwrite"
            );

        const store =
            transaction.objectStore(
                storeName
            );

        const request =
            store.delete(id);


        request.onsuccess = () => {

            resolve(true);

        };


        request.onerror = () => {

            reject(request.error);

        };

    });

}


/* =========================================================
   清空資料表
========================================================= */

export async function clearData(
    storeName
) {

    const db = await openDatabase();

    return new Promise((resolve, reject) => {

        const transaction =
            db.transaction(
                storeName,
                "readwrite"
            );

        const store =
            transaction.objectStore(
                storeName
            );

        const request =
            store.clear();


        request.onsuccess = () => {

            resolve(true);

        };


        request.onerror = () => {

            reject(request.error);

        };

    });

}


/* =========================================================
   產生 ID
========================================================= */

export function generateId(
    prefix = "ID"
) {

    const timestamp =
        Date.now().toString(36);

    const random =
        Math.random()
            .toString(36)
            .substring(2, 8);

    return `${prefix}-${timestamp}-${random}`;

}


/* =========================================================
   產生植物 UID
========================================================= */

export async function generatePlantUID() {

    const plants =
        await getAllData(
            STORES.plants
        );


    let number = 1;


    while (true) {

        const uid =
            `PL-${String(number).padStart(3, "0")}`;


        const exists =
            plants.some(
                plant =>
                    plant.uid === uid
            );


        if (!exists) {

            return uid;

        }


        number++;

    }

}


/* =========================================================
   匯出資料表名稱
========================================================= */

export {
    STORES
};
```
