import PluginsManager from "@addons/plugins";
import ThemesManager from "@addons/themes";
import {React} from "@webpack/common";
import {useView} from "./view";
import AddonCard from "./addoncard";

// TODO: Render controls

export default function AddonView(props: {manager: typeof PluginsManager | typeof ThemesManager}) {
    const ViewAPI = useView();

    React.useEffect(() => {
        try {
            console.log({a: () => ViewAPI.push("Some-Plugin", () => <span>Cool Plugin!</span>)});
        } catch (error) {
            console.error(error);
        }
    }, []);

    return (
        <div className="ultra-addon-page">
            <div className="ultra-addons">
                {Array.from(props.manager.addons.values(), addon => (
                    <AddonCard {...addon} key={addon.id} type={props.manager.prefix} />
                ))}
            </div>
       </div> 
    );
}
