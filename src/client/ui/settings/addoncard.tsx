import {Forms, React, Switch, Tooltip} from "@webpack/common";
import "@styles/settings/addon-card.scss";
import Badge, {BadgeColors} from "../badge";
import Storage from "@storage";
import Gear from "../icons/gear";

// TODO: Implement social links section in footer

function useAddonController(type: "theme" | "plugin", id: string) {
    const controller = React.useMemo<{get: () => string[], set: (states: string[]) => void}>(() => ({
        get: {
            theme: Storage.getThemesStates,
            plugin: Storage.getPluginStates
        }[type],
        set: {
            theme: Storage.setThemesStates,
            plugin: Storage.setPluginStates
        }[type]
    }), [type]);

    const [state, setState] = React.useState(controller.get().includes(id));

    React.useEffect(() => {
        const callback = key => {
            if (key !== "plugins" && key !== "themes") return;

            setState(controller.get().includes(id));
        };

        Storage.on("updated", callback);

        return () => void Storage.off("updated", callback);
    }, [id]);

    const handleSwitch = () => {
        const states = controller.get().slice();

        if (controller.get().includes(id)) {
            states.splice(states.indexOf(id), 1);
        } else {
            states.push(id);
        }

        controller.set(states);
    };

    return [
        state,
        handleSwitch,
        controller
    ] as [typeof state, typeof handleSwitch, typeof controller];
}

function ActionButton({children: icon, tooltip, onClick}: {children: any, tooltip: string, onClick: Function}) {
    return (
        <Tooltip text={tooltip}>
            {props => 
                <div className="ultra-addon-card-button" {...props} onClick={onClick}>
                    {icon}
                </div>
            }
        </Tooltip>  
    );
}

export default function AddonCard(baseAddon: {
    name: string,
    description: string,
    version: string,
    id: string,
    type: "theme" | "plugin"
}) {
    const [state, toggle] = useAddonController(baseAddon.type, baseAddon.id);

    return (
        <div className="ultra-addon-card">
            <div className="ultra-addon-card-header">
                <Forms.Title tag="h3" className="ultra-addon-card-name">{baseAddon.name}</Forms.Title>
                <Badge color={BadgeColors.BLUE}>{baseAddon.version}</Badge>
                <div className="ultra-switch-container">
                    <Switch checked={state} onChange={toggle}/>
                </div>
            </div>
            <div className="ultra-addon-card-body">
                <div className="ultra-addon-card-description">
                    {baseAddon.description}
                </div>
            </div>
            <div className="ultra-addon-card-footer">
                <div className="ultra-addon-card-buttons">
                    <ActionButton onClick={() => {}} tooltip="Settings" key="settings">
                        <Gear />
                    </ActionButton>
                </div>
            </div>
        </div>
    );
}
