import {React} from "@webpack/common";
import "@styles/badge.scss";

export enum BadgeColors {
    RED = "#f04747",
    BLUE = "#0288D1",
    CACTUS = "#C0CA33",
    CUSTOM = ""
}

export default function Badge({children: label, color}: {children: any, color: BadgeColors}) {
    return (
        <div className="ultra-badge" style={{"--color": color} as any}>
            {label}
        </div>
    );
}
