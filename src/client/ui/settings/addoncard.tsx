import {Forms, React, Switch, Tooltip} from "@webpack/common";
import "@styles/settings/addon-card.scss";
import Badge, {BadgeColors} from "../badge";
import Storage from "@storage";
import Gear from "../icons/gear";
import PluginManager from "@addons/plugins";
import ThemesManager from "@addons/themes";

// TODO: Implement social links section in footer

const managers = {
    plugin: PluginManager,
    theme: ThemesManager
};

function useAddonController(type: "theme" | "plugin", id: string) {
    const manager = managers[type];

    const [state, setState] = React.useState(manager.isEnabled(id));

    React.useEffect(() => {
        const callback = key => {
            if (key !== "plugins" && key !== "themes") return;

            setState(manager.isEnabled(id));
        };

        Storage.on("updated", callback);

        return () => void Storage.off("updated", callback);
    }, [id]);

    const handleSwitch = () => {
        if (manager.isEnabled(id)) {
            manager.disable(id);
        } else {
            manager.enable(id)
        }
    };

    return [
        state,
        handleSwitch,
    ] as [typeof state, typeof handleSwitch];
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
