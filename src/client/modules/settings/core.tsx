import {registerSection} from "@settings";
import SettingsView from "../../ui/settings/view";
import AddonView from "../../ui/settings/addons";
import PluginsManager from "@addons/plugins";
import ThemesManager from "@addons/themes";
import {React} from "@webpack/common";

registerSection("core-settings", {
    label: "ultra",
    index() {return 0},
    items: [
        {
            label: "Settings",
            section: "ultra-settings",
            element() {
                return (
                    <SettingsView title="Settings">
                        <span>Settings!</span>
                    </SettingsView>
                );
            }
        },
        {
            label: "Plugins",
            section: "ultra-plugins",
            element() {
                return (
                    <SettingsView title="Plugins">
                        <AddonView manager={PluginsManager.instance()} />
                    </SettingsView>
                );
            }
        },
        {
            label: "Themes",
            section: "ultra-themes",
            element() {
                return (
                    <SettingsView title="Themes">
                        <AddonView manager={ThemesManager.instance()} />
                    </SettingsView>
                );
            }
        },
        {section: "DIVIDER"}
    ]
});
