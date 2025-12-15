const STORAGE_KEYS = {
    TOKEN: 'token',
    USER: 'user'
};

function getStorage() {
    try {
        return window.localStorage;
    } catch {
        return null;
    }
}

export function getItem(key) {
    const storage = getStorage();
    if (!storage) return null;
    return storage.getItem(key);
}

export function setItem(key, value) {
    const storage = getStorage();
    if (!storage) return;
    storage.setItem(key, value);
}

export function removeItem(key) {
    const storage = getStorage();
    if (!storage) return;
    storage.removeItem(key);
}


export function getUser() {
    const raw = getItem(STORAGE_KEYS.USER);
    if (!raw) return null;

    try {
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

export function setUser(user) {
    if (!user) return;
    setItem(STORAGE_KEYS.USER, JSON.stringify(user));
}

export function removeUser() {
    removeItem(STORAGE_KEYS.USER);
}
