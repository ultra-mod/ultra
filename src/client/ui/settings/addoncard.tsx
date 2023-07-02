import {Forms, React, Switch, Tooltip} from "@webpack/common";
import "@styles/settings/addon-card.scss";
import Badge, {BadgeColors} from "../badge";
import Gear from "../icons/gear";
import PluginManager from "@addons/plugins";
import ThemesManager from "@addons/themes";
import Power from "../icons/power";

// TODO: Implement social links section in footer

const managers = {
    plugin: PluginManager,
    theme: ThemesManager
};

function useAddonController(type: "theme" | "plugin", id: string) {
    const manager = managers[type];

    const [enabled, setEnabled] = React.useState(manager.isEnabled(id));
    const [power, setPower] = React.useState(manager.getState(id, "power"));

    React.useEffect(() => {
        const callback = (addonId: string, state: string) => {
            if (addonId !== id) return;

            switch (state) {
                case "power": return setPower(manager.getState(addonId, "power"));
                case "enabled": return setEnabled(manager.getState(addonId, "enabled"));
            }
        };

        manager.on("addon-state-change", callback);

        return () => void manager.off("addon-state-change", callback);
    }, [id]);

    const handleSwitch = () => {
        if (!(manager.addons.get(id)?.config?.canDisable ?? true)) return;

        if (manager.isEnabled(id)) {
            manager.disable(id);
        } else {
            manager.enable(id)
        }
    };

    const togglePower = () => manager.togglePower(id);

    return [
        enabled,
        power,
        handleSwitch,
        togglePower
    ] as [typeof enabled, typeof power, typeof handleSwitch, typeof togglePower];
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
    type: "theme" | "plugin",
    config?: {
        canDisable?: boolean
    }
}) {
    const [enabled, power, handleSwitch, togglePower] = useAddonController(baseAddon.type, baseAddon.id);

    return (
        <div className="ultra-addon-card">
            <div className="ultra-addon-card-header">
                <Forms.Title tag="h3" className="ultra-addon-card-name">{baseAddon.name}</Forms.Title>
                <Badge color={BadgeColors.BLUE}>{baseAddon.version}</Badge>
                <div className="ultra-switch-container">
                    <Switch disabled={!(baseAddon.config?.canDisable ?? true)} checked={(baseAddon.config?.canDisable ?? true) ? enabled : true} onChange={handleSwitch}/>
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
                    <ActionButton onClick={togglePower} tooltip={"Power " + (power ? "On" : "Off")} key="power">
                        <Power class={power ? "power-enabled" : "power-disabled"} />
                    </ActionButton>
                </div>
            </div>
        </div>
    );
}
