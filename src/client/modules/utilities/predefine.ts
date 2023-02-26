export default function predefine(target: any, prop: string, effect: (value?: any) => void) {
    const value = target[prop];
    Object.defineProperty(target, prop, {
        get() {return value;},
        set(newValue) {
            Object.defineProperty(target, prop, {
                value: newValue,
                configurable: true,
                enumerable: true,
                writable: true
            });

            try {
                effect(newValue);
            } catch (error) {
                console.error(error);
            }

            return newValue;
        },
        configurable: true
    });
};
