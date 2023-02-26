import {addInterceptor, interceptors} from "./patcher";

type Section = {
    index(sections: any[]): number,
    section: string,
    label: string,
    element?(): React.ReactElement,
    predicate?(): boolean,
    onClick?(): void,
    onSettingsClose?(): void,
    notice?: {
        stores: any[],
        element?(): React.ReactElement
    },
    ariaLabel?: string,
    icon?: React.ReactElement,
    badgeCount?: number,
};

const items = new Map();

addInterceptor(sections => {
    for (const item of items.values()) {
        const index = item.index(sections);
        sections.splice(index, 0, item);
    }
});

export function registerItem(id: string, options: Section) {
    items.set(id, options);
}

export function unregisterItem(id: string) {
    return items.delete(id);
}

const Settings = {
    registerItem,
    unregisterItem,
    items,
    interceptors
};

export default Settings;
