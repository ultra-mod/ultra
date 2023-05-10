import Webpack from "@webpack";
import {Caret, Forms, React} from "@webpack/common";
import "@styles/settings/title.scss";

export type Route = {
    name: string,
    component: React.FC
};

Webpack.whenReady.then(async () => {
    ViewContext = React.createContext({}) as any;
});

type ViewContextType = {
    path: Route[],
    current: Route,
    push(location: string, component: React.FC<any>): void;
    pop(): void;
};

let ViewContext = {} as any as React.Context<ViewContextType>;

export function useView() {
    return React.useContext(ViewContext);
}

function renderItem(props: {route: Route, active: boolean, onSelect: (route: Route) => void}) {
    return (
        <div className="ultra-title-wrapper" onClick={e => !props.active && (e.preventDefault(), e.stopPropagation(), props.onSelect(props.route))}>
            <Forms.Title tag="h1" className={`ultra-settings-title ultra-title-${props.active ? "" : "in"}active`}>
                {props.route.name}
            </Forms.Title>
        </div>
    );
}

export default function SettingsView(props: {title: any, children: any}) {
    const defaultPage = React.useMemo(() => ({
        name: props.title,
        component: () => props.children
    }), [props.children, props.title]);
    
    
    const [state, setState] = React.useState<Omit<ViewContextType, "push" | "pop">>({
        path: [defaultPage],
        current: defaultPage
    });

    const children = React.useMemo(() => React.createElement(state.current.component), [state]);
    
    const selectRoute = (route: Route) => {
        const index = state.path.findIndex(r => r === route);

        if (index === -1) return;
        console.log(index, state.path, state.path.slice(0, index + 1));
        setState({
            path: state.path.slice(0, index + 1),
            current: route
        });
    }

    const pushRoute = (location: string, component: React.FC<any>) => {
        const route = {name: location, component};

        setState({
            path: [...state.path, route],
            current: route
        });
    };

    const popRoute = () => {
        state.path.pop();

        setState({
            path: state.path.slice(-1),
            current: state.path.at(-1)
        });
    };

    const mapped = React.useMemo(() => 
        state.path.flatMap((item, i, {length}) => {
            if (i === 0 || (length > 2 && i === length - 1)) return renderItem({route: item, active: state.current === item, onSelect: selectRoute});     

            return [
                <Caret direction={Caret.Directions.RIGHT} />,
                renderItem({route: item, active: state.current === item, onSelect: selectRoute})
            ];
        })
    , [state]);

    return (
        <div className="ultra-settings-view">
            <ViewContext.Provider value={{...state, push: pushRoute, pop: popRoute}}>
                <Forms.Section title={mapped} titleClassName="ultra-settings-title-crumb">
                    {children}
                </Forms.Section>
            </ViewContext.Provider>
        </div>
    );
}
