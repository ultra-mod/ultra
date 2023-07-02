import {lazy, Filters} from "@webpack/api";

const DraftStore = lazy<any>(Filters.byStore("DraftStore"));
const SelectedChannelStore = lazy<any>(Filters.byStore("SelectedChannelStore"));

const TextArea = {
    _listeners: new Set<Function>,
    getValue(channelId: string) {
        return DraftStore.getDraft(channelId, 0) ?? "";
    },
    getCurrentValue() {
        return TextArea.getValue(SelectedChannelStore.getChannelId());
    },
    onChange(listener: Function) {
        return TextArea._listeners.add(listener), () => TextArea._listeners.delete(listener);
    }
};

DraftStore._promise.then(() => {
    DraftStore._dispatcher.subscribe("DRAFT_SAVE", () => {
        for (const listener of Array.from(TextArea._listeners)) {
            listener();
        }
    });
});

export default TextArea;
