import {common} from "@webpack";

export default function makeStore(state: any) {
    const listeners = new Set<Function>();

    function get() {return state;}
    function set(value) {
        state = value;
        listeners.forEach(l => l());
    }

    function use() {
        const [curr, setState] = common.React.useState(state);

        common.React.useEffect(() => {
            const callback = () => setState(state);

            listeners.add(callback);

            return () => void listeners.delete(callback);
        }, []);

        return curr;
    }

    return {get, set, use};
}
