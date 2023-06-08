import {whenReady} from "@webpack";
import {Filters, lazy} from "./api";
import {addPatch} from "./patcher";

const initComponent = (comp, value) => Object.assign(comp, Object.assign(React.memo(value), value))

addPatch({
    regex: /\.directionRight.+?\.directionDown[\s\S]+?(?<identifier>\w)\.Directions=[\s\S]+?;/,
    replace: `$&importVar("setCaret")($<identifier>);`,
    variables: {
        setCaret: value => whenReady.then(() => initComponent(Caret, value))
    }
});

export const Switch: React.NamedExoticComponent<{
    id?: string,
    className?: string,
    disabled?: boolean,
    checked: boolean,
    onChange: Function,
}> = {} as any;

export const Tooltip: React.NamedExoticComponent<{
    text: any,
    align?: string,
    position?: "top" | "left" | "bottom" | "right",
    spacing?: number,
    tooltipClassName?: string,
    tooltipContextClassName?: string,
    hideOnClick?: boolean,
    children: Function 
}> = {} as any;

export const Caret: React.NamedExoticComponent<{
    direction: string,
    className?: string
}> & {
    Directions: {
        UP: string,
        RIGHT: string,
        DOWN: string,
        LEFT: string
    }
} = {} as any;

export const React = lazy<typeof import("react")>(Filters.byProps("createElement", "useState"), {bypass: true});

export const ModulesBundle = lazy<any>(Filters.byProps("FormSection"));

export const Forms = new Proxy<{
    Section: React.FC<{children: any, className?: string, titleClassName?: string, title?: any, icon?: any, disabled?: boolean}>,
    Divider: React.FC<any>,
    ErrorBlock: React.FC,
    Item: React.FC,
    Label: React.FC,
    Notice: React.FC,
    Switch: React.FC,
    Text: React.FC,
    Title: React.FC<{tag?: "h1" | "h2" | "h3" | "h4" | "h5" | "label" | "legend" , children?: any, className?: string, faded?: boolean, disabled?: boolean, required?: boolean, error?: any}>,
}>({} as any, {
    get(_, key) {
        return ModulesBundle["Form" + (key as string)];
    }
});

ModulesBundle._promise.then(() => {
    initComponent(Switch, ModulesBundle.Switch);
    initComponent(Tooltip, ModulesBundle.Tooltip);
});
