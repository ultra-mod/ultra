import {addInterceptor, interceptors} from "./patcher";

export type Section = {
    index(sections: any[]): number,
    section: string,
    label?: string,
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

enum ItemTypes {
    SECTION,
    SINGLE_ITEM
}

const items = new Map();

addInterceptor(sections => {
    for (const section of items.values()) {
        switch (section.type) {
            case ItemTypes.SECTION: {
                const index = section.index(sections);
                sections.splice(index, 0, {
                    section: "HEADER",
                    label: section.label
                });

                for (let i = 0; i < section.items.length; i++) {
                    sections.splice(index + 1 + i, 0, section.items[i]);
                }
            } break;
        
            case ItemTypes.SINGLE_ITEM: {
                const index = section.index(sections);
                sections.splice(index, 0, section);
            } break;
        }
    }
});

export function registerSection(id: string, options: {
    label: string,
    index(sections: Section[]): number,
    items: Omit<Section, "index">[]
}) {
    items.set(id, Object.assign(options, {type: ItemTypes.SECTION}));
}

export function unregisterSection(id: string) {
    return items.delete(id);
}

const Settings = {
    registerSection,
    unregisterSection,
    items,
    interceptors
};

export default Settings;
