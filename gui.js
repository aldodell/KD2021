"use strict";

var kdId = 0;

class KDObject {
    constructor(properties) {
        this.id = "";
        this.properties = properties;
        this.apply(properties);
        this.setId();
    }

    apply(properties) {
        if (properties != undefined) {
            for (let key of Object.keys(properties)) {
                this[key] = properties[key];
            }
        }
    }

    storeIn(name) {
        window[name] = this;
        return this;
    }

    setId() {
        let id = "KD_" + (++kdId).toString();
        this.id = id;
        if (this.dom != undefined) {
            this.dom.setAttribute("id", this.id);
        }
    }

    className() {
        return this.constructor.name;
    }

    clone() {
        return new this.constructor(this.properties);
    }

}

class KDComponent extends KDObject {
    constructor(properties, htmlClass, htmlType) {
        super(properties);

        if (htmlClass != undefined) {
            this.dom = document.createElement(htmlClass);
            this.dom.setAttribute("id", this.id);
        }

        if (htmlType != undefined) {
            this.dom.setAttribute("type", htmlType);
        }
        this.value = undefined;
        this.name = "";
        this.eventHandlers = [];
        this.parent = undefined;

    }

    publish(comp) {
        if (comp == undefined) {
            comp = {};
            comp.dom = document.getElementsByTagName("body")[0];
        }

        comp.dom.appendChild(this.dom);
        return this;
    }

    setValuePrefix(prefix) {
        this.valuePrefix = prefix;
        return this;
    }

    setValueSuffix(suffix) {
        this.valueSuffix = suffix;
        return this;
    }

    completeValue(value) {
        if (this.valuePrefix != undefined) value = this.valuePrefix + value;
        if (this.valueSuffix != undefined) value = value + this.valuePrefix;
        return value;
    }

    setValue(value) {
        this.value = value;
        this.dom.value = this.completeValue(value);
        return this;
    }

    clone() {
        let o = super.clone();
        o.dom = this.dom.cloneNode(false);
        o.dom.setAttribute("id", o.id);
        o.attachEvents(this.eventHandlers);
        if (this.value != undefined) o.setValue(this.value);
        if (this.name != undefined) o.setName(this.name);
        if (this.parent != undefined) o.parent = this.parent;
        o.valuePrefix = this.valuePrefix;
        o.valueSuffix = this.valueSuffix;

        return o;
    }

    addEvent(eventType, handler) {
        this.dom.addEventListener(eventType, handler);
        let ev = { "type": eventType, "handler": handler }
        this.eventHandlers.push(ev);
        return this;

    }

    attachEvents(eventHandlers) {
        for (let ev of eventHandlers) {
            this.addEvent(ev.type, ev.handler)
        }
        return this;
    }

    setName(name) {
        this.name = name;
        this.dom.name = name;
        return this;
    }

}


class KDVisualComponent extends KDComponent {
    constructor(properties, htmlClass, htmlType) {
        super(properties, htmlClass, htmlType);
    }

    setStyle(name, value) {
        this.dom.style[name] = value;
        return this;
    }
}


class KDVisualContainerComponent extends KDVisualComponent {
    constructor(properties, htmlClass, htmlType) {
        if (htmlClass == undefined) htmlClass = "div";
        super(properties, htmlClass, htmlType);
        if (this.components == undefined) this.components = [];
    }

    wrap() {
        for (let component of arguments) {
            if (Array.isArray(component)) {
                for (let comp of this.component) {
                    comp.parent = this;
                    this.components.push(comp);
                    this.dom.appendChild(comp.dom);

                }
            } else {
                component.parent = this;
                this.components.push(component);
                this.dom.appendChild(component.dom);
            }
        }
        return this;
    }


    clone() {
        let obj = super.clone();
        for (let c of this.components) {
            obj.wrap(c.clone());
        }
        return obj;
    }

}



class KDButton extends KDVisualComponent {
    constructor(properties) {
        super(properties, "input", "button");
    }
}

function kdButton(properties) {
    return new KDButton(properties);
}

class KDText extends KDVisualComponent {
    constructor(properties) {
        super(properties, "input", "text");
    }
}

function kdText(properties) {
    return new KDText(properties);
}

class KDLabel extends KDVisualComponent {
    constructor(properties) {
        super(properties, "label");

    }

    setValue(value) {
        this.value = value;
        value = this.completeValue(value);
        this.dom.innerHTML = this.value;
        return this;
    }
}

function kdLabel(properties) {
    return new KDLabel(properties);
}


class KDImage extends KDVisualComponent {
    constructor(properties) {
        super(properties, "img");

    }

    setValue(value) {
        this.value = value;
        value = this.completeValue(value);
        this.dom.src = value;
        return this;
    }
}

function kdImage(properties) {
    return new KDImage(properties);
}


class KDLayer extends KDVisualContainerComponent {
    constructor(properties, htmlClass) {
        super(properties, "div");
        this.name = '*';
    }

    /**
     * Value must be an object with named properties to syncronize with children
     * @param {*} value 
     */
    setValue(data) {
        for (let c of this.components) {
            let name = c.name.trim();
            if (data[name] != undefined) {
                c.setValue(data[name]);
            }
        }
        return this;
    }
}

function kdLayer(properties) {
    return new KDLayer(properties);
}


class KDArrayLayer extends KDVisualContainerComponent {
    constructor(properties) {
        super(properties, "div");
    }

    setValue(data) {
        this.dom.innerHTML = "";
        for (let row of data) {
            for (let c of this.components) {
                c = c.clone();
                let name = c.name.trim();
                if (name == "*") {
                    c.setValue(row);
                } else {
                    c.setValue(row[name]);
                }
                this.dom.appendChild(c.dom);
            }
        }
        return this;
    }

}

function kdArrayLayer(properties) {
    return new KDArrayLayer(properties);
}